import { prisma } from "@/lib/prisma";

export const STARTER_DECK_WORDS: Array<{ korean: string; mongolian: string }> = [
  { korean: "안녕하세요", mongolian: "Сайн байна уу" },
  { korean: "감사합니다", mongolian: "Баярлалаа" },
  { korean: "죄송합니다", mongolian: "Уучлаарай" },
  { korean: "네", mongolian: "Тийм" },
  { korean: "아니요", mongolian: "Үгүй" },
  { korean: "이름", mongolian: "Нэр" },
  { korean: "물", mongolian: "Ус" },
  { korean: "밥", mongolian: "Хоол/будаа" },
  { korean: "학교", mongolian: "Сургууль" },
  { korean: "회사", mongolian: "Компани" },
  { korean: "친구", mongolian: "Найз" },
  { korean: "가족", mongolian: "Гэр бүл" },
  { korean: "오늘", mongolian: "Өнөөдөр" },
  { korean: "내일", mongolian: "Маргааш" },
  { korean: "어제", mongolian: "Өчигдөр" },
  { korean: "시간", mongolian: "Цаг" },
  { korean: "사람", mongolian: "Хүн" },
  { korean: "돈", mongolian: "Мөнгө" },
  { korean: "집", mongolian: "Гэр" },
  { korean: "학생", mongolian: "Сурагч/оюутан" },
  { korean: "선생님", mongolian: "Багш" },
  { korean: "병원", mongolian: "Эмнэлэг" },
  { korean: "음식", mongolian: "Хоол" },
  { korean: "한국", mongolian: "Солонгос" },
  { korean: "몽골", mongolian: "Монгол" },
  { korean: "공부하다", mongolian: "Суралцах" },
  { korean: "일하다", mongolian: "Ажиллах" },
  { korean: "먹다", mongolian: "Идэх" },
  { korean: "가다", mongolian: "Явах" },
  { korean: "오다", mongolian: "Ирэх" },
];

export async function createStarterDeck(userId: string) {
  await prisma.deck.create({
    data: {
      name: "TOPIK I — Анхан шатны 30 үг",
      emoji: "🇰🇷",
      description: "Эхлэн суралцагчдад зориулсан хамгийн түгээмэл 30 үг. Устгаад, засварлаад өөрийн болгож болно.",
      isPublic: false,
      authorId: userId,
      cards: {
        create: STARTER_DECK_WORDS.map((word) => ({
          front: word.korean,
          back: word.mongolian,
          easeFactor: 2.5,
          interval: 1,
          repetition: 0,
          dueDate: new Date(),
        })),
      },
      progress: {
        create: {
          userId,
          mastered: 0,
          total: STARTER_DECK_WORDS.length,
          streak: 0,
        },
      },
    },
  });
}
