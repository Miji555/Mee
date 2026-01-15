
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
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Visual English Lab</h2>
      <p className="text-gray-500 text-sm mb-6">Edit images using English prompts. Practice describing changes!</p>
      
      <div className="space-y-6">
        <div className="aspect-video bg-gray-50 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative">
          {image ? (
            <img src={image} className="w-full h-full object-cover" alt="Source" />
          ) : (
            <div className="text-center p-6">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm mb-4">Upload an image to start visual learning</p>
              <input 
                type="file" 
                id="image-upload" 
                className="hidden" 
                onChange={handleFileChange}
                accept="image/*"
              />
              <label 
                htmlFor="image-upload"
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-indigo-700 transition-all"
              >
                Choose Photo
              </label>
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-indigo-900 font-bold">Dreaming up changes...</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <input 
            type="text"
            value={prompt}
            disabled={!image || isProcessing}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Add a retro filter, Put a cat on the sofa..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
          />
          <button 
            disabled={!image || !prompt || isProcessing}
            onClick={handleEdit}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black disabled:opacity-30 transition-all"
          >
            Apply
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setPrompt("Make it look like an oil painting")} className="text-[10px] uppercase tracking-wider font-bold text-gray-400 border border-gray-200 rounded-lg p-2 hover:bg-gray-50">Oil Painting</button>
          <button onClick={() => setPrompt("Convert to black and white")} className="text-[10px] uppercase tracking-wider font-bold text-gray-400 border border-gray-200 rounded-lg p-2 hover:bg-gray-50">Noir Style</button>
          <button onClick={() => setPrompt("Add a vintage 90s polaroid look")} className="text-[10px] uppercase tracking-wider font-bold text-gray-400 border border-gray-200 rounded-lg p-2 hover:bg-gray-50">90s Retro</button>
          <button onClick={() => setPrompt("Make it look cinematic with neon lights")} className="text-[10px] uppercase tracking-wider font-bold text-gray-400 border border-gray-200 rounded-lg p-2 hover:bg-gray-50">Cyberpunk</button>
        </div>
      </div>
    </div>
  );
};

export default ImageVisualizer;
