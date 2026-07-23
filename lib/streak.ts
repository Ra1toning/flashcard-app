const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_WINDOW_MS = 7 * DAY_MS;

export function computeStreak(dayKeys: number[], todayKey: number): number {
  const days = [...new Set(dayKeys)].sort((a, b) => b - a);
  if (days.length === 0) return 0;

  let streak = 0;
  let expected = days[0] === todayKey ? todayKey : todayKey - DAY_MS;
  let lastGraceAt: number | null = null;

  for (const day of days) {
    if (day > expected) continue;
    if (day === expected) {
      streak++;
      expected -= DAY_MS;
      continue;
    }
    if (day === expected - DAY_MS && (lastGraceAt === null || lastGraceAt - expected >= GRACE_WINDOW_MS)) {
      lastGraceAt = expected;
      streak++;
      expected -= 2 * DAY_MS;
      continue;
    }
    break;
  }

  return streak;
}
