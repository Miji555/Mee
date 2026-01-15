
export enum AppMode {
  CONVERSATION = 'CONVERSATION',
  VOCABULARY = 'VOCABULARY',
  PRACTICE_TEXT = 'PRACTICE_TEXT',
  IMAGE_LEARNING = 'IMAGE_LEARNING'
}

export interface VocabItem {
  word: string;
  translation: string;
  example: string;
  pronunciation?: string;
}

export interface PracticeSentence {
  english: string;
  thai: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
