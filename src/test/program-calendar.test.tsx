import { describe, expect, it } from 'vitest';
import { cellSummary, monthCells, programsByDay, toProgram } from '@/lib/events-calendar';
import { canSubmitPrayer } from '@/lib/cms-model';

const december = [24, 25, 26].map(d => ({ id: d, title: 'Winter Lights Market', event_date: `2026-12-${d}`, time: '5:00 PM', location: 'Town Square' }));

describe('Monthly program calendar', () => {
  it('only days with a program are program days; all others are free', () => {
    const map = programsByDay(december);
    const days = Array.from({ length: 31 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`);
    expect(days.filter(d => map.has(d))).toEqual(['2026-12-24', '2026-12-25', '2026-12-26']);
  });
  it('cells show Title • Time • Location', () => {
    const row = december[0];
    if (!row) throw new Error('Missing calendar fixture.');
    const program = toProgram(row);
    if (!program) throw new Error('Invalid calendar fixture.');
    expect(cellSummary(program)).toBe('Winter Lights Market • 5:00 PM • Town Square');
  });
  it('weeks start on Monday (1 Dec 2026 is a Tuesday, so one blank cell)', () => {
    expect(monthCells(2026, 11).slice(0, 2)).toEqual([null, 1]);
  });
});

describe('Prayer Wall', () => {
  it('signed-in members can send requests', () => {
    expect(canSubmitPrayer({ kind: 'user' })).toBe(true);
  });
  it('administrators retain member prayer submission access', () => {
    expect(canSubmitPrayer({ kind: 'admin' })).toBe(true);
  });
  it('visitors cannot send requests', () => {
    expect(canSubmitPrayer(null)).toBe(false);
    expect(canSubmitPrayer(undefined)).toBe(false);
  });
});
