import { useState } from 'react';
import { Upload } from 'lucide-react';

/** Uploads a file to the ministry's media storage and returns its address. `prepare` may convert the file first. */
export function MediaUpload({ module, accept, label = 'Upload file', onUploaded, prepare }: { module: string; accept: string; label?: string; onUploaded: (url: string, file: File) => void; prepare?: (file: File) => Promise<File> }) {
  const [status, setStatus] = useState('');
  return (
    <span className="media-upload">
      <label className="media-upload-button">
        <Upload size={15} />
        {label}
        <input type="file" accept={accept} className="sr-only" onChange={async e => {
          const chosen = e.target.files?.[0];
          e.target.value = '';
          if (!chosen) return;
          setStatus('Uploading…');
          try {
            const file = prepare ? await prepare(chosen) : chosen;
            const data = new FormData();
            data.set('module', module);
            data.set('file', file);
            const response = await fetch('/api/media/upload', { method: 'POST', body: data });
            const result = await response.json() as { url?: string; error?: string };
            if (result.url) { onUploaded(result.url, chosen); setStatus('Uploaded. Save to publish.'); }
            else setStatus(result.error ?? 'Upload failed.');
          } catch (err) { setStatus(err instanceof Error ? err.message : 'Upload failed.'); }
        }} />
      </label>
      {status && <span role="status" className="status">{status}</span>}
    </span>
  );
}
