import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Repeat, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { contentOptions } from '@/lib/content-query';
import { formatDate, monthCells, occurrencesForMonth, ruleLabel, upcomingEvents, ymd, parseDates, type Occurrence } from '@/lib/events-calendar';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/events')({
  head: () => pageMeta('Events', 'Program calendar for BMI Ibadan and BMI Ogbomoso, plus special events from Basileia Ministries International.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentOptions),
  component: Events,
});

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Events() {
  const { data } = useSuspenseQuery(contentOptions);
  const events = data.events;
  const programs = events.filter(e => String(e['kind'] ?? 'special') === 'fixed');
  const [view, setView] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [todayKey, setTodayKey] = useState('');
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => { const d = new Date(); setTodayKey(ymd(d.getFullYear(), d.getMonth(), d.getDate())); }, []);

  const occurrences = useMemo(() => occurrencesForMonth(events, view.year, view.month), [events, view]);
  const byDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const o of occurrences) map.set(o.date, [...(map.get(o.date) ?? []), o]);
    return map;
  }, [occurrences]);
  const special = useMemo(() => todayKey ? upcomingEvents(events.filter(e => String(e['kind'] ?? 'special') !== 'fixed'), new Date(), 12) : [], [events, todayKey]);
  const listed = day ? byDay.get(day) ?? [] : occurrences;
  const monthName = new Date(view.year, view.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  function move(step: number) {
    setDay(null);
    setView(v => { const d = new Date(v.year, v.month + step, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  }

  return (
    <main>
      <section className="section">
        <div className="container-main">
          <h1 className="page-heading">Events</h1>
          {programs.length > 0 && (
            <div className="program-cards">
              {programs.map(p => {
                const custom = parseDates(p['dates']);
                return (
                  <article key={String(p['id'])} className="program-card">
                    <span className="program-branch">{p['branch']}</span>
                    <h2>{p['title']}</h2>
                    <p><Repeat size={15} />{ruleLabel(String(p['recurrence'] ?? '')) || (custom.length ? 'Set dates' : 'Dates to be announced')}</p>
                    {p['location'] && <p><MapPin size={15} />{p['location']}</p>}
                    {p['description'] && <p className="status">{p['description']}</p>}
                  </article>
                );
              })}
            </div>
          )}

          <div className="calendar" aria-label={`Calendar for ${monthName}`}>
            <div className="calendar-head">
              <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft /></Button>
              <h2>{monthName}</h2>
              <Button variant="outline" size="icon" aria-label="Next month" onClick={() => move(1)}><ChevronRight /></Button>
            </div>
            <div className="calendar-grid">
              {dayNames.map(n => <div key={n} className="calendar-weekday">{n}</div>)}
              {monthCells(view.year, view.month).map((d, i) => {
                if (d === null) return <div key={`blank-${i}`} className="calendar-day blank" />;
                const key = ymd(view.year, view.month, d);
                const items = byDay.get(key) ?? [];
                return (
                  <button
                    type="button"
                    key={key}
                    className={`calendar-day${key === todayKey ? ' today' : ''}${key === day ? ' chosen' : ''}${items.length ? ' has-events' : ''}`}
                    aria-label={`${formatDate(key)}${items.length ? `, ${items.length} event${items.length > 1 ? 's' : ''}` : ''}`}
                    aria-pressed={key === day}
                    onClick={() => setDay(key === day ? null : key)}
                  >
                    <span className="day-number">{d}</span>
                    <span className="day-events">
                      {items.map(o => <span key={o.id} className={`event-chip ${o.kind}`}>{o.branch ? `${o.branch.replace(/^BMI\s+/i, '')} · ` : ''}{o.title}</span>)}
                    </span>
                    {items.length > 0 && <span className="day-dots" aria-hidden="true">{items.map(o => <i key={o.id} className={o.kind} />)}</span>}
                  </button>
                );
              })}
            </div>
            <div className="calendar-legend"><span><i className="fixed" />Branch programs</span><span><i className="special" />Special events</span></div>
          </div>

          <div className="month-list">
            <div className="month-list-head">
              <h2>{day ? formatDate(day) : `This month`}</h2>
              {day && <Button variant="link" onClick={() => setDay(null)}>Show the whole month</Button>}
            </div>
            {listed.length ? listed.map(o => (
              <article key={`${o.id}-${o.date}`} className="event-row">
                <time dateTime={o.date}>{formatDate(o.date, { weekday: 'short', day: 'numeric', month: 'short' })}</time>
                <div>
                  <h3>{o.title}</h3>
                  <p className="status">{[o.branch, o.location].filter(Boolean).join(' · ')}</p>
                </div>
              </article>
            )) : <p className="status">No events on this date.</p>}
          </div>

          {special.length > 0 && (
            <div className="special-events">
              <h2><Star size={18} />Special events</h2>
              {special.map(o => {
                const row = events.find(e => String(e['id']) === o.id);
                const link = String(row?.['registration_link'] ?? '');
                return (
                  <article key={o.id} className="content-item">
                    {row?.['image_url'] && <img src={String(row['image_url'])} alt={o.title} className="content-cover" loading="lazy" />}
                    <div>
                      <p className="program-branch">{formatDate(o.date)}</p>
                      <h3>{o.title}</h3>
                      {o.location && <p className="status">{o.location}</p>}
                      {o.description && <p className="whitespace-pre-wrap leading-8">{o.description}</p>}
                      {/^https:\/\//.test(link) && <Button asChild variant="outline" size="sm"><a href={link} target="_blank" rel="noreferrer">Register</a></Button>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
