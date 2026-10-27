import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin, Navigation } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import type { Row } from '@/lib/cms-model';
import { calendarLink, cellSummary, directionsLink, formatDate, monthCells, occupiedMonthDays, programsByDay, ymd, type ProgramDay } from '@/lib/events-calendar';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Month grid: only days an administrator gave a program are highlighted and open details. */
export function ProgramCalendar({ events, compact = false }: { events: Row[]; compact?: boolean }) {
  const [view, setView] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [todayKey, setTodayKey] = useState('');
  const [open, setOpen] = useState<ProgramDay[] | null>(null);
  useEffect(() => { const d = new Date(); setTodayKey(ymd(d.getFullYear(), d.getMonth(), d.getDate())); }, []);
  const byDay = useMemo(() => programsByDay(events), [events]);
  const monthName = new Date(view.year, view.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const move = (step: number) => setView(v => { const d = new Date(v.year, v.month + step, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const cells = compact ? occupiedMonthDays(byDay, view.year, view.month) : monthCells(view.year, view.month);

  return (
    <div className={`calendar${compact ? ' calendar-compact' : ''}`}>
      <div className="calendar-head">
        <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft /></Button>
        <h2>{monthName}</h2>
        <Button variant="outline" size="icon" aria-label="Next month" onClick={() => move(1)}><ChevronRight /></Button>
      </div>
      <div className="calendar-grid" role="grid" aria-label={`Programs in ${monthName}`}>
        {!compact && weekdays.map(n => <div key={n} className="calendar-weekday" role="columnheader">{n}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={`pad-${i}`} className="calendar-cell pad" aria-hidden="true" />;
          const key = ymd(view.year, view.month, d);
          const items = byDay.get(key);
          if (!items) return <div key={key} className={`calendar-cell free${key === todayKey ? ' today' : ''}`} aria-disabled="true" role="gridcell"><span className="day-number">{d}</span></div>;
          return (
            <Button variant="ghost" key={key} type="button" role="gridcell" className={`calendar-cell program${key === todayKey ? ' today' : ''}`} aria-label={`${formatDate(key)}: ${items.map(cellSummary).join('; ')}`} onClick={() => setOpen(items)}>
              <span className="day-number">{compact && <span className="compact-weekday">{formatDate(key, { weekday: 'short' })}</span>}{d}</span>
              {items.map(p => <span key={p.id} className="cell-summary">{cellSummary(p)}</span>)}
            </Button>
          );
        })}
      </div>
      {compact && cells.length === 0 && <p className="compact-empty">No programs scheduled this month.</p>}
      <Dialog open={!!open} onOpenChange={o => { if (!o) setOpen(null); }}>
        <DialogContent className="program-dialog">
          {open?.map((p, i) => (
            <article key={p.id} className="program-detail">
              {p.image && <img src={p.image} alt={p.title} className="program-image" />}
              {i === 0 ? <DialogTitle>{p.title}</DialogTitle> : <h3>{p.title}</h3>}
              {i === 0 && <DialogDescription>{formatDate(p.date)}</DialogDescription>}
              {i > 0 && <p className="status">{formatDate(p.date)}</p>}
              <div className="program-meta">
                {p.time && <span><Clock size={16} />{p.time}</span>}
                {p.location && <span><MapPin size={16} />{p.location}</span>}
              </div>
              {p.description && <p className="whitespace-pre-wrap leading-7">{p.description}</p>}
              <div className="program-actions">
                <Button asChild><a href={calendarLink(p)} target="_blank" rel="noreferrer"><CalendarPlus />Add to Calendar</a></Button>
                {p.location && <Button asChild variant="outline"><a href={directionsLink(p.location)} target="_blank" rel="noreferrer"><Navigation />Get Directions</a></Button>}
              </div>
            </article>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
