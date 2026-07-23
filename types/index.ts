// /types/index.ts
// Цомгийн төрөл
export type Deck = {
  id: string;
  name: string;
  emoji: string;
  words: number;           // үгийн тоо
  mastered: number;        // сусалсан үгийн тоо
  progress: number;        // прогресс хувь
  streak: number;          // дараалсан өдөр
  dueToday: number;        // өнөөдрийн давтахын урд
  author?: string;
  users?: number;
  description?: string | null;
  isPublic?: boolean;
};

// Баннерийн төрөл
export type Banner = {
  id: number;
  title: string;
  description: string;
  gradient: string;
  cta: string;
};

// Үгийн төрөл
export type Word = {
  id: string;
  korean: string;          // API-compatible front side
  mongolian: string;       // API-compatible back side
  mastered: boolean;
};

// Цомгийн дэлгэрэнгүй мэдээлэл
export type DeckDetail = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  words: number;
  mastered: number;
  progress: number;
  streak: number;
  creator: {
    name: string;
    avatar: string;
    decksCreated: number;  // үүсгэсэн цомгийн тоо
  };
  createdAt: string;
  wordsList: Word[];
};
