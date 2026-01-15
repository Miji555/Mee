
import React from 'react';
import { AppMode } from '../types';

interface HeaderProps {
  onNavigate: (mode: AppMode | 'DASHBOARD') => void;
  activeMode: AppMode | 'DASHBOARD';
}

const Header: React.FC<HeaderProps> = ({ onNavigate, activeMode }) => {
  const navItems = [
    { label: 'Lab', mode: AppMode.PRACTICE_TEXT },
    { label: 'Chat', mode: AppMode.CONVERSATION },
    { label: 'Vocab', mode: AppMode.VOCABULARY },
    { label: 'Visual', mode: AppMode.IMAGE_LEARNING },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button 
            onClick={() => onNavigate('DASHBOARD')}
            className="flex items-center space-x-3 group"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:scale-105 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">talk to mee!</span>
          </button>
          
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.mode}
                onClick={() => onNavigate(item.mode)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeMode === item.mode 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                AI Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
