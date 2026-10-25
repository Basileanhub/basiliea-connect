import { useState } from 'react';
import { Save, Trash2, Eye } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from './ui/button';
import { MediaUpload, uploadMedia } from './MediaUpload';
import { StudioSort, StudioSortableItem } from './StudioSort';
import { saveSettings } from '@/lib/cms.functions';
import { orderedHome } from '@/lib/visual-order';
import welcome from '@/assets/bmi-hero-october.mp4.asset.json';
import devotion from '@/assets/devotion-cover.jpg';
import reading from '@/assets/reading-cover.jpg';
import prayer from '@/assets/prayer-cover.jpg';
import word from '@/assets/word-cover.jpg';

const images: Record<string, string> = { devotion, plan: reading, prayer, word };
export function StudioHomeEditor({ initial, onSaved }: { initial: Record<string, string>; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState(initial);
  const [order, setOrder] = useState(() => orderedHome(initial['home_order']));
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveSettings);
  function change(key: string, value: string) { setDraft(old => ({ ...old, [key]: value })); setStatus('Unsaved changes'); }
  async function drop(event: React.DragEvent, key: string, accept: 'video' | 'image') {
    event.preventDefault(); const file = event.dataTransfer.files[0]; if (!file) return;
    if (!file.type.startsWith(`${accept}/`)) { setStatus(`Choose a ${accept} file.`); return; }
    setStatus('Uploading…');
    try { change(key, await uploadMedia('settings', file)); } catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.'); }
  }
  return <div className="studio-visual-editor">
    <div className="studio-editor-bar"><h2>Home page</h2><Button variant="outline" asChild><a href="/" target="_blank" rel="noreferrer"><Eye />Preview</a></Button><Button disabled={busy} onClick={async () => {
      if (!window.confirm('Publish these Home page changes for all visitors?')) return;
      setBusy(true); try { await save({ data: { ...draft, home_order: JSON.stringify(order) } }); await onSaved(); setStatus('Home page saved.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Save failed.'); } finally { setBusy(false); }
    }}><Save />{busy ? 'Saving…' : 'Save changes'}</Button></div>
    {status && <p role="status" className="status">{status}</p>}
    <div className="studio-hero-edit" onDragOver={event => event.preventDefault()} onDrop={event => void drop(event, 'hero_video', 'video')}>
      <video src={draft['hero_video'] || welcome.url} muted loop playsInline controls preload="metadata" />
      <div className="cms-form"><label>Welcome heading<textarea value={draft['hero_title'] ?? ''} onChange={event => change('hero_title', event.target.value)} /></label><label>Tagline<textarea value={draft['hero_tagline'] ?? ''} onChange={event => change('hero_tagline', event.target.value)} /></label><label>Welcome text<textarea value={draft['hero_description'] ?? ''} onChange={event => change('hero_description', event.target.value)} /></label>
        <MediaUpload module="settings" accept="video/mp4,video/webm" label="Replace video" onUploaded={url => change('hero_video', url)} />
        <Button variant="outline" onClick={() => { if (window.confirm('Remove the custom video and use the uploaded welcome video?')) change('hero_video', ''); }}><Trash2 />Reset video</Button>
      </div>
    </div>
    <StudioSort ids={order} onOrder={next => { setOrder(next); setStatus('Unsaved changes'); }}>
      <div className="studio-home-sections">{order.map((key, index) => <StudioSortableItem key={key} id={key} first={index === 0} last={index === order.length - 1} move={step => { const next = [...order]; const other = next[index + step]; if (!other) return; next[index] = other; next[index + step] = key; setOrder(next); setStatus('Unsaved changes'); }}>
        <div className="studio-section-media" onDragOver={event => event.preventDefault()} onDrop={event => void drop(event, `${key}_image_url`, 'image')}>
          <img src={draft[`${key}_image_url`] || images[key]} alt={draft[`${key}_label`] ?? key} loading="lazy" />
          <MediaUpload module="settings" accept="image/*" label="Replace image" onUploaded={url => change(`${key}_image_url`, url)} />
          <Button variant="ghost" size="icon" aria-label="Reset block image" title="Reset block image" onClick={() => { if (window.confirm('Use the original image for this block?')) change(`${key}_image_url`, ''); }}><Trash2 /></Button>
        </div>
        <div className="cms-form">{[['label', 'Heading'], ['verse_text', 'Bible text'], ['verse_ref', 'Scripture reference'], ['cta', 'Link text']].map(([suffix, label]) => <label key={suffix}>{label}<textarea rows={suffix === 'verse_text' ? 3 : 1} value={draft[`${key}_${suffix}`] ?? ''} onChange={event => change(`${key}_${suffix}`, event.target.value)} /></label>)}</div>
      </StudioSortableItem>)}</div>
    </StudioSort>
  </div>;
}