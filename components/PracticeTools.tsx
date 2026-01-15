
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
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="flex space-x-4 mb-8">
        <button 
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'vocab' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          Vocabulary
        </button>
        <button 
          onClick={() => setActiveTab('sentences')}
          className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'sentences' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          Sentences
        </button>
      </div>

      {activeTab === 'vocab' ? (
        <div className="space-y-6">
          <div className="flex space-x-2">
            <input 
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Workplace, Hobbies..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button 
              disabled={loading}
              onClick={handleGenerateVocab}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-black disabled:opacity-50 transition-all"
            >
              {loading ? '...' : 'Gen'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {vocabItems.map((item, idx) => (
              <div key={idx} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 group hover:border-indigo-300 transition-all">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-lg font-bold text-indigo-900">{item.word}</h4>
                  <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">{item.translation}</span>
                </div>
                <p className="text-sm text-indigo-700 italic">"{item.example}"</p>
              </div>
            ))}
            {vocabItems.length === 0 && !loading && (
              <div className="text-center py-12 opacity-30">
                <p>Choose a category to start building your vocabulary.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex space-x-2">
            <input 
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic for practice..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button 
              disabled={loading}
              onClick={handleGenerateSentences}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-black disabled:opacity-50 transition-all"
            >
              {loading ? '...' : 'Gen'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {sentences.map((item, idx) => (
              <div key={idx} className="p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-all">
                <p className="text-lg font-medium text-gray-900 leading-tight mb-2">{item.english}</p>
                <p className="text-sm text-gray-500 font-medium">{item.thai}</p>
              </div>
            ))}
            {sentences.length === 0 && !loading && (
              <div className="text-center py-12 opacity-30">
                <p>Generate sentences to practice your pronunciation.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeTools;
