
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { VocabItem, PracticeSentence } from "../types";

// Always use process.env.API_KEY directly when initializing the client instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Compares target text with spoken transcription and returns a score/feedback using gemini-3-flash-preview.
 */
export const evaluatePronunciation = async (original: string, spoken: string, accent: 'US' | 'UK' = 'US'): Promise<{score: number, feedback: string, highlighted: string}> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Target English Sentence: "${original}"
User Spoken Transcription: "${spoken}"
Target Accent Style: ${accent === 'US' ? 'American English (US)' : 'British English (UK)'}

หน้าที่ของคุณคือเป็นโค้ชสอนภาษาอังกฤษที่เชี่ยวชาญ:
1. ให้คะแนนความถูกต้องแม่นยำ (0-100) โดยอ้างอิงตามสำเนียง ${accent === 'US' ? 'อเมริกัน (US)' : 'บริติช (UK)'}
2. ให้คำแนะนำเป็นภาษาไทยที่เฉพาะเจาะจงว่าผู้ใช้ควรแก้ไขการออกเสียงที่ "คำไหน" และ "อย่างไร" ตามสำเนียงที่เลือก
3. หากผู้ใช้พยายามออกเสียงสำเนียง ${accent} ได้ดี ให้คำชมเชยเป็นพิเศษ
4. ไฮไลต์คำที่ออกเสียงผิดหรือขาดหายไปในประโยคต้นฉบับโดยใช้เครื่องหมาย [word]`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "คะแนนความถูกต้อง 0-100" },
          feedback: { type: Type.STRING, description: "คำแนะนำการแก้ไขเป็นภาษาไทย" },
          highlighted: { type: Type.STRING, description: "ประโยคต้นฉบับที่มีคำผิดในเครื่องหมาย [brackets]" }
        },
        required: ["score", "feedback", "highlighted"]
      }
    }
  });
  
  try {
    const text = response.text;
    return JSON.parse(text?.trim() || '{}');
  } catch (e) {
    console.error("Failed to parse evaluation", e);
    return { score: 0, feedback: "เกิดข้อผิดพลาดในการวิเคราะห์ กรุณาลองใหม่อีกครั้ง", highlighted: original };
  }
};

/**
 * Generates vocabulary items for a given category using gemini-3-flash-preview.
 */
export const generateVocab = async (category: string): Promise<VocabItem[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 5 English vocabulary items related to the category: "${category}". For each item, provide the English word, Thai translation, and an example sentence in English.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "The English word" },
            translation: { type: Type.STRING, description: "Thai translation" },
            example: { type: Type.STRING, description: "English example sentence" },
            pronunciation: { type: Type.STRING, description: "IPA pronunciation (optional)" }
          },
          required: ["word", "translation", "example"]
        }
      }
    }
  });
  
  try {
    const text = response.text;
    return JSON.parse(text?.trim() || '[]');
  } catch (e) {
    console.error("Failed to parse vocab", e);
    return [];
  }
};

/**
 * Generates practice sentences for a given topic using gemini-3-flash-preview.
 */
export const generatePracticeSentences = async (topic: string): Promise<PracticeSentence[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 5 English sentences for pronunciation practice related to: "${topic}". Provide Thai translations for each.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            english: { type: Type.STRING, description: "The English sentence" },
            thai: { type: Type.STRING, description: "The Thai translation" }
          },
          required: ["english", "thai"]
        }
      }
    }
  });
  
  try {
    const text = response.text;
    return JSON.parse(text?.trim() || '[]');
  } catch (e) {
    console.error("Failed to parse sentences", e);
    return [];
  }
};

/**
 * Edits an image based on a text prompt using gemini-2.5-flash-image.
 */
export const editImageWithPrompt = async (base64Image: string, prompt: string): Promise<string | null> => {
  const ai = getAI();
  
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64Data = match[2];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  return null;
};

// PCM Encoding/Decoding Helpers
export function encodePCM(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodePCM(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
