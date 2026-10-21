import { createFileRoute, redirect } from '@tanstack/react-router';

// Contact was renamed to Partnership.
export const Route = createFileRoute('/contact')({
  beforeLoad: () => { throw redirect({ to: '/partnership', replace: true }); },
});
