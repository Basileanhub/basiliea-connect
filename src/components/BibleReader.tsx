import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ChevronLeft, ChevronRight, Copy, LoaderCircle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { contentOptions, identityOptions } from '@/lib/content-query';
import { chapterHighlights, removeHighlight, saveHighlight } from '@/lib/cms.functions';
import { highlightColors, type HighlightColor } from '@/lib/cms-model';
import type { BibleData } from '@/lib/bible-text';
import { MemberAuth } from './MemberAuth';
import { BIBLE_CACHE } from '@/lib/bible-cache';

const loaded = new Map<string, Promise<BibleData>>();
/** Opens a Bible's text, using the copy saved on this device when there is one. */
function loadBible(url: string) {
  let pending = loaded.get(url);
  if (!pending) {
    pending = (async () => {
      const saved = typeof caches !== 'undefined' ? await caches.open(BIBLE_CACHE).then(c => c.match(url)).catch(() => undefined) : undefined;
      const response = saved ?? await fetch(url);
      if (!response.ok) throw new Error('Bible text unavailable');
      return await response.json() as BibleData;
    })();
    pending.catch(() => loaded.delete(url));
    loaded.set(url, pending);
  }
  return pending;
}

const POSITION_KEY = 'bmi-bible-position';

export function BibleReader() {
  const { data } = useSuspenseQuery(contentOptions);
  const versions = data.bibles;
  const [code, setCode] = useState(String(versions[0]?.['code'] ?? ''));
  const [book, setBook] = useState(0);
  const [chapter, setChapter] = useState(0);
  const [bible, setBible] = useState<BibleData | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [notice, setNotice] = useState('');
  const version = versions.find(v => String(v['code']) === code) ?? versions[0];
  const url = String(version?.['text_url'] ?? '');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(POSITION_KEY) ?? 'null') as { code?: string; book?: number; chapter?: number } | null;
      if (saved?.code && versions.some(v => String(v['code']) === saved.code)) setCode(saved.code);
      if (typeof saved?.book === 'number') setBook(saved.book);
      if (typeof saved?.chapter === 'number') setChapter(saved.chapter);
    } catch { /* first visit */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { try { localStorage.setItem(POSITION_KEY, JSON.stringify({ code, book, chapter })); } catch { /* storage full */ } }, [code, book, chapter]);

  useEffect(() => {
    if (!url) return;
    let live = true;
    setError('');
    loadBible(url).then(b => { if (live) setBible(b); }).catch(() => { if (live) setError('This Bible could not be opened. Please check your internet connection and try again.'); });
    return () => { live = false; };
  }, [url]);

  const books = bible?.books ?? [];
  const bookIndex = Math.min(book, Math.max(books.length - 1, 0));
  const current = books[bookIndex];
  const chapterIndex = Math.min(chapter, Math.max((current?.chapters.length ?? 1) - 1, 0));
  const verses = current?.chapters[chapterIndex] ?? [];
  const bookName = current?.name ?? '';
  const prefix = `${code}:${bookName}:${chapterIndex + 1}:`;

  const { data: user } = useQuery(identityOptions);
  const member = !!user;
  const fetchMarks = useServerFn(chapterHighlights);
  const save = useServerFn(saveHighlight);
  const remove = useServerFn(removeHighlight);
  const qc = useQueryClient();
  const { data: marks = [] } = useQuery({ queryKey: ['highlights', prefix], queryFn: () => fetchMarks({ data: { prefix } }), enabled: member && !!bookName });
  const colors = useMemo(() => new Map(marks.map(m => [String(m['ref_id']), String(m['color'])])), [marks]);

  function go(nextBook: number, nextChapter: number) {
    setBook(nextBook); setChapter(nextChapter); setSelected(null); setNotice('');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const hasPrev = bookIndex > 0 || chapterIndex > 0;
  const hasNext = bookIndex < books.length - 1 || chapterIndex < (current?.chapters.length ?? 1) - 1;
  function prev() {
    if (chapterIndex > 0) go(bookIndex, chapterIndex - 1);
    else if (bookIndex > 0) go(bookIndex - 1, (books[bookIndex - 1]?.chapters.length ?? 1) - 1);
  }
  function next() {
    if (chapterIndex < (current?.chapters.length ?? 1) - 1) go(bookIndex, chapterIndex + 1);
    else if (bookIndex < books.length - 1) go(bookIndex + 1, 0);
  }

  const ref = selected === null ? '' : `${prefix}${selected + 1}`;
  const label = selected === null ? '' : `${bookName} ${chapterIndex + 1}:${selected + 1}`;
  async function mark(color: HighlightColor) {
    if (selected === null) return;
    if (!member) { setJoining(true); return; }
    try {
      await save({ data: { ref_id: ref, color, highlighted_text: verses[selected] ?? '', note: '' } });
      await qc.invalidateQueries({ queryKey: ['highlights', prefix] });
      setSelected(null);
    } catch { setNotice('The highlight could not be saved. Please try again.'); }
  }
  async function unmark() {
    try { await remove({ data: { ref_id: ref } }); await qc.invalidateQueries({ queryKey: ['highlights', prefix] }); setSelected(null); }
    catch { setNotice('The highlight could not be removed. Please try again.'); }
  }
  async function copy() {
    if (selected === null) return;
    try { await navigator.clipboard.writeText(`${verses[selected]} — ${label} (${code})`); setNotice('Verse copied.'); setSelected(null); }
    catch { setNotice('Copy is not available on this device.'); }
  }

  if (!versions.length) return <p className="status">No Bible versions have been published yet.</p>;

  return (
    <div className="bible-reader">
      <nav className="bible-nav" aria-label="Bible navigation">
        <select aria-label="Bible version" className="version-select" value={code} onChange={e => { setCode(e.target.value); setSelected(null); }}>
          {versions.map(v => <option key={String(v['id'])} value={String(v['code'])}>{String(v['code'])}</option>)}
        </select>
        <Button variant="ghost" size="icon" aria-label="Previous chapter" disabled={!bible || !hasPrev} onClick={prev}><ChevronLeft /></Button>
        <select aria-label="Book" value={bookIndex} disabled={!bible} onChange={e => go(Number(e.target.value), 0)}>
          {books.map((b, i) => <option key={b.name} value={i}>{b.name}</option>)}
        </select>
        <select aria-label="Chapter" value={chapterIndex} disabled={!bible} onChange={e => go(bookIndex, Number(e.target.value))}>
          {(current?.chapters ?? []).map((_, i) => <option key={i} value={i}>{i + 1}</option>)}
        </select>
        <Button variant="ghost" size="icon" aria-label="Next chapter" disabled={!bible || !hasNext} onClick={next}><ChevronRight /></Button>
      </nav>

      {error && <p role="alert" className="status">{error}</p>}
      {!bible && !error && <p className="status flex items-center gap-2"><LoaderCircle className="animate-spin" size={16} /> Opening Scripture…</p>}

      {bible && current && (
        <article className="bible-text" lang="en">
          <p className="bible-version-name">{String(version?.['name'] ?? '')}</p>
          <h1>{bookName} {chapterIndex + 1}</h1>
          <p>
            {verses.map((verse, i) => {
              if (!verse) return null;
              const color = colors.get(`${prefix}${i + 1}`);
              return (
                <span
                  key={i}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected === i}
                  aria-label={`Verse ${i + 1}`}
                  className={`verse${color ? ` hl-${color}` : ''}${selected === i ? ' selected' : ''}`}
                  onClick={() => setSelected(selected === i ? null : i)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(selected === i ? null : i); } }}
                >
                  <sup>{i + 1}</sup>{verse}{' '}
                </span>
              );
            })}
          </p>
          <div className="bible-footer-nav">
            <Button variant="outline" disabled={!hasPrev} onClick={prev}><ChevronLeft />Previous</Button>
            <Button variant="outline" disabled={!hasNext} onClick={next}>Next<ChevronRight /></Button>
          </div>
          {notice && <p role="status" className="status">{notice}</p>}
        </article>
      )}

      {selected !== null && (
        <div className="verse-actions" role="dialog" aria-label={`Actions for ${label}`}>
          <strong>{label}</strong>
          <div className="swatches">
            {highlightColors.map(c => <button key={c} type="button" className={`swatch hl-${c}`} aria-label={`Highlight ${c}`} title={`Highlight ${c}`} onClick={() => void mark(c)} />)}
          </div>
          {colors.has(ref) && <Button variant="ghost" size="icon" aria-label="Remove highlight" title="Remove highlight" onClick={() => void unmark()}><Trash2 /></Button>}
          <Button variant="ghost" size="icon" aria-label="Copy verse" title="Copy verse" onClick={() => void copy()}><Copy /></Button>
          <Button variant="ghost" size="icon" aria-label="Close" title="Close" onClick={() => setSelected(null)}><X /></Button>
        </div>
      )}

      <Dialog open={joining} onOpenChange={setJoining}>
        <DialogContent className="signup-dialog">
          <DialogTitle>Save your highlights</DialogTitle>
          <DialogDescription>Sign in or create a member account to keep coloured highlights as your Bible bookmarks.</DialogDescription>
          <MemberAuth onDone={() => setJoining(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
