import type { Row } from './cms-model';

/** One program on one day. Admins create a row only for days that have a program. */
export type ProgramDay = { id: string; date: string; title: string; time: string; location: string; description: string; image: string; branch: string };

export function ymd(year: number, month: number, day: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
function daysIn(year: number, month: number) { return new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); }

export function toProgram(row: Row): ProgramDay | null {
  const date = String(row['event_date'] ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const s = (k: string) => String(row[k] ?? '').trim();
  return { id: String(row['id']), date, title: s('title'), time: s('time'), location: s('location'), description: s('description'), image: s('image_url'), branch: s('branch') };
}

/** Programs grouped by date (YYYY-MM-DD). Days absent from the map are free days. */
export function programsByDay(rows: Row[]): Map<string, ProgramDay[]> {
  const map = new Map<string, ProgramDay[]>();
  for (const r of rows) { const p = toProgram(r); if (p) map.set(p.date, [...(map.get(p.date) ?? []), p]); }
  return map;
}

/** Month grid cells, weeks starting Monday. null = padding before day 1. */
export function monthCells(year: number, month: number): (number | null)[] {
  const lead = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  return [...Array.from({ length: lead }, () => null), ...Array.from({ length: daysIn(year, month) }, (_, i) => i + 1)];
}

/** Programs from today onwards, soonest first. */
export function upcomingPrograms(rows: Row[], todayKey: string, limit = 8): ProgramDay[] {
  return rows.map(toProgram).filter((p): p is ProgramDay => !!p && p.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, limit);
}

/** "Title • 5:00 PM • Town Square" — parts that are empty are left out. */
export function cellSummary(p: ProgramDay) { return [p.title, p.time, p.location].filter(Boolean).join(' • '); }

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}

/** Google Calendar link for an all-day (or timed, when "5:00 PM" style time is given) program. */
export function calendarLink(p: ProgramDay) {
  const day = p.date.replaceAll('-', '');
  const m = p.time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  let dates = `${day}/${ymd(...nextDay(p.date)).replaceAll('-', '')}`;
  if (m) {
    let h = Number(m[1]) % 12 + (m[3]?.toLowerCase() === 'pm' ? 12 : m[3] ? 0 : Number(m[1]) === 12 ? 12 : 0);
    if (!m[3]) h = Number(m[1]);
    const start = `${day}T${String(h).padStart(2, '0')}${m[2] ?? '00'}00`;
    const end = `${day}T${String(Math.min(h + 2, 23)).padStart(2, '0')}${m[2] ?? '00'}00`;
    dates = `${start}/${end}`;
  }
  const q = new URLSearchParams({ action: 'TEMPLATE', text: p.title, dates, details: p.description, location: p.location, ctz: 'Africa/Lagos' });
  return `https://calendar.google.com/calendar/render?${q}`;
}
function nextDay(date: string): [number, number, number] { const [y, m, d] = date.split('-').map(Number); const n = new Date(Date.UTC(y!, m! - 1, d! + 1)); return [n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()]; }

export function directionsLink(location: string) { return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`; }
