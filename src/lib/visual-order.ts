import type { Row } from './cms-model';

export const homeSections = ['devotion', 'plan', 'prayer', 'word'] as const;
export function orderedRows(rows: Row[], raw?: string): Row[] {
  let ids: string[] = [];
  try { const parsed: unknown = JSON.parse(raw ?? '[]'); if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === 'string'); } catch { /* default order */ }
  const rank = new Map(ids.map((id, index) => [id, index]));
  return [...rows].sort((a, b) => (rank.get(String(a['id'])) ?? ids.length) - (rank.get(String(b['id'])) ?? ids.length));
}
export function orderedHome(raw?: string): string[] {
  let keys: string[] = [];
  try { const parsed: unknown = JSON.parse(raw ?? '[]'); if (Array.isArray(parsed)) keys = parsed.filter((key): key is string => typeof key === 'string' && homeSections.some(k => k === key)); } catch { /* default order */ }
  return [...new Set([...keys, ...homeSections])];
}
export const signInDestination = '/' as const;