
import React, { useState } from 'react';
import { editImageWithPrompt } from '../services/geminiService';

const ImageVisualizer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setIsProcessing(true);
    const result = await editImageWithPrompt(image, prompt);
    if (result) {
      setImage(result);
      setPrompt('');
    }
    setIsProcessing(false);
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl shadow-rose-100/50 border border-slate-50 overflow-hidden">
      <div className="bg-rose-500 p-8 text-white">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Visual Lab</h2>
        <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Image Prompt Engineering</p>
      </div>

      <div className="p-8 md:p-12 space-y-10">
        <div className="aspect-video bg-slate-50 rounded-[2.5rem] overflow-hidden border-4 border-dashed border-slate-100 flex flex-col items-center justify-center relative shadow-inner">
          {image ? (
            <img src={image} className="w-full h-full object-cover" alt="Source" />
          ) : (
            <div className="text-center p-12">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-slate-200/50 mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6">Upload canvas to start visual training</p>
              <input 
                type="file" 
                id="image-upload-v2" 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/*"
              />
              <label 
                htmlFor="image-upload-v2"
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all shadow-xl shadow-slate-200"
              >
                Browse Gallery
              </label>
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-20">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-rose-900 font-black text-[10px] uppercase tracking-[0.3em]">Processing Visuals...</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm">
            <input 
              type="text"
              value={prompt}
              disabled={!image || isProcessing}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your change in English..."
              className="flex-1 px-4 py-3 outline-none text-slate-700 font-bold placeholder:font-medium"
            />
            <button 
              disabled={!image || !prompt || isProcessing}
              onClick={handleEdit}
              className="bg-rose-500 text-white px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 disabled:opacity-30 transition-all shadow-xl shadow-rose-100"
            >
              Apply
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PresetBtn onClick={() => setPrompt("Make it look like an oil painting")} label="Oil Paint" />
            <PresetBtn onClick={() => setPrompt("Convert to high contrast black and white")} label="B&W Noir" />
            <PresetBtn onClick={() => setPrompt("Add soft cinematic lighting and neon accents")} label="Cinematic" />
            <PresetBtn onClick={() => setPrompt("Change the season to a snowy winter day")} label="Winterize" />
          </div>
        </div>
      </div>
    </div>
  );
};

const PresetBtn = ({ onClick, label }: any) => (
  <button 
    onClick={onClick} 
    className="text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 rounded-xl py-3 px-4 hover:bg-slate-50 hover:text-rose-500 transition-all bg-white"
  >
    {label}
  </button>
);

export default ImageVisualizer;
