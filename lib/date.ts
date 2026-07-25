const DAY_MS = 24 * 60 * 60 * 1000;
const MONGOLIA_OFFSET_MS = 8 * 60 * 60 * 1000;

export function utcStartOfDay(date: Date): Date {
  const shifted = date.getTime() + MONGOLIA_OFFSET_MS;
  return new Date(Math.floor(shifted / DAY_MS) * DAY_MS - MONGOLIA_OFFSET_MS);
}

export function utcTomorrow(date: Date = new Date()): Date {
  return new Date(utcStartOfDay(date).getTime() + DAY_MS);
}
