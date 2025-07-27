
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import SendIcon from './icons/SendIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import GuidePanel from './GuidePanel';
import BookOpenIcon from './icons/BookOpenIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';


interface MeetingRoomProps {
  chatHistory: ChatMessage[];
  isMeetingRunning: boolean;
  isWaitingForAI: boolean;
  onSendMessage: (message: string) => void;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

const PersonaAvatar: React.FC<{ name: string }> = ({ name }) => {
    const colors = ['bg-pink-600', 'bg-purple-600', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500', 'bg-indigo-500'];
    const colorIndex = (name.charCodeAt(0) || 0) % colors.length;
    return (
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${colors[colorIndex]}`}>
            {getInitials(name)}
        </div>
    );
};

const OrchestratorMessage: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div className="py-2">
        <div className="text-center text-sm text-slate-400 italic bg-slate-800/50 border-y border-slate-700/50 py-3 px-4">
            <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-300">$1</strong>') }}></p>
        </div>
    </div>
);


const UserMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <div className="flex items-start gap-4 justify-end">
        <div className="flex-1 bg-blue-600 rounded-lg rounded-tr-none p-4 max-w-xl">
            <p className="font-bold text-white">You</p>
            <p className="text-blue-100 whitespace-pre-wrap">{message.text}</p>
        </div>
        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-600 text-slate-300">
            <UserCircleIcon className="w-7 h-7" />
        </div>
    </div>
);


const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    if (message.isThinking) {
        return (
            <div className="flex items-start gap-4 animate-pulse max-w-xl">
                <PersonaAvatar name={message.personaName} />
                <div className="flex-1 bg-slate-700 rounded-lg rounded-tl-none p-4">
                    <p className="font-bold text-white">{message.personaName}</p>
                    <p className="text-sm text-slate-400 mb-2">{message.personaRole}</p>
                    <div className="flex items-center gap-2 text-slate-400">
                      <SpinnerIcon className="w-4 h-4" />
                      <span>Thinking...</span>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex items-start gap-4 max-w-xl">
            <PersonaAvatar name={message.personaName} />
            <div className="flex-1 bg-slate-700 rounded-lg rounded-tl-none p-4">
                <p className="font-bold text-white">{message.personaName}</p>
                <p className="text-sm text-slate-400 mb-2">{message.personaRole}</p>
                <p className="text-slate-300 whitespace-pre-wrap">{message.text}</p>
            </div>
        </div>
    );
};

const InterventionForm: React.FC<{ isEnabled: boolean; onSendMessage: (message: string) => void; }> = ({ isEnabled, onSendMessage }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && isEnabled) {
            onSendMessage(text.trim());
            setText('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="p-4 border-t border-slate-700 bg-slate-800">
            <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-4xl mx-auto">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isEnabled ? "Interject with a question or comment..." : "Wait for the current turn to finish..."}
                    rows={1}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg py-2 px-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-700/50 disabled:cursor-not-allowed"
                    disabled={!isEnabled}
                />
                <button type="submit" className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors" disabled={!isEnabled || !text.trim()}>
                    <SendIcon className="w-6 h-6" />
                </button>
            </form>
        </div>
    )
}

const TabButton: React.FC<{label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors
            ${isActive
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
            }
        `}
    >
        {icon}
        {label}
    </button>
);

const MeetingRoom: React.FC<MeetingRoomProps> = ({ chatHistory, isMeetingRunning, isWaitingForAI, onSendMessage }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'meeting' | 'guide'>('meeting');

    useEffect(() => {
        if(activeTab === 'meeting'){
            endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, activeTab]);

  return (
    <main className="flex-1 bg-slate-900 flex flex-col h-full">
        <div className="flex-shrink-0 border-b border-slate-700 bg-slate-800/50">
            <nav className="flex items-center gap-2 px-4">
                <TabButton
                    label="Meeting Room"
                    icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
                    isActive={activeTab === 'meeting'}
                    onClick={() => setActiveTab('meeting')}
                />
                <TabButton
                    label="Guide"
                    icon={<BookOpenIcon className="w-5 h-5" />}
                    isActive={activeTab === 'guide'}
                    onClick={() => setActiveTab('guide')}
                />
            </nav>
        </div>

      {activeTab === 'meeting' ? (
          <>
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                        <h2 className="text-2xl font-semibold">Meeting Room is Empty</h2>
                        <p className="mt-2">Configure your settings, then press "Start Meeting".</p>
                        <p className="mt-2 text-sm">Check the "Guide" tab for instructions.</p>
                    </div>
                    ) : (
                    <div className="space-y-6">
                        {chatHistory.map((msg, index) => {
                            if (msg.isUser) return <UserMessageBubble key={index} message={msg} />
                            if (msg.isOrchestrator) return <OrchestratorMessage key={index} message={msg} />
                            return <ChatBubble key={index} message={msg} />
                        })}
                        <div ref={endOfMessagesRef} />
                    </div>
                    )}
                </div>
            </div>
            {isMeetingRunning && (
                <InterventionForm isEnabled={!isWaitingForAI} onSendMessage={onSendMessage} />
            )}
        </>
      ) : (
        <GuidePanel />
      )}
    </main>
  );
};

export default MeetingRoom;
