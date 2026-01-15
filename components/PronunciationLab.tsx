
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encodePCM, decodePCM, decodeAudioBuffer, evaluatePronunciation, generateVocab } from '../services/geminiService';

const DEFAULT_SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "I'm looking forward to our meeting tomorrow.",
  "Could you please tell me how to get to the station?",
  "Learning a new language opens up many opportunities.",
  "The weather today is absolutely wonderful, isn't it?",
  "I would like to order a large latte with oat milk.",
  "Practice makes perfect when it comes to fluency.",
  "Can you recommend a good restaurant nearby?",
  "Success is not final, failure is not fatal.",
  "Believe you can and you're halfway there."
];

const DEFAULT_VOCAB = ["Extraordinary", "Infrastructure", "Perspective", "Collaborate", "Innovative", "Sustainable", "Phenomenon", "Algorithm", "Atmosphere"];

const SILENCE_THRESHOLD = 0.012; // ปรับค่าความไวในการตรวจจับเสียง
const SILENCE_DURATION = 1200; // หยุดพูด 1.2 วินาที จะปิดไมค์อัตโนมัติ
const AUTO_NEXT_DELAY = 5000; // สุ่มประโยคใหม่ใน 5 วินาที

const PronunciationLab: React.FC = () => {
  const [mode, setMode] = useState<'sentence' | 'vocab'>('sentence');
  const [targetItem, setTargetItem] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [accent, setAccent] = useState<'US' | 'UK'>('US');
  const [responseLang, setResponseLang] = useState<'EN' | 'TH'>('TH');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ score: number, feedback: string, highlighted: string } | null>(null);
  const [transcript, setTranscript] = useState("");
  const [vocabCategory, setVocabCategory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const autoNextTimerRef = useRef<number | null>(null);
  
  const currentInputTransRef = useRef("");
  const hasSpokenRef = useRef<boolean>(false);
  const lastActiveTimeRef = useRef<number>(0);
  const autoStopTimerRef = useRef<number | null>(null);

  // สุ่มประโยคเริ่มต้น
  useEffect(() => {
    const list = mode === 'sentence' ? DEFAULT_SENTENCES : DEFAULT_VOCAB;
    setTargetItem(list[Math.floor(Math.random() * list.length)]);
  }, [mode]);

  // ระบบ Auto-Next
  useEffect(() => {
    if (result && !isRecording && !isAnalyzing) {
      setAutoNextCountdown(AUTO_NEXT_DELAY / 1000);
      const startTime = Date.now();
      
      const interval = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((AUTO_NEXT_DELAY - elapsed) / 1000));
        setAutoNextCountdown(remaining);
        
        if (elapsed >= AUTO_NEXT_DELAY) {
          nextRandom();
          clearInterval(interval);
        }
      }, 1000);

      autoNextTimerRef.current = interval;
      return () => clearInterval(interval);
    } else {
      setAutoNextCountdown(null);
      if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current);
    }
  }, [result, isRecording, isAnalyzing]);

  const startRecording = async () => {
    try {
      setResult(null);
      setTranscript("");
      if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current);
      setAutoNextCountdown(null);
      
      currentInputTransRef.current = "";
      hasSpokenRef.current = false;
      lastActiveTimeRef.current = Date.now();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsRecording(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);

              // ตรวจจับการพูดเพื่อเริ่มนับเวลาความเงียบ
              if (rms > SILENCE_THRESHOLD) {
                lastActiveTimeRef.current = Date.now();
                hasSpokenRef.current = true;
              }

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmData = encodePCM(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              currentInputTransRef.current += msg.serverContent.inputTranscription.text;
              setTranscript(currentInputTransRef.current);
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioBuffer(decodePCM(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
              lastActiveTimeRef.current = Date.now(); // ถ่วงเวลาไม่ให้ตัดขณะ AI พูด
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: accent === 'US' ? 'Puck' : 'Charon' } }
          },
          systemInstruction: `STRICT RULE: Transcribe ONLY English. Ignore other languages.
          Target: "${targetItem}".
          Coach Mode: Give brief feedback in ${responseLang === 'EN' ? 'English' : 'Thai'}.`,
          inputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;

      const checkSilence = () => {
        if (hasSpokenRef.current && (Date.now() - lastActiveTimeRef.current > SILENCE_DURATION)) {
          stopAndAnalyze();
          return;
        }
        if (isRecording) {
          autoStopTimerRef.current = window.requestAnimationFrame(checkSilence);
        }
      };
      autoStopTimerRef.current = window.requestAnimationFrame(checkSilence);

    } catch (err) {
      console.error(err);
      alert("กรุณาอนุญาตการเข้าถึงไมโครโฟน");
    }
  };

  const stopAndAnalyze = async () => {
    if (autoStopTimerRef.current) window.cancelAnimationFrame(autoStopTimerRef.current);
    setIsRecording(false);
    setIsAnalyzing(true);
    
    // ปิด Microphone Stream ทันที
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (inputAudioContextRef.current) {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();

    const evaluation = await evaluatePronunciation(targetItem, currentInputTransRef.current, accent);
    setResult(evaluation);
    setIsAnalyzing(false);
  };

  const nextRandom = () => {
    if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current);
    const list = mode === 'sentence' ? DEFAULT_SENTENCES : DEFAULT_VOCAB;
    let next = list[Math.floor(Math.random() * list.length)];
    while (next === targetItem && list.length > 1) next = list[Math.floor(Math.random() * list.length)];
    
    setTargetItem(next);
    setResult(null);
    setTranscript("");
    setShowCustom(false);
    setAutoNextCountdown(null);
  };

  const generateNewVocab = async (cat: string) => {
    setIsGenerating(true);
    const items = await generateVocab(cat);
    if (items && items.length > 0) {
      setTargetItem(items[0].word);
      setResult(null);
      setTranscript("");
    }
    setIsGenerating(false);
  };

  const applyCustom = () => {
    if (customInput.trim()) {
      setTargetItem(customInput.trim());
      setResult(null);
      setTranscript("");
      setShowCustom(false);
    }
  };

  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) window.cancelAnimationFrame(autoStopTimerRef.current);
      if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current);
      if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto w-full px-4">
      {/* Control Panel */}
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex flex-wrap justify-center items-center gap-3">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-1">
            <button 
              onClick={() => setMode('sentence')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${mode === 'sentence' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              SENTENCES
            </button>
            <button 
              onClick={() => setMode('vocab')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${mode === 'vocab' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              VOCABULARY
            </button>
          </div>

          <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-1">
            <button onClick={() => setAccent('US')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${accent === 'US' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>US 🇺🇸</button>
            <button onClick={() => setAccent('UK')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${accent === 'UK' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>UK 🇬🇧</button>
          </div>

          <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-1">
            <button onClick={() => setResponseLang('EN')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${responseLang === 'EN' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>EN</button>
            <button onClick={() => setResponseLang('TH')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${responseLang === 'TH' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>TH</button>
          </div>
        </div>

        {mode === 'vocab' && (
          <div className="flex justify-center">
            <div className="flex bg-white p-1.5 rounded-2xl border border-indigo-100 shadow-sm max-w-sm w-full">
              <input 
                type="text" 
                value={vocabCategory}
                onChange={(e) => setVocabCategory(e.target.value)}
                placeholder="หมวดหมู่: Travel, Business..."
                className="flex-1 px-4 text-sm outline-none"
              />
              <button 
                onClick={() => generateNewVocab(vocabCategory)}
                disabled={isGenerating}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black disabled:opacity-50"
              >
                {isGenerating ? '...' : 'สุ่มหมวดนี้'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-50 overflow-hidden transition-all">
        <div className="bg-indigo-600 p-10 text-white text-center relative">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-1">talk to mee!</h2>
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
             Auto-Stop Pronunciation Lab
          </p>
        </div>

        <div className="p-8 md:p-14 space-y-12">
          {/* Target Display */}
          <div className="text-center relative">
            <div className="flex justify-center items-center gap-3 mb-6">
               <div className="bg-indigo-50 px-3 py-1 rounded-full flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-300'}`}></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Target {mode}</span>
               </div>
               <button onClick={() => setShowCustom(!showCustom)} className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-600 tracking-widest">Custom</button>
            </div>
            
            {showCustom ? (
              <div className="flex max-w-lg mx-auto gap-3 items-center">
                <input 
                  type="text" 
                  value={customInput} 
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-slate-50 border-b-2 border-indigo-200 focus:border-indigo-600 outline-none px-3 py-2 text-xl font-bold"
                />
                <button onClick={applyCustom} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg">SET</button>
              </div>
            ) : (
              <p className="text-3xl md:text-5xl font-black text-slate-800 leading-tight">
                {result ? (
                  result.highlighted.split(' ').map((word, i) => (
                    <span key={i} className={word.startsWith('[') ? 'text-rose-500 border-b-4 border-rose-200 bg-rose-50 px-1 rounded-lg' : ''}>
                      {word.replace('[', '').replace(']', '')}{' '}
                    </span>
                  ))
                ) : targetItem}
              </p>
            )}

            {autoNextCountdown !== null && (
              <div className="absolute -bottom-10 left-0 right-0 flex flex-col items-center">
                <div className="h-1 bg-slate-100 rounded-full w-40 overflow-hidden mb-1">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-linear" 
                    style={{ width: `${(autoNextCountdown / (AUTO_NEXT_DELAY / 1000)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[9px] text-slate-400 font-black uppercase">Next in {autoNextCountdown}s</span>
              </div>
            )}
          </div>

          {/* Feedback & Mic Area */}
          <div className="min-h-[200px] flex flex-col items-center justify-center">
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Analyzing...</p>
              </div>
            ) : result ? (
              <div className="w-full max-w-xl animate-in zoom-in duration-500">
                <div className="text-center mb-8">
                   <div className={`text-[9rem] leading-none font-black ${result.score >= 80 ? 'text-emerald-500' : result.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {result.score}
                   </div>
                   <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Accuracy Score</div>
                </div>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex gap-5 shadow-inner">
                   <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <p className="text-slate-700 font-bold text-lg leading-relaxed">{result.feedback}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                 {isRecording ? (
                   <div className="flex flex-col items-center gap-6">
                      <div className="flex items-center gap-2 h-16">
                        {[...Array(20)].map((_, i) => (
                          <div key={i} className="w-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 50}px`, animationDelay: `${i * 0.05}s` }}></div>
                        ))}
                      </div>
                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Speak now. I'll stop when you're done.</p>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-4 opacity-40">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-slate-100">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </div>
                      <p className="font-black text-[10px] tracking-widest text-slate-400">READY TO LISTEN</p>
                   </div>
                 )}
              </div>
            )}
          </div>

          {/* Real-time Transcription */}
          {transcript && !result && (
            <div className="bg-slate-900 rounded-[2rem] p-8 text-center border-4 border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4">
               <span className="text-[10px] font-black text-indigo-400 uppercase block mb-3 tracking-widest">Capturing Speech...</span>
               <p className="text-white italic text-2xl font-black">"{transcript}"</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-8">
            <button 
              onClick={isRecording ? stopAndAnalyze : startRecording}
              disabled={isAnalyzing}
              className={`group relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isRecording ? 'bg-rose-500' : 'bg-indigo-600 hover:scale-110'}`}
            >
              {isRecording ? (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="3" /></svg>
              ) : (
                <>
                  <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                  <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </>
              )}
            </button>

            <div className="flex gap-4">
              <button 
                onClick={nextRandom}
                disabled={isRecording || isAnalyzing}
                className="group px-8 py-4 rounded-2xl border-2 border-slate-100 text-[10px] font-black text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3 bg-white"
              >
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span>NEXT {mode === 'sentence' ? 'SENTENCE' : 'WORD'}</span>
              </button>
              
              {result && (
                <button 
                  onClick={() => {setResult(null); setTranscript(""); nextStartTimeRef.current = 0;}}
                  className="px-10 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black hover:bg-black transition-all"
                >
                  TRY AGAIN
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PronunciationLab;
