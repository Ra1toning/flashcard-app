export function utcStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function utcTomorrow(date: Date = new Date()): Date {
  return new Date(utcStartOfDay(date).getTime() + 24 * 60 * 60 * 1000);
}
