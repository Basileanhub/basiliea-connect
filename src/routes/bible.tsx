import { createFileRoute } from '@tanstack/react-router';
import { BibleReader } from '@/components/BibleReader';
import { contentOptions } from '@/lib/content-query';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/bible')({
  head: () => pageMeta('The Holy Bible', 'Read the Bible verse by verse in the King James Version and New International Version, and highlight verses to bookmark them.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(contentOptions),
  component: Bible,
});

function Bible() {
  return <main><section className="bible-section"><div className="container-main"><BibleReader /></div></section></main>;
}
