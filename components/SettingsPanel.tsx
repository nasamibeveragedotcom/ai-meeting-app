
import React, { useState, useEffect } from 'react';
import { Persona, ApiKey, ApiKeyStatus } from '../types';
import UserPlusIcon from './icons/UserPlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import KeyIcon from './icons/KeyIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import UserCircleIcon from './icons/UserCircleIcon';

interface SettingsPanelProps {
  username: string;
  onUsernameChange: (name: string) => void;
  personas: Persona[];
  onAddPersona: () => void;
  onEditPersona: (persona: Persona) => void;
  onDeletePersona: (id: string) => void;
  meetingTopic: string;
  onMeetingTopicChange: (topic: string) => void;
  apiKeys: ApiKey[];
  onAddApiKey: (key: string) => void;
  onDeleteApiKey: (id: string) => void;
  onCheckApiKey: (id: string) => void;
  onStartMeeting: () => void;
  onStopMeeting: () => void;
  onResetMeeting: () => void;
  isMeetingRunning: boolean;
  error: string | null;
}


const ApiKeyStatusIndicator: React.FC<{ status: ApiKeyStatus }> = ({ status }) => {
  const statusConfig = {
    unchecked: { color: 'bg-slate-500', label: 'Unchecked' },
    checking: { color: 'bg-blue-500', label: 'Checking...' },
    active: { color: 'bg-green-500', label: 'Active' },
    'rate-limited': { color: 'bg-yellow-500', label: 'Rate-limited' },
    invalid: { color: 'bg-red-500', label: 'Invalid' },
  };
  const { color, label } = statusConfig[status];

  return (
    <div className="flex items-center gap-2" title={label}>
      <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
      <span className="text-xs text-slate-400 hidden sm:inline">{label}</span>
      {status === 'checking' && <SpinnerIcon className="w-3 h-3"/>}
    </div>
  );
};


const ApiKeyRow: React.FC<{ apiKey: ApiKey; onDelete: (id: string) => void; onCheck: (id: string) => void; disabled: boolean }> = ({ apiKey, onDelete, onCheck, disabled }) => {
  const masked = `${apiKey.value.substring(0, 4)}...${apiKey.value.substring(apiKey.value.length - 4)}`;
  
  return (
    <div className="bg-slate-700/80 p-2 rounded-md flex justify-between items-center text-sm gap-2">
      <div className="flex items-center gap-2 flex-shrink min-w-0">
        <KeyIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="font-mono text-slate-300 truncate" title={apiKey.value}>{masked}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <ApiKeyStatusIndicator status={apiKey.status} />
        <button onClick={() => onCheck(apiKey.id)} disabled={disabled || apiKey.status === 'checking'} className="text-slate-400 hover:text-blue-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors" title="Check Status">
            <CheckCircleIcon className="w-5 h-5" />
        </button>
        <button onClick={() => onDelete(apiKey.id)} disabled={disabled} className="text-slate-400 hover:text-red-500 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors" title="Delete Key">
          <TrashIcon className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );
};


const SettingsPanel: React.FC<SettingsPanelProps> = ({
  username,
  onUsernameChange,
  personas,
  onAddPersona,
  onEditPersona,
  onDeletePersona,
  meetingTopic,
  onMeetingTopicChange,
  apiKeys,
  onAddApiKey,
  onDeleteApiKey,
  onCheckApiKey,
  onStartMeeting,
  onStopMeeting,
  onResetMeeting,
  isMeetingRunning,
  error
}) => {
  const [newApiKey, setNewApiKey] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const hasActiveKey = apiKeys.some(k => k.status === 'active');
  const canStartMeeting = personas.length > 0 && meetingTopic.trim().length > 0 && hasActiveKey;

  useEffect(() => {
    if (!isEditingUsername) {
        setNewUsername(username);
    }
  }, [username, isEditingUsername]);

  const handleUsernameSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      onUsernameChange(newUsername.trim());
      setIsEditingUsername(false);
    }
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newApiKey.trim()) {
      onAddApiKey(newApiKey.trim());
      setNewApiKey('');
    }
  }

  return (
    <aside className="w-full bg-slate-800 p-4 md:p-6 flex flex-col h-full">
      <div className="flex-shrink-0">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-700">
          <UserCircleIcon className="w-12 h-12 text-slate-500 flex-shrink-0" />
          <div>
            {isEditingUsername ? (
              <form onSubmit={handleUsernameSave} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-white w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onBlur={() => setIsEditingUsername(false)}
                />
                <button type="submit" className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors" aria-label="Save username">
                  <CheckCircleIcon className="w-4 h-4"/>
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{username}</h1>
                <button onClick={() => setIsEditingUsername(true)} className="text-slate-400 hover:text-white transition-colors" aria-label="Edit username">
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Your settings & API keys are saved locally.</p>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Meeting Setup</h2>
        <p className="text-sm text-slate-400 mb-6">Define your AI team and meeting agenda.</p>
      </div>
      
      <div className="flex-grow flex flex-col gap-6 overflow-y-auto -mr-2 pr-2">
        {/* Personas Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-slate-200">AI Personas ({personas.length})</h2>
            <button
              onClick={onAddPersona}
              disabled={isMeetingRunning}
              className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
              aria-label="Add new persona"
            >
              <UserPlusIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {personas.length === 0 && (
              <div className="text-center py-4 px-2 bg-slate-700/80 rounded-md text-slate-400">
                <p>No personas added yet.</p>
                <p className="text-sm">Click '+' to add one.</p>
              </div>
            )}
            {personas.map(p => (
              <div key={p.id} className="bg-slate-700/80 p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onEditPersona(p)} disabled={isMeetingRunning} className="text-slate-400 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"><PencilIcon /></button>
                  <button onClick={() => onDeletePersona(p.id)} disabled={isMeetingRunning} className="text-slate-400 hover:text-red-500 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"><TrashIcon /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* API Keys Section */}
        <div>
           <h2 className="text-lg font-semibold text-slate-200 mb-3">API Keys ({apiKeys.length})</h2>
           <div className="space-y-2 mb-3">
             {apiKeys.length === 0 && (
                <div className="text-center py-4 px-2 bg-slate-700/80 rounded-md text-slate-400">
                  <p>No API keys added.</p>
                  <p className="text-sm">Add & check a key to start.</p>
                </div>
              )}
             {apiKeys.map(key => <ApiKeyRow key={key.id} apiKey={key} onDelete={onDeleteApiKey} onCheck={onCheckApiKey} disabled={isMeetingRunning} />)}
           </div>
           <form onSubmit={handleAddKey} className="flex gap-2">
             <input 
              type="text"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              disabled={isMeetingRunning}
              placeholder="Add new API key..."
              className="flex-grow bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
             />
             <button type="submit" disabled={isMeetingRunning || !newApiKey.trim()} className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">Add</button>
           </form>
        </div>

        {/* Meeting Topic Section */}
        <div>
          <h2 className="text-lg font-semibold text-slate-200 mb-3">Meeting Topic</h2>
          <textarea
            value={meetingTopic}
            onChange={(e) => onMeetingTopicChange(e.target.value)}
            disabled={isMeetingRunning}
            placeholder="Enter the main topic or question for the meeting..."
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none disabled:bg-slate-700/50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
      
      <div className="flex-shrink-0">
        {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-md">{error}</div>}

        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="flex items-center gap-2">
              {isMeetingRunning ? (
                   <button
                      onClick={onStopMeeting}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-500 transition-colors"
                  >
                      <StopIcon className="w-5 h-5"/>
                      Stop Meeting
                  </button>
              ) : (
                  <button
                      onClick={onStartMeeting}
                      disabled={!canStartMeeting}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                      aria-label={!canStartMeeting ? 'Please add personas, a topic, and at least one active API key to start.' : 'Start Meeting'}
                  >
                      <PlayIcon className="w-5 h-5"/>
                      Start Meeting
                  </button>
              )}
              <button 
                  onClick={onResetMeeting} 
                  disabled={isMeetingRunning}
                  className="p-3 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed" 
                  aria-label="Reset Meeting"
              >
                  <ArrowPathIcon className="w-5 h-5"/>
              </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SettingsPanel;
