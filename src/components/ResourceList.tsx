import { useSuspenseQuery } from '@tanstack/react-query';
import { contentOptions } from '@/lib/content-query';
import { Button } from './ui/button';
import { DownloadButton, useDownload, useOfflineSrc } from './OfflineDownload';
import type { Row } from '@/lib/cms-model';
import { orderedRows } from '@/lib/visual-order';

type ListModule = 'devotions' | 'reading_plans' | 'sermons' | 'library';

export function ResourceList({ module }: { module: ListModule }) {
  const { data } = useSuspenseQuery(contentOptions);
  const rows: Row[] = orderedRows(data[module], data.settings[`${module}_order`]);
  return (
    <main>
      <section className="section">
        <div className="container-main">
          <div className="content-list">
            {rows.length
              ? rows.map(row => <ResourceRow key={String(row['id'])} row={row} module={module} />)
              : <p className="status">Nothing has been published here yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

function ResourceRow({ row, module }: { row: Row; module: ListModule }) {
  const image = row['cover_image_url'] ?? row['image_url'];
  const file = String(row['file_url'] ?? row['audio_url'] ?? '');
  const downloadable = (module === 'sermons' || module === 'library') && !!file;
  return (
    <article className="content-item">
      {image && <img src={String(image)} alt={String(row['title'])} className="content-cover" loading="lazy" />}
      <div>
        <h2>{row['title']}</h2>
        {row['preacher'] && <p className="status">{row['preacher']}</p>}
        {row['author'] && <p className="status">{row['author']}</p>}
        {(row['book'] || row['chapters']) && <p className="status">{[row['book'], row['chapters']].filter(Boolean).join(' ')}</p>}
        {row['scripture'] && <blockquote>{row['scripture']}</blockquote>}
        <p className="whitespace-pre-wrap leading-8">{row['content'] ?? row['description']}</p>
        {downloadable && <Downloadable module={module} url={file} title={String(row['title'])} />}
      </div>
    </article>
  );
}

function Downloadable({ module, url, title }: { module: ListModule; url: string; title: string }) {
  const download = useDownload(url);
  const src = useOfflineSrc(url, download.state === 'saved');
  return (
    <>
      {module === 'sermons' && <audio controls preload="none" src={src} className="w-full" />}
      <div className="resource-actions">
        {module === 'library' && <Button asChild variant="outline" size="sm"><a href={src} target="_blank" rel="noreferrer" aria-label={`Open ${title}`}>Open PDF</a></Button>}
        <DownloadButton download={download} label={module === 'sermons' ? 'Download message' : 'Download book'} />
      </div>
    </>
  );
}
