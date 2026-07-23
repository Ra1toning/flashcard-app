type Entry = { count: number; reset: number };

const store = new Map<string, Entry>();

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (store.size > 5000) {
    for (const [k, v] of store) {
      if (v.reset < now) store.delete(k);
    }
  }

  const entry = store.get(key);
  if (!entry || entry.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  entry.count += 1;
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.reset,
  };
}

export function getClientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string): string | undefined => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(name) ?? undefined;
    }
    const value = (headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const realIp = get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((hop) => hop.trim()).filter(Boolean);
    return hops[hops.length - 1] ?? "unknown";
  }
  return "unknown";
}
