
import React from 'react';
import Header from './components/Header';
import PronunciationLab from './components/PronunciationLab';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col items-center">
        {/* Simple Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
            How clear is your <span className="text-indigo-600">English?</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
            วัดระดับความชัดเจนในการออกเสียงของคุณด้วย AI <br/>
            เพียงเลือกประโยคแล้วเริ่มพูดได้เลย!
          </p>
        </div>

        {/* Primary Lab Component */}
        <section className="w-full">
          <PronunciationLab />
        </section>

        {/* Navigation / Other features minimized */}
        <div className="mt-16 flex items-center space-x-8 opacity-40 hover:opacity-100 transition-opacity">
          <button className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600">Free Talk Mode</button>
          <button className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600">Vocab Builder</button>
          <button className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-indigo-600">Visual Lab</button>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100 mt-12">
        <div className="text-center">
          <p className="text-gray-300 text-[10px] font-mono uppercase tracking-[0.3em]">
            Powered by Gemini AI • © 2025 TALK TO MEE!
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
