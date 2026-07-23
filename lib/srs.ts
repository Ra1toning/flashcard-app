export type Grade = "again" | "hard" | "good" | "easy";

export const GRADE_OPTIONS: { value: Grade; label: string }[] = [
  { value: "again", label: "Мартсан" },
  { value: "hard", label: "Хэцүү" },
  { value: "good", label: "Сайн" },
  { value: "easy", label: "Амархан" },
];

export const GRADE_PAYLOAD: Record<Grade, { correct: boolean; quality: number }> = {
  again: { correct: false, quality: 1 },
  hard: { correct: true, quality: 3 },
  good: { correct: true, quality: 4 },
  easy: { correct: true, quality: 5 },
};

export type GradeResult = { ok: boolean; interval: number | null };

export async function submitCardGrade(cardId: string, grade: Grade): Promise<GradeResult> {
  try {
    const response = await fetch(`/api/cards/${cardId}/update-srs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(GRADE_PAYLOAD[grade]),
    });
    if (!response.ok) return { ok: false, interval: null };
    const data = await response.json().catch(() => null);
    const interval = typeof data?.card?.interval === "number" ? data.card.interval : null;
    return { ok: true, interval };
  } catch {
    return { ok: false, interval: null };
  }
}

export async function introduceCard(cardId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/cards/${cardId}/introduce`, { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}
