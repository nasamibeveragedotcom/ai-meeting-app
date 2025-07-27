
export interface Persona {
  id: string;
  name: string;
  role: string;
}

export interface ChatMessage {
  personaId: string;
  personaName: string;
  personaRole: string;
  text: string;
  isThinking?: boolean;
  isOrchestrator?: boolean;
  isUser?: boolean;
}

export type ApiKeyStatus = 'unchecked' | 'checking' | 'active' | 'rate-limited' | 'invalid';

export interface ApiKey {
  id: string;
  value: string;
  status: ApiKeyStatus;
}
