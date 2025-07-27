import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Persona, ChatMessage, ApiKey } from '../types';

export class RateLimitError extends Error {
    public failingKey: string;
    constructor(message: string, failingKey: string) {
        super(message);
        this.name = 'RateLimitError';
        this.failingKey = failingKey;
    }
}

// Helper class to manage API keys in a round-robin fashion.
class ApiKeyManager {
    private keys: ApiKey[];
    private currentIndex: number = 0;

    constructor(keys: ApiKey[]) {
        // Only consider active keys for meetings
        this.keys = keys.filter(k => k.status === 'active' && k.value.trim() !== '');
    }

    /**
     * Gets the next active key in a round-robin fashion.
     * @returns The next API key object or null if no active keys are available.
     */
    public getNextKey(): ApiKey | null {
        if (this.getAvailableKeyCount() === 0) {
            return null;
        }
        const key = this.keys[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        return key;
    }

    /**
     * Returns the number of available (active) API keys.
     */
    public getAvailableKeyCount(): number {
        return this.keys.length;
    }
}


const formatHistory = (history: ChatMessage[]): string => {
    if (history.length === 0) return "No discussion has happened yet.";
    return history
      .filter(msg => !msg.isOrchestrator) // Don't include orchestrator messages in history for personas
      .map(msg => {
          if (msg.isUser) {
              return `Facilitator (Human): ${msg.text}`;
          }
          return `${msg.personaName} (${msg.personaRole}): ${msg.text}`;
      })
      .join('\n\n');
};


/**
 * Factory function to create a meeting orchestrator instance.
 * This instance is configured with a list of API keys and will rotate them if rate limits are hit.
 * @param apiKeys - An array of user-provided Google Gemini API keys.
 * @returns An orchestrator object with methods to generate meeting content.
 */
export const createOrchestrator = (apiKeys: ApiKey[]) => {
    const apiKeyManager = new ApiKeyManager(apiKeys);

    /**
     * Makes a request to the Gemini API, with built-in retry logic for transient errors
     * and automatic key rotation for rate-limit errors.
     */
    const generateContentWithRetry = async (
        prompt: string,
        systemInstruction: string,
        signal: AbortSignal
    ): Promise<GenerateContentResponse> => {
        const totalKeys = apiKeyManager.getAvailableKeyCount();
        if (totalKeys === 0) {
            throw new Error("No active API keys available. Please check your keys' statuses.");
        }

        let lastError: any = new Error("API call failed for all provided keys.");
        
        for (let keyAttempt = 0; keyAttempt < totalKeys; keyAttempt++) {
            const apiKeyObj = apiKeyManager.getNextKey();
            if (!apiKeyObj) continue; 
            const apiKey = apiKeyObj.value;

            if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
            
            try {
                const ai = new GoogleGenAI({ apiKey });
                return await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        systemInstruction: systemInstruction,
                        temperature: 0.7,
                        thinkingConfig: { thinkingBudget: 0 }
                    },
                });
            } catch (e: any) {
                lastError = e; 
                const errorMessage = (typeof e.message === 'string' ? e.message : JSON.stringify(e)).toLowerCase();
                const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('resource_exhausted');
                
                if (isRateLimitError) {
                    console.warn(`Key ending in ...${apiKey.slice(-4)} was rate-limited. Switching to the next available key.`);
                    continue; 
                }
                
                console.error(`An unrecoverable error occurred with key ...${apiKey.slice(-4)}:`, e);
                // For other errors, we assume the key is invalid and throw a specific error.
                throw new RateLimitError(`API call failed for key ...${apiKey.slice(-4)}. It might be invalid.`, apiKey);
            }
        }
        
        console.error("All active API keys are currently rate-limited.", lastError);
        const lastAttemptedKey = apiKeyManager.getNextKey()?.value; // Get one key to report failure on
        throw new RateLimitError(
            "All API keys are currently rate-limited. Please wait a while or add a new key.",
            lastAttemptedKey || ''
        );
    };

    const generateAgenda = async (topic: string, signal: AbortSignal): Promise<string[]> => {
        const prompt = `Based on the following meeting topic, create a concise 3-point agenda. Respond with only the agenda, with each point on a new line starting with a number (e.g., '1. Item one'). Do not add any preamble.\n\nTopic: "${topic}"`;
        const response = await generateContentWithRetry(prompt, "You are a meeting facilitator who creates clear agendas.", signal);
        return response.text.split('\n').filter(item => item.trim().length > 1);
    };

    const generateTurn = async (
        persona: Persona,
        topic: string,
        history: ChatMessage[],
        currentAgendaItem: string,
        userIntervention: string | null,
        signal: AbortSignal,
    ): Promise<string> => {
        const systemInstruction = `You are an AI assistant role-playing as a marketing professional in a meeting.
        Your Name: ${persona.name}
        Your Role: ${persona.role}
        Your personality should reflect your role. Be collaborative but also bring your unique perspective.
        Keep your responses concise and to the point, focusing on moving the discussion forward.`;

        const conversationHistory = formatHistory(history);

        const interventionPrompt = userIntervention
            ? `\n**IMPORTANT: The human facilitator has just interjected with the following instruction or question. Make sure your response addresses it directly:** "${userIntervention}"\n`
            : '';

        const prompt = `
        **Meeting Topic:** ${topic}
        **Current Agenda Item:** ${currentAgendaItem}
        **Conversation History So Far:**
        ${conversationHistory}
        ${interventionPrompt}
        **Your Task:**
        You are ${persona.name}. Based on the history, the current agenda item, and the facilitator's latest instruction (if any), provide your contribution to the discussion.`;

        const response = await generateContentWithRetry(prompt, systemInstruction, signal);
        return response.text;
    };

    const generateSummary = async (topic: string, history: ChatMessage[], signal: AbortSignal): Promise<string> => {
        const prompt = `Based on the entire conversation history provided for the topic "${topic}", create a final summary. The summary should include:\n1. A brief overview of the discussion.\n2. A bulleted list of 3-4 key takeaways.\n3. A bulleted list of proposed action items.\n\n**Conversation History:**\n${formatHistory(history)}`;
        const response = await generateContentWithRetry(prompt, "You are a meeting assistant who writes clear, concise summaries.", signal);
        return response.text;
    };

    return {
        generateAgenda,
        generateTurn,
        generateSummary,
    };
};


/**
 * Checks the validity of a single API key by making a lightweight request.
 * @param apiKey - The API key string to check.
 * @returns 'active' if the key is valid, 'invalid' otherwise.
 */
export const checkApiKey = async (apiKey: string): Promise<'active' | 'invalid'> => {
    if (!apiKey || apiKey.trim() === '') return 'invalid';
    try {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "hello",
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return 'active';
    } catch (e) {
        console.error(`API Key check failed for key ending in ...${apiKey.slice(-4)}`, e);
        return 'invalid';
    }
};
