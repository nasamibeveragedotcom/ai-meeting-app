
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Persona, ChatMessage, ApiKey, ApiKeyStatus } from './types';
import SettingsPanel from './components/SettingsPanel';
import MeetingRoom from './components/MeetingRoom';
import PersonaForm from './components/PersonaForm';
import { createOrchestrator, checkApiKey, RateLimitError } from './services/geminiService';
import MobileNav from './components/MobileNav';

const DEFAULT_PERSONAS: Persona[] = [
  { id: '1', name: 'Alice', role: 'Marketing Director - Focused on strategy and ROI.' },
  { id: '2', name: 'Bob', role: 'Content Creator - Specializes in engaging blog posts and video scripts.' },
  { id: '3', name: 'Charlie', role: 'SEO Specialist - Drives organic traffic and keyword optimization.' },
  { id: '4', name: 'Diana', role: 'Social Media Manager - Manages brand presence on all platforms.' },
];

const createOrchestratorMessage = (text: string): ChatMessage => ({
    personaId: 'orchestrator',
    personaName: 'AI Orchestrator',
    personaRole: 'Meeting Moderator',
    text,
    isOrchestrator: true,
});

type Orchestrator = ReturnType<typeof createOrchestrator>;

const App: React.FC = () => {
  const [username, setUsername] = useState<string>('Guest User');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);
  const [meetingTopic, setMeetingTopic] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isMeetingRunning, setIsMeetingRunning] = useState(false);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [mobileView, setMobileView] = useState<'settings' | 'meeting'>('settings');

  const abortControllerRef = useRef<AbortController | null>(null);
  const orchestratorRef = useRef<Orchestrator | null>(null);
  const meetingStateRef = useRef({
      agenda: [] as string[],
      currentAgendaIndex: 0,
      currentSpeakerIndex: -1,
      userIntervention: null as string | null,
  });


  // Effect to load metadata and update SEO tags
  useEffect(() => {
    const updateMetaTags = (meta: any) => {
        // Helper to create or update a meta tag
        const setMetaTag = (attr: 'name' | 'property', key: string, value: string) => {
            if (!value) return;
            let element = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attr, key);
                document.head.appendChild(element);
            }
            element.setAttribute('content', value);
        };

        if (meta.pageTitle) {
            document.title = meta.pageTitle;
        }

        if (meta.metaDescription) {
            setMetaTag('name', 'description', meta.metaDescription);
        }

        if (meta.openGraph) {
            const ogTitle = meta.openGraph.title || meta.pageTitle;
            const ogDesc = meta.openGraph.description || meta.metaDescription;
            setMetaTag('property', 'og:title', ogTitle);
            setMetaTag('property', 'og:description', ogDesc);
            if (meta.openGraph.image) {
                setMetaTag('property', 'og:image', meta.openGraph.image);
            }
        }
    };

    const fetchMetadata = async () => {
        try {
            const response = await fetch('/metadata.json');
            if(response.ok) {
                const meta = await response.json();
                updateMetaTags(meta);
            } else {
                 console.error("Failed to fetch metadata.json:", response.statusText);
            }
        } catch (error) {
            console.error("Failed to load or apply metadata:", error);
        }
    };

    fetchMetadata();
  }, []);


  // Load initial data from localStorage
  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem('ai-meeting-username');
      if (storedUsername) {
        setUsername(storedUsername);
      }

      const storedPersonas = localStorage.getItem('ai-meeting-personas');
      if (storedPersonas) {
        const parsedPersonas = JSON.parse(storedPersonas);
        if (parsedPersonas.length > 0) setPersonas(parsedPersonas);
        else setPersonas(DEFAULT_PERSONAS);
      } else {
        setPersonas(DEFAULT_PERSONAS);
      }
      
      const storedTopic = localStorage.getItem('ai-meeting-topic');
      setMeetingTopic(storedTopic || "Brainstorm a new marketing campaign for our flagship product 'SynthWave'.");
      
      const storedKeys = localStorage.getItem('ai-meeting-apikeys');
      if(storedKeys) {
        const parsedKeys = JSON.parse(storedKeys);
        // Migration from old string[] format to new ApiKey[] format
        if (parsedKeys.length > 0 && typeof parsedKeys[0] === 'string') {
            const migratedKeys: ApiKey[] = parsedKeys.map((k: string) => ({ id: k, value: k, status: 'unchecked' }));
            setApiKeys(migratedKeys);
        } else {
            setApiKeys(parsedKeys);
        }
      }

    } catch (e) {
      console.error("Failed to parse from localStorage", e);
      setPersonas(DEFAULT_PERSONAS);
      setApiKeys([]);
    }
  }, []);

  // Persist data to localStorage
  useEffect(() => {
    try {
        localStorage.setItem('ai-meeting-username', username);
    } catch (e) { console.error("Failed to save username to localStorage", e); }
  }, [username]);

  useEffect(() => {
    try {
        if (personas.length > 0) localStorage.setItem('ai-meeting-personas', JSON.stringify(personas));
    } catch (e) { console.error("Failed to save personas to localStorage", e); }
  }, [personas]);

  useEffect(() => {
    try {
        localStorage.setItem('ai-meeting-topic', meetingTopic);
    } catch(e) { console.error("Failed to save topic to localStorage", e); }
  }, [meetingTopic]);
  
  useEffect(() => {
    try {
        localStorage.setItem('ai-meeting-apikeys', JSON.stringify(apiKeys));
    } catch(e) { console.error("Failed to save apiKeys to localStorage", e); }
  }, [apiKeys]);


  const runMeetingStep = useCallback(async () => {
    if (!isMeetingRunning || !orchestratorRef.current) return;
    
    if(abortControllerRef.current?.signal.aborted) {
        setIsMeetingRunning(false);
        setIsWaitingForAI(false);
        setChatHistory(prev => [...prev, createOrchestratorMessage("The meeting was stopped by the user.")]);
        return;
    }

    const state = meetingStateRef.current;
    const orchestrator = orchestratorRef.current;
    
    try {
        // Step 1: Generate Agenda if it doesn't exist
        if (state.agenda.length === 0) {
            setIsWaitingForAI(true);
            const agendaItems = await orchestrator.generateAgenda(meetingTopic, abortControllerRef.current!.signal);
            state.agenda = agendaItems;
            setChatHistory(prev => [...prev, createOrchestratorMessage(`**Meeting Agenda:**\n${agendaItems.join('\n')}`)]);
            state.currentAgendaIndex = 0;
            state.currentSpeakerIndex = -1;
            setIsWaitingForAI(false);
        }

        let nextSpeakerIndex = state.currentSpeakerIndex + 1;
        let nextAgendaIndex = state.currentAgendaIndex;

        if (nextSpeakerIndex >= personas.length) {
            nextSpeakerIndex = 0;
            nextAgendaIndex++;
        }

        // Step 3: End of meeting, generate summary
        if (nextAgendaIndex >= state.agenda.length) {
            setChatHistory(prev => [...prev, createOrchestratorMessage("The discussion is complete. The AI Orchestrator will now summarize.")]);
            setIsWaitingForAI(true);
            const summary = await orchestrator.generateSummary(meetingTopic, chatHistory, abortControllerRef.current!.signal);
            setChatHistory(prev => [...prev, createOrchestratorMessage(`**Meeting Summary & Action Items:**\n${summary}`), createOrchestratorMessage("The meeting has concluded.")]);
            setIsMeetingRunning(false);
            setIsWaitingForAI(false);
            return;
        }
        
        if(nextAgendaIndex > state.currentAgendaIndex) {
            setChatHistory(prev => [...prev, createOrchestratorMessage(`Let's now discuss: **${state.agenda[nextAgendaIndex].trim()}**`)]);
        }
        
        state.currentAgendaIndex = nextAgendaIndex;
        state.currentSpeakerIndex = nextSpeakerIndex;

        const currentPersona = personas[state.currentSpeakerIndex];
        const currentAgendaItem = state.agenda[state.currentAgendaIndex];
        
        // Step 2: Generate next turn
        setIsWaitingForAI(true);
        const thinkingMessage: ChatMessage = {
            personaId: currentPersona.id, personaName: currentPersona.name, personaRole: currentPersona.role, text: '', isThinking: true,
        };
        setChatHistory(prev => [...prev, thinkingMessage]);

        const responseText = await orchestrator.generateTurn(currentPersona, meetingTopic, chatHistory, currentAgendaItem, state.userIntervention, abortControllerRef.current!.signal);
        state.userIntervention = null;

        const finalMessage: ChatMessage = { ...thinkingMessage, text: responseText, isThinking: false };
        setChatHistory(prev => [...prev.slice(0, -1), finalMessage]);
        setIsWaitingForAI(false);

    } catch (e: any) {
        if (e.name === 'AbortError') {
             setChatHistory(prev => [...prev.filter(m => !m.isThinking)]);
        } else if (e instanceof RateLimitError) {
            setError(`An error occurred: ${e.message}`);
            // Find the key and mark it as rate-limited
            const failingKey = apiKeys.find(k => k.value === e.failingKey);
            if (failingKey) {
                // Set to rate-limited and schedule a reset after 60 seconds
                setApiKeys(prevKeys => prevKeys.map(k => k.id === failingKey.id ? { ...k, status: 'rate-limited' } : k));
                setTimeout(() => {
                    setApiKeys(prevKeys => prevKeys.map(k => k.id === failingKey.id ? { ...k, status: 'active' } : k));
                }, 60000); // 60 second cooldown
            }
        } else {
            console.error("An error occurred during the meeting:", e);
            setError(`An unexpected error occurred: ${e.message}`);
        }
        setChatHistory(prev => [...prev.filter(m => !m.isThinking)]);
        setIsMeetingRunning(false);
        setIsWaitingForAI(false);
    }
  }, [isMeetingRunning, meetingTopic, personas, chatHistory, apiKeys]);

  useEffect(() => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (isMeetingRunning && !isWaitingForAI && (!lastMessage || !lastMessage.isThinking)) {
        // Introduce a delay between turns to avoid hitting API rate limits
        // and to make the conversation flow more naturally.
        const timer = setTimeout(() => runMeetingStep(), 5000);
        return () => clearTimeout(timer);
    }
  }, [chatHistory, isMeetingRunning, isWaitingForAI, runMeetingStep]);


  const handleStartMeeting = () => {
    const hasActiveKey = apiKeys.some(k => k.status === 'active');
    if (isMeetingRunning || !hasActiveKey) {
        if(!hasActiveKey) setError("Please add and verify at least one active API key to start.");
        return;
    }
    setError(null);
    setChatHistory([]);
    abortControllerRef.current = new AbortController();
    orchestratorRef.current = createOrchestrator(apiKeys);
    meetingStateRef.current = { agenda: [], currentAgendaIndex: 0, currentSpeakerIndex: -1, userIntervention: null };
    setChatHistory([createOrchestratorMessage("The meeting will now begin. The AI Orchestrator is generating an agenda...")]);
    setIsMeetingRunning(true);
    if(window.innerWidth < 768) setMobileView('meeting'); // Switch to meeting view on mobile when starting
  };

  const handleStopMeeting = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsMeetingRunning(false);
    setIsWaitingForAI(false);
  };
  
  const handleResetMeeting = () => {
    handleStopMeeting();
    setChatHistory([]);
    setError(null);
  };

  const handleSendMessage = (text: string) => {
    if (!isMeetingRunning || isWaitingForAI) return;
    
    const userMessage: ChatMessage = {
        personaId: 'user', personaName: 'You', personaRole: 'Facilitator', text, isUser: true,
    };
    meetingStateRef.current.userIntervention = text;
    setChatHistory(prev => [...prev, userMessage]);
  };

  const handleSavePersona = (persona: Persona) => {
    const index = personas.findIndex(p => p.id === persona.id);
    setPersonas(prev => index > -1 ? [...prev.slice(0, index), persona, ...prev.slice(index + 1)] : [...prev, persona]);
  };

  const handleDeletePersona = (id: string) => {
    if (window.confirm('Are you sure you want to delete this persona?')) {
        setPersonas(personas.filter(p => p.id !== id));
    }
  };

  const handleAddPersonaClick = () => { setPersonaToEdit(null); setIsFormOpen(true); };
  const handleEditPersonaClick = (persona: Persona) => { setPersonaToEdit(persona); setIsFormOpen(true); };

  const handleAddApiKey = (key: string) => {
    if (!apiKeys.some(k => k.value === key)) {
      const newKey: ApiKey = { id: key, value: key, status: 'unchecked' };
      setApiKeys(prev => [...prev, newKey]);
    } else {
      alert('This API key has already been added.');
    }
  };
  
  const handleDeleteApiKey = (idToDelete: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== idToDelete));
  };

  const handleCheckApiKey = async (id: string) => {
    const keyToCheck = apiKeys.find(k => k.id === id);
    if (!keyToCheck) return;

    setApiKeys(prev => prev.map(k => k.id === id ? {...k, status: 'checking'} : k));
    const status = await checkApiKey(keyToCheck.value);
    setApiKeys(prev => prev.map(k => k.id === id ? {...k, status} : k));
  };

  const handleUsernameChange = (name: string) => {
    setUsername(name);
  };


  return (
    <div className="h-screen w-screen bg-slate-900 font-sans antialiased">
      <div className="relative flex h-full w-full flex-col md:flex-row pb-16 md:pb-0">
        {/* Settings Panel: visible on desktop, or on mobile if mobileView is 'settings' */}
        <div className={`h-full w-full flex-col md:w-96 lg:w-[420px] md:flex-shrink-0 md:border-r md:border-slate-700/60 ${mobileView === 'settings' ? 'flex' : 'hidden md:flex'}`}>
          <SettingsPanel
            username={username}
            onUsernameChange={handleUsernameChange}
            personas={personas}
            onAddPersona={handleAddPersonaClick}
            onEditPersona={handleEditPersonaClick}
            onDeletePersona={handleDeletePersona}
            meetingTopic={meetingTopic}
            onMeetingTopicChange={setMeetingTopic}
            apiKeys={apiKeys}
            onAddApiKey={handleAddApiKey}
            onDeleteApiKey={handleDeleteApiKey}
            onCheckApiKey={handleCheckApiKey}
            onStartMeeting={handleStartMeeting}
            onStopMeeting={handleStopMeeting}
            onResetMeeting={handleResetMeeting}
            isMeetingRunning={isMeetingRunning}
            error={error}
          />
        </div>
        
        {/* Meeting Room: visible on desktop, or on mobile if mobileView is 'meeting' */}
        <div className={`h-full w-full flex-1 flex-col ${mobileView === 'meeting' ? 'flex' : 'hidden md:flex'}`}>
          <MeetingRoom
            chatHistory={chatHistory}
            isMeetingRunning={isMeetingRunning}
            isWaitingForAI={isWaitingForAI}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
      
      <MobileNav 
        activeView={mobileView} 
        onViewChange={setMobileView}
        isMeetingRunning={isMeetingRunning}
      />

      <PersonaForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSavePersona}
        personaToEdit={personaToEdit}
      />
    </div>
  );
};

export default App;
