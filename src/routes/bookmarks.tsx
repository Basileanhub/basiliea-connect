import { createFileRoute, redirect } from '@tanstack/react-router';

// Bookmarks now live on the Bible page as coloured verse highlights.
export const Route = createFileRoute('/bookmarks')({
  beforeLoad: () => { throw redirect({ to: '/bible', replace: true }); },
});
