import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, CalendarDays, NotebookPen, BookOpenCheck, HeartHandshake, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageMeta } from '@/lib/page-meta';
import { contentOptions } from '@/lib/content-query';
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
        <div className="home-program-panel">
          <div className="weekly-label"><CalendarDays size={18} />{s['events_label'] || 'Program calendar'}</div>
          <ProgramCalendar events={data.events} compact />
          <Button asChild className="home-calendar-cta"><Link to="/events">{s['events_cta'] || 'View all events'} <ArrowRight size={16} /></Link></Button>
        </div>
      </section>

      <section className="grow-blocks container-main" aria-label="Ministry resources">
        {orderedHome(s['home_order']).flatMap(key => { const b = blocks.find(item => item.key === key); return b ? [b] : []; }).map((b, i) => (
          <section key={b.key} className={`grow-block${i % 2 ? ' flip' : ''}`}>
            <div className="grow-photo"><img src={s[`${b.key}_image_url`] || b.image} alt="" loading="lazy" width={1024} height={768} /></div>
            {s[`${b.key}_verse_text`] && <blockquote>“{s[`${b.key}_verse_text`]}”</blockquote>}
            {s[`${b.key}_verse_ref`] && <cite>{s[`${b.key}_verse_ref`]}</cite>}
            {b.latest && <p className="verse-latest">Latest: {String(b.latest)}</p>}
            <Button asChild className="grow-cta"><Link to={b.to}>{s[`${b.key}_label`] || 'Open'}</Link></Button>
          </section>
        ))}
      </section>
    </main>
  );
}


