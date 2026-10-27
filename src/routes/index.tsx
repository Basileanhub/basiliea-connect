import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, CalendarDays, MapPin, NotebookPen, BookOpenCheck, HeartHandshake, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageMeta } from '@/lib/page-meta';
import { contentOptions } from '@/lib/content-query';
import { formatDate, upcomingPrograms, ymd, type ProgramDay } from '@/lib/events-calendar';
import type { Row } from '@/lib/cms-model';
import worship from '@/assets/worship.jpg';
import welcome from '@/assets/bmi-hero-october.mp4.asset.json';
import devotionCover from '@/assets/devotion-cover.jpg';
import readingCover from '@/assets/reading-cover.jpg';
import prayerCover from '@/assets/prayer-cover.jpg';
import wordCover from '@/assets/word-cover.jpg';
import { ProgramCalendar } from '@/components/ProgramCalendar';
import { orderedHome } from '@/lib/visual-order';

export const Route = createFileRoute('/')({
  head: () => pageMeta('Welcome home', 'Welcome to Basileia Ministries International. The gospel of the Kingdom from the church to the world.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentOptions),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(contentOptions);
  const s = data.settings;
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const videoSrc = s['hero_video'] || welcome.url;
  useEffect(() => { const v = video.current; if (v) { v.muted = true; void v.play().catch(() => setPaused(true)); } }, [videoSrc]);

  const blocks = [
    { key: 'devotion', to: '/devotion', icon: NotebookPen, image: devotionCover, latest: data.devotions[0]?.['title'] },
    { key: 'plan', to: '/reading-plan', icon: BookOpenCheck, image: readingCover, latest: data.reading_plans[0]?.['title'] },
    { key: 'prayer', to: '/prayer', icon: HeartHandshake, image: prayerCover, latest: null },
    { key: 'word', to: '/sermons', icon: Headphones, image: wordCover, latest: data.sermons[0]?.['title'] },
  ] as const;

  return (
    <main className="home-cinema">
      <section className="cine-hero">
        <video ref={video} className="cine-video" src={videoSrc} poster={worship} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        <div className="cine-content">
          <div className="eyebrow">{s['hero_tagline']}</div>
          <h1>{s['hero_title']}</h1>
          {s['hero_description'] && <p className="hero-description">{s['hero_description']}</p>}
        </div>
        <Button variant="hero" size="icon" className="cine-play" aria-label={paused ? 'Play welcome video' : 'Pause welcome video'} onClick={() => { const v = video.current; if (!v) return; if (paused) void v.play(); else v.pause(); setPaused(!paused); }}>
          {paused ? <Play /> : <Pause />}
        </Button>
      </section>

      <section className="cine-float container-main">
        <EventsSlider events={data.events} label={s['events_label'] ?? ''} cta={s['events_cta'] || 'View all events'} />
      </section>

      <Reveal className="cine-calendar container-main">
        <div className="weekly-label"><CalendarDays size={18} />Program calendar</div>
        <ProgramCalendar events={data.events} />
        <Link to="/events" className="verse-cta">View full program calendar <ArrowRight size={16} /></Link>
      </Reveal>

      <section className="grow-blocks container-main" aria-label="Ministry resources">
        {orderedHome(s['home_order']).flatMap(key => { const b = blocks.find(item => item.key === key); return b ? [b] : []; }).map((b, i) => (
          <Reveal key={b.key} className={`grow-block${i % 2 ? ' flip' : ''}`}>
            <div className="grow-photo"><img src={s[`${b.key}_image_url`] || b.image} alt="" loading="lazy" width={1024} height={768} /></div>
            <div className="grow-text">
              <div className="weekly-label"><b.icon size={18} />{s[`${b.key}_label`]}</div>
              {s[`${b.key}_verse_text`] && <blockquote>“{s[`${b.key}_verse_text`]}”</blockquote>}
              {s[`${b.key}_verse_ref`] && <cite>{s[`${b.key}_verse_ref`]}</cite>}
              {b.latest && <p className="verse-latest">Latest: {String(b.latest)}</p>}
              <Link to={b.to} className="verse-cta">{s[`${b.key}_cta`] || 'Open'} <ArrowRight size={16} /></Link>
            </div>
          </Reveal>
        ))}
      </section>
    </main>
  );
}

function Reveal({ className, children }: { className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <section ref={ref} className={`${className} reveal${shown ? ' in' : ''}`}>{children}</section>;
}

function EventsSlider({ events, label, cta }: { events: Row[]; label: string; cta: string }) {
  const [todayKey, setTodayKey] = useState('');
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => { const d = new Date(); setTodayKey(ymd(d.getFullYear(), d.getMonth(), d.getDate())); }, []);
  const slides: ProgramDay[] = useMemo(() => (todayKey ? upcomingPrograms(events, todayKey) : []), [events, todayKey]);
  useEffect(() => {
    if (slides.length < 2 || hold) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length, hold]);
  const slide = slides[index % Math.max(slides.length, 1)];
  const image = slide?.image;

  return (
    <div className="weekly-block events-slider" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      <div className="weekly-label"><CalendarDays size={18} />{label}</div>
      <div className="slide-window" aria-live="polite">
        {slide ? (
          <div key={slide.id} className="event-slide">
            <p className="slide-date">{formatDate(slide.date)}</p>
            <h2>{slide.title}</h2>
            <p className="slide-meta">{[slide.time, slide.location].filter(Boolean).map(t => <span key={t}><MapPin size={14} />{t}</span>)}</p>
            {slide.description && <p className="slide-description">{slide.description}</p>}
            {image && <div className="weekly-cover"><img src={String(image)} alt={slide.title} /></div>}
          </div>
        ) : <div className="event-slide"><h2>&nbsp;</h2></div>}
      </div>
      <div className="slider-foot">
        {slides.length > 1 && (
          <div className="slider-dots" role="tablist" aria-label="Choose event">
            {slides.map((o, i) => <button key={o.id} type="button" role="tab" aria-selected={i === index % slides.length} aria-label={`Show ${o.title}${o.branch ? `, ${o.branch}` : ''}`} onClick={() => setIndex(i)} />)}
          </div>
        )}
        <Link to="/events" className="slider-cta">{cta} <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
