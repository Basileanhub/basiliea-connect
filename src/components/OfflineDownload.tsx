import { useEffect, useState } from 'react';
import { CheckCircle2, Download, LoaderCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

const CACHE = 'bmi-downloads';
type State = 'checking' | 'none' | 'saving' | 'saved' | 'error';

/** Tracks whether a file is saved on this device for offline use. */
export function useDownload(url: string) {
  const [state, setState] = useState<State>('checking');
  useEffect(() => {
    let live = true;
    const check = () => {
      if (!url || typeof caches === 'undefined') { setState('none'); return; }
      caches.open(CACHE).then(c => c.match(url)).then(r => { if (live) setState(r ? 'saved' : 'none'); }).catch(() => { if (live) setState('none'); });
    };
    check();
    window.addEventListener('bmi-downloads', check);
    return () => { live = false; window.removeEventListener('bmi-downloads', check); };
  }, [url]);
  async function save() {
    setState('saving');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('failed');
      const cache = await caches.open(CACHE);
      await cache.put(url, response);
      setState('saved');
      window.dispatchEvent(new Event('bmi-downloads'));
    } catch { setState('error'); }
  }
  async function remove() {
    const cache = await caches.open(CACHE);
    await cache.delete(url);
    setState('none');
    window.dispatchEvent(new Event('bmi-downloads'));
  }
  return { state, save, remove };
}

/** A playable/openable address: the saved copy when downloaded, otherwise the online file. */
export function useOfflineSrc(url: string, saved: boolean) {
  const [src, setSrc] = useState(url);
  useEffect(() => {
    if (!saved || typeof caches === 'undefined') { setSrc(url); return; }
    let objectUrl = '';
    let live = true;
    caches.open(CACHE).then(c => c.match(url)).then(async r => {
      if (!r || !live) return;
      objectUrl = URL.createObjectURL(await r.blob());
      setSrc(objectUrl);
    }).catch(() => setSrc(url));
    return () => { live = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, saved]);
  return src;
}

export function DownloadButton({ download, label = 'Download' }: { download: ReturnType<typeof useDownload>; label?: string }) {
  const { state, save, remove } = download;
  if (state === 'saved') return (
    <span className="download-state">
      <span className="downloaded-badge"><CheckCircle2 size={16} /> Downloaded</span>
      <Button variant="ghost" size="icon" aria-label="Remove download" title="Remove download" onClick={() => { if (window.confirm('Remove this download from your device?')) void remove(); }}><Trash2 /></Button>
    </span>
  );
  return (
    <span className="download-state">
      <Button variant="outline" size="sm" disabled={state === 'saving' || state === 'checking'} onClick={() => void save()}>
        {state === 'saving' ? <LoaderCircle className="animate-spin" /> : <Download />}
        {state === 'saving' ? 'Downloading…' : label}
      </Button>
      <span className="not-downloaded">{state === 'error' ? 'Download failed. Try again.' : 'Not downloaded'}</span>
    </span>
  );
}
