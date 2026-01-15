
import React, { useState } from 'react';
import Header from './components/Header';
import PronunciationLab from './components/PronunciationLab';
import Conversation from './components/Conversation';
import PracticeTools from './components/PracticeTools';
import ImageVisualizer from './components/ImageVisualizer';
import { AppMode } from './types';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode | 'DASHBOARD'>('DASHBOARD');

  const renderContent = () => {
    switch (activeMode) {
      case AppMode.CONVERSATION:
        return <section className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500"><Conversation /></section>;
      case AppMode.PRACTICE_TEXT:
        return <section className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500"><PronunciationLab /></section>;
      case AppMode.VOCABULARY:
        return <section className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500"><PracticeTools /></section>;
      case AppMode.IMAGE_LEARNING:
        return <section className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500"><ImageVisualizer /></section>;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl animate-in fade-in duration-700">
            <DashboardCard 
              title="Pronunciation Lab" 
              desc="Master your accent with real-time feedback and automatic AI scoring."
              icon={<MicIcon />}
              onClick={() => setActiveMode(AppMode.PRACTICE_TEXT)}
              color="indigo"
            />
            <DashboardCard 
              title="Live AI Chat" 
              desc="Practice natural conversations with a friendly AI tutor anytime."
              icon={<ChatIcon />}
              onClick={() => setActiveMode(AppMode.CONVERSATION)}
              color="emerald"
            />
            <DashboardCard 
              title="Vocab Builder" 
              desc="Learn words and sentences tailored to your specific interests."
              icon={<BookIcon />}
              onClick={() => setActiveMode(AppMode.VOCABULARY)}
              color="amber"
            />
            <DashboardCard 
              title="Visual English Lab" 
              desc="Describe and transform images using your English creative skills."
              icon={<ImageIcon />}
              onClick={() => setActiveMode(AppMode.IMAGE_LEARNING)}
              color="rose"
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header onNavigate={(mode) => setActiveMode(mode)} activeMode={activeMode} />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col items-center">
        {activeMode === 'DASHBOARD' && (
          <div className="text-center mb-16 max-w-2xl">
            <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Talk to <span className="text-indigo-600">Mee!</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Your personal AI-powered English laboratory. Master pronunciation, 
              fluency, and vocabulary through immersive technology.
            </p>
          </div>
        )}

        {activeMode !== 'DASHBOARD' && (
          <button 
            onClick={() => setActiveMode('DASHBOARD')}
            className="mb-8 flex items-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors self-start ml-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </button>
        )}

        {renderContent()}
      </main>

      <footer className="py-12 border-t border-slate-100 mt-12 bg-white">
        <div className="text-center">
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">
            Powered by Gemini AI • High-Performance English Learning
          </p>
        </div>
      </footer>
    </div>
  );
};

const DashboardCard = ({ title, desc, icon, onClick, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-600 shadow-indigo-100 hover:shadow-indigo-200',
    emerald: 'bg-emerald-600 shadow-emerald-100 hover:shadow-emerald-200',
    amber: 'bg-amber-500 shadow-amber-100 hover:shadow-amber-200',
    rose: 'bg-rose-500 shadow-rose-100 hover:shadow-rose-200',
  };

  return (
    <button 
      onClick={onClick}
      className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-start text-left hover:scale-[1.02] transition-all duration-300"
    >
      <div className={`${colors[color]} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
      <div className="mt-8 flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Start Training
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      </div>
    </button>
  );
};

const MicIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const ChatIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const BookIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const ImageIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

export default App;
