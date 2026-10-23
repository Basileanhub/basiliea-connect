import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { contentOptions } from '@/lib/content-query';
import { ProgramCalendar } from '@/components/ProgramCalendar';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/events')({
  head: () => pageMeta('Events', 'Monthly program calendar for Basileia Ministries International branches and special events.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentOptions),
  component: Events,
});

function Events() {
  const { data } = useSuspenseQuery(contentOptions);
  return (
    <main>
      <section className="section">
        <div className="container-main">
          <h1 className="page-heading">Monthly Program Calendar</h1>
          <ProgramCalendar events={data.events} />
        </div>
      </section>
    </main>
  );
}
