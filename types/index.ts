// /types/index.ts
export type Deck = {
  id: number;
  name: string;
  emoji: string;
  words: number;
  mastered: number;
  progress: number;
  streak: number;
  dueToday: number;
  author?: string;
  users?: number;
  rating?: number;
  verified?: boolean;
};

export type Banner = {
  id: number;
  title: string;
  description: string;
  gradient: string;
  cta: string;
};

export type Word = {
  id: string;
  korean: string;
  mongolian: string;
  mastered: boolean;
};

export type DeckDetail = {
  id: string;
  name: string;
  description: string;
  words: number;
  mastered: number;
  progress: number;
  streak: number;
  rating: number;
  totalRatings: number;
  creator: {
    name: string;
    avatar: string;
    decksCreated: number;
  };
  createdAt: string;
  wordsList: Word[];
};
