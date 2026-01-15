
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encodePCM, decodePCM, decodeAudioBuffer } from '../services/geminiService';

const Conversation: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ role: string, text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  const currentInputTransRef = useRef("");
  const currentOutputTransRef = useRef("");

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setError(null);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmData = encodePCM(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              currentOutputTransRef.current += msg.serverContent.outputTranscription.text;
            } else if (msg.serverContent?.inputTranscription) {
              currentInputTransRef.current += msg.serverContent.inputTranscription.text;
            }

            if (msg.serverContent?.turnComplete) {
              setTranscriptions(prev => [
                ...prev,
                { role: 'user', text: currentInputTransRef.current },
                { role: 'model', text: currentOutputTransRef.current }
              ]);
              currentInputTransRef.current = "";
              currentOutputTransRef.current = "";
            }

            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioBuffer(decodePCM(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live Error", e);
            setError("Connection failed. Please check your mic.");
            setIsActive(false);
          },
          onclose: () => {
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are an English language tutor. Speak clearly. You can respond in both English and Thai to help the student learn. Encourage them to speak more English. Be friendly and conversational.",
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setError("Microphone access denied.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      setIsActive(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-50 flex flex-col h-[700px] overflow-hidden">
      <div className="bg-emerald-600 p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Live AI Chat</h2>
            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Free Talk English Immersion</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center transition-all ${isActive ? 'bg-white text-emerald-600 animate-pulse' : 'bg-emerald-700 text-emerald-200'}`}>
            {isActive ? <><span className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></span>Streaming</> : 'Offline'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {transcriptions.length === 0 && !isActive && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <p className="font-black text-[10px] uppercase tracking-widest text-slate-500">Your chat history starts here</p>
          </div>
        )}
        
        {transcriptions.map((t, i) => (
          <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[1.5rem] px-6 py-4 ${
              t.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none shadow-xl shadow-emerald-100' 
                : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              <p className="text-[9px] font-black mb-1 opacity-60 uppercase tracking-[0.2em]">
                {t.role === 'user' ? 'Student' : 'Tutor'}
              </p>
              <p className="font-bold leading-relaxed">{t.text || '...'}</p>
            </div>
          </div>
        ))}
        {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center bg-rose-50 p-3 rounded-2xl tracking-widest">{error}</p>}
      </div>

      <div className="p-10 bg-slate-50 flex flex-col items-center border-t border-slate-100">
        <button 
          onClick={isActive ? stopSession : startSession}
          className={`group relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${isActive ? 'bg-rose-500 shadow-rose-200' : 'bg-emerald-600 shadow-emerald-200 hover:scale-110'}`}
        >
          {isActive ? (
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="3" /></svg>
          ) : (
            <>
              <div className="absolute inset-0 bg-emerald-600 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
              <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </>
          )}
        </button>
        <p className="font-black text-[10px] tracking-widest text-slate-400 mt-6 uppercase">
          {isActive ? 'AI is listening...' : 'Tap to start conversation'}
        </p>
      </div>
    </div>
  );
};

export default Conversation;
