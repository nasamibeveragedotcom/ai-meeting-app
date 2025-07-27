
import React from 'react';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';

interface MobileNavProps {
    activeView: 'settings' | 'meeting';
    onViewChange: (view: 'settings' | 'meeting') => void;
    isMeetingRunning: boolean;
}

const NavButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    showIndicator?: boolean;
}> = ({ label, icon, isActive, onClick, showIndicator }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-1 transition-colors relative ${
            isActive ? 'text-blue-400' : 'text-slate-400 hover:text-white'
        }`}
    >
        {showIndicator && <span className="absolute top-2 right-[calc(50%-2rem)] w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-slate-800"></span>}
        <div className="w-6 h-6">{icon}</div>
        <span className="text-xs font-medium">{label}</span>
    </button>
);


const MobileNav: React.FC<MobileNavProps> = ({ activeView, onViewChange, isMeetingRunning }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-800/90 border-t border-slate-700 backdrop-blur-sm flex justify-around items-stretch z-40">
            <NavButton
                label="Setup"
                icon={<Cog6ToothIcon />}
                isActive={activeView === 'settings'}
                onClick={() => onViewChange('settings')}
            />
            <NavButton
                label="Meeting"
                icon={<ChatBubbleLeftRightIcon />}
                isActive={activeView === 'meeting'}
                onClick={() => onViewChange('meeting')}
                showIndicator={isMeetingRunning}
            />
        </nav>
    );
};

export default MobileNav;
