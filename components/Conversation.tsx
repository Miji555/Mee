
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
            setError("Connection error. Please try again.");
            setIsActive(false);
          },
          onclose: () => {
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are an English language tutor. Speak clearly. You can respond in both English and Thai to help the student learn. Encourage them to speak more English.",
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
      setError("Microphone access denied or connection failed.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      // In a real app we would call a cleanup or close method if exposed by the SDK
      // For now, we manually reset UI state
      setIsActive(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col h-[600px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Conversation</h2>
          <p className="text-gray-500 text-sm">Speak naturally with AI to improve your fluency.</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
          {isActive ? '● Live Session' : 'Offline'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-4 custom-scrollbar">
        {transcriptions.length === 0 && !isActive && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p>Your conversation transcription will appear here.</p>
          </div>
        )}
        
        {transcriptions.map((t, i) => (
          <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              t.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
            }`}>
              <p className="text-sm font-medium mb-1 opacity-70 uppercase tracking-wider text-[10px]">
                {t.role === 'user' ? 'You' : 'Gemini'}
              </p>
              <p className="leading-relaxed">{t.text || '...'}</p>
            </div>
          </div>
        ))}
        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}
      </div>

      <div className="flex items-center justify-center pt-6 border-t border-gray-100">
        {!isActive ? (
          <button 
            onClick={startSession}
            className="group relative flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-200 hover:scale-105 transition-transform"
          >
            <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20"></div>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        ) : (
          <button 
            onClick={stopSession}
            className="flex items-center justify-center w-20 h-20 bg-red-500 rounded-full shadow-2xl shadow-red-200 hover:scale-105 transition-transform"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 mt-4">
        {isActive ? 'Listening... click to end session' : 'Click the mic to start practicing'}
      </p>
    </div>
  );
};

export default Conversation;
