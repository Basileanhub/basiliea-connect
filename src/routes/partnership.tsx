import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { HandCoins, Info } from 'lucide-react';
import { contentOptions } from '@/lib/content-query';
import { AccountCopy } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/partnership')({
  head: () => pageMeta('Partnership', 'Partner with Basileia Ministries International through offerings, tithes, seeds, world missions, welfare and more.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentOptions),
  component: Partnership,
});

function Partnership() {
  const { data } = useSuspenseQuery(contentOptions);
  const s = data.settings;
  const items = (s['partnership_items'] ?? '').split(/\r?\n/).map(i => i.trim()).filter(Boolean);
  return (
    <main className="partnership">
      <section className="section">
        <div className="container-main">
          <h1 className="page-heading">{s['partnership_title'] || 'Partnership'}</h1>
          {s['partnership_intro'] && <p className="page-lead">{s['partnership_intro']}</p>}
          <ul className="giving-grid">
            {items.map(item => <li key={item}><HandCoins size={20} />{item}</li>)}
          </ul>
          <div className="giving-account">
            <AccountCopy settings={s} />
          </div>
          {s['partnership_narration_note'] && <p className="narration-note"><Info size={18} />{s['partnership_narration_note']}</p>}
        </div>
      </section>
    </main>
  );
}
