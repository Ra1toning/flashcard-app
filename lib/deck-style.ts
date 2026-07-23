export function getDeckMark(name?: string | null) {
  const source = (name || "NU").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const mark = parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`
    : source.slice(0, 2);

  return mark.toUpperCase();
}
