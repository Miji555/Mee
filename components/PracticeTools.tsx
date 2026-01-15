
import React, { useState } from 'react';
import { generateVocab, generatePracticeSentences } from '../services/geminiService';
import { VocabItem, PracticeSentence } from '../types';

const PracticeTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'sentences'>('vocab');
  const [category, setCategory] = useState('Travel');
  const [topic, setTopic] = useState('Ordering food at a restaurant');
  const [loading, setLoading] = useState(false);
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
  const [sentences, setSentences] = useState<PracticeSentence[]>([]);

  const handleGenerateVocab = async () => {
    setLoading(true);
    const data = await generateVocab(category);
    setVocabItems(data);
    setLoading(false);
  };

  const handleGenerateSentences = async () => {
    setLoading(true);
    const data = await generatePracticeSentences(topic);
    setSentences(data);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
      <div className="bg-amber-500 p-8 text-white">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Vocab Builder</h2>
        <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Smart Resource Generator</p>
      </div>

      <div className="p-8 md:p-12">
        <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-10 border border-slate-100">
          <button 
            onClick={() => setActiveTab('vocab')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'vocab' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400 hover:text-amber-600'}`}
          >
            Word Lists
          </button>
          <button 
            onClick={() => setActiveTab('sentences')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sentences' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400 hover:text-amber-600'}`}
          >
            Practice Sentences
          </button>
        </div>

        {activeTab === 'vocab' ? (
          <div className="space-y-8">
            <div className="flex bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm">
              <input 
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Workplace, Hobbies, Science..."
                className="flex-1 px-4 py-3 outline-none text-slate-700 font-bold"
              />
              <button 
                disabled={loading}
                onClick={handleGenerateVocab}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all"
              >
                {loading ? '...' : 'Generate'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
              {vocabItems.map((item, idx) => (
                <div key={idx} className="p-6 bg-amber-50 rounded-[1.5rem] border-2 border-amber-100 group hover:border-amber-300 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-2xl font-black text-amber-900 tracking-tight">{item.word}</h4>
                    <span className="text-[10px] bg-amber-200 text-amber-800 px-3 py-1 rounded-full uppercase font-black tracking-widest">{item.translation}</span>
                  </div>
                  <p className="text-amber-700 font-bold italic leading-relaxed">"{item.example}"</p>
                </div>
              ))}
              {vocabItems.length === 0 && !loading && (
                <div className="text-center py-20 opacity-20">
                  <p className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-500">Pick a category to build your list</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm">
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic for practice sentences..."
                className="flex-1 px-4 py-3 outline-none text-slate-700 font-bold"
              />
              <button 
                disabled={loading}
                onClick={handleGenerateSentences}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all"
              >
                {loading ? '...' : 'Generate'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
              {sentences.map((item, idx) => (
                <div key={idx} className="p-6 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-amber-200 transition-all shadow-sm">
                  <p className="text-xl font-black text-slate-800 leading-snug mb-2">{item.english}</p>
                  <p className="text-sm text-slate-400 font-bold">{item.thai}</p>
                </div>
              ))}
              {sentences.length === 0 && !loading && (
                <div className="text-center py-20 opacity-20">
                  <p className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-500">Generate sentences to practice fluency</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeTools;
