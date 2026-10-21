import type { Row } from './cms-model';

export type Occurrence = { id: string; date: string; title: string; branch: string; kind: 'fixed' | 'special'; description: string; location: string };

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const ordinals = ['first', 'second', 'third', 'fourth'];

export const recurrenceOptions: { value: string; label: string }[] = [
  { value: '', label: 'No repeating rule (use dates only)' },
  ...weekdays.map(d => ({ value: `every-${d}`, label: `Every ${cap(d)}` })),
  ...ordinals.flatMap(o => weekdays.map(d => ({ value: `${o}-${d}`, label: `${cap(o)} ${cap(d)} of every month` }))),
  ...weekdays.map(d => ({ value: `last-${d}`, label: `Last ${cap(d)} of every month` })),
  ...ordinals.map(o => ({ value: `${o}-week`, label: `${cap(o)} week of every month` })),
];

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
export function ymd(year: number, month: number, day: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
function daysIn(year: number, month: number) { return new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); }
function weekday(year: number, month: number, day: number) { return new Date(Date.UTC(year, month, day)).getUTCDay(); }

/** Days of the month (1-based) on which a repeating rule falls. */
export function ruleDays(rule: string | null | undefined, year: number, month: number): number[] {
  if (!rule) return [];
  const [which, what] = rule.toLowerCase().split('-');
  const total = daysIn(year, month);
  const all = Array.from({ length: total }, (_, i) => i + 1);
  if (what === 'week') {
    const index = ordinals.indexOf(which ?? '');
    if (index < 0) return [];
    return all.filter(d => d > index * 7 && d <= (index + 1) * 7);
  }
  const target = weekdays.indexOf(what ?? '');
  if (target < 0) return [];
  const matching = all.filter(d => weekday(year, month, d) === target);
  if (which === 'every') return matching;
  if (which === 'last') return matching.slice(-1);
  const index = ordinals.indexOf(which ?? '');
  return index >= 0 && matching[index] ? [matching[index]] : [];
}

/** Admin-entered dates, one per line or comma separated, as YYYY-MM-DD. */
export function parseDates(value: unknown): string[] {
  return String(value ?? '').split(/[\s,]+/).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
}

/**
 * Occurrences in a month. For a fixed program, dates the admin entered for that month
 * replace the repeating rule for that month only.
 */
export function occurrencesForMonth(events: Row[], year: number, month: number): Occurrence[] {
  const prefix = ymd(year, month, 1).slice(0, 7);
  const out: Occurrence[] = [];
  for (const e of events) {
    const base = { id: String(e['id']), title: String(e['title'] ?? ''), branch: String(e['branch'] ?? ''), description: String(e['description'] ?? ''), location: String(e['location'] ?? '') };
    if (String(e['kind'] ?? 'special') === 'fixed') {
      const explicit = parseDates(e['dates']).filter(d => d.startsWith(prefix));
      const dates = explicit.length ? explicit : ruleDays(String(e['recurrence'] ?? ''), year, month).map(d => ymd(year, month, d));
      for (const date of dates) out.push({ ...base, kind: 'fixed', date });
    } else {
      const start = String(e['start_date'] ?? '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) continue;
      const endRaw = String(e['end_date'] ?? '').slice(0, 10);
      const end = /^\d{4}-\d{2}-\d{2}$/.test(endRaw) && endRaw >= start ? endRaw : start;
      for (let d = 1; d <= daysIn(year, month); d++) {
        const date = ymd(year, month, d);
        if (date >= start && date <= end) out.push({ ...base, kind: 'special', date });
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

/** The next date of each event, from today, ordered soonest first. */
export function upcomingEvents(events: Row[], today: Date, monthsAhead = 3): Occurrence[] {
  const todayKey = ymd(today.getFullYear(), today.getMonth(), today.getDate());
  const seen = new Set<string>();
  const out: Occurrence[] = [];
  for (let i = 0; i <= monthsAhead; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    for (const o of occurrencesForMonth(events, d.getFullYear(), d.getMonth())) {
      if (o.date < todayKey || seen.has(o.id)) continue;
      seen.add(o.id);
      out.push(o);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}

/** Human wording for a repeating rule, e.g. "Last Saturday of every month". */
export function ruleLabel(rule: string | null | undefined) {
  return recurrenceOptions.find(o => o.value && o.value === rule)?.label ?? '';
}

/** Calendar cells for a month: leading blanks (null) so day 1 sits under its weekday (weeks start Sunday). */
export function monthCells(year: number, month: number): (number | null)[] {
  const lead = weekday(year, month, 1);
  return [...Array.from({ length: lead }, () => null), ...Array.from({ length: daysIn(year, month) }, (_, i) => i + 1)];
}
