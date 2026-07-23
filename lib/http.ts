export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data
      ? String(data.error)
      : "Хүсэлтийг боловсруулж чадсангүй.";
    throw new Error(message);
  }

  return data as T;
}
