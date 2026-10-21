import { createFileRoute, redirect } from '@tanstack/react-router';

// Downloads now happen directly on The Word and Library pages.
export const Route = createFileRoute('/downloads')({
  beforeLoad: () => { throw redirect({ to: '/sermons', replace: true }); },
});
