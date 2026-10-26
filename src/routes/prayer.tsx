import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { HeartHandshake } from 'lucide-react';
import { submitPrayer } from '@/lib/cms.functions';
import { canSubmitPrayer } from '@/lib/cms-model';
import { contentOptions, identityOptions } from '@/lib/content-query';
import { Button } from '@/components/ui/button';
import { MemberNotice } from '@/components/MinistryShell';
import { formatDate } from '@/lib/events-calendar';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/prayer')({
  head: () => pageMeta('Prayer Wall', 'Share a prayer request with Basileia Ministries International and stand with others in prayer.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentOptions),
  component: Prayer,
});

function Prayer() {
  const { data } = useSuspenseQuery(contentOptions);
  const { data: user, isPending } = useQuery(identityOptions);
  const submit = useServerFn(submitPrayer);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <main>
      <section className="section">
        <div className="container-main prayer-layout">
          <div>
            <h1 className="page-heading">Prayer Wall</h1>
            {isPending ? null : canSubmitPrayer(user) ? (
              <form className="form-panel prayer-form" onSubmit={async e => {
                e.preventDefault(); setBusy(true); setStatus('');
                try { await submit({ data: { text } }); setText(''); setStatus('Thank you. Your request has been received and will appear on the Prayer Wall once an administrator publishes it.'); }
                catch (err) { setStatus(err instanceof Error ? err.message : 'Your request could not be sent. Please try again.'); }
                finally { setBusy(false); }
              }}>
                <label htmlFor="prayer">Your prayer request</label>
                <textarea id="prayer" required rows={6} maxLength={3000} placeholder="What would you like us to pray about?" value={text} onChange={e => setText(e.target.value)} />
                <p className="status">Your name is not shown on the wall.</p>
                <Button className="mt-4" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send prayer request'} <HeartHandshake /></Button>
                {status && <p className="status" role="status">{status}</p>}
              </form>
            ) : (
              <MemberNotice intro="Sign in or create a member account to send a prayer request." />
            )}
          </div>
          <div className="prayer-wall">
            {data.prayers.length ? data.prayers.map(p => (
              <article key={String(p['id'])} className="prayer-card">
                <p>{p['request']}</p>
                <span className="status">{p['created_at'] ? formatDate(String(p['created_at']).slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' }) : ''}{Number(p['is_answered']) === 1 ? ' · Answered' : ''}</span>
              </article>
            )) : <p className="status">No prayer requests have been published yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
