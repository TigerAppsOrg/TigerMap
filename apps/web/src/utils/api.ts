export async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

// image lists arrive as JSON strings from the mail feeds
export function parseList(json: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
