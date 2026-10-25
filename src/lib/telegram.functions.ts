import { createServerFn } from '@tanstack/react-start';
/** Fetch only public post identifiers, never private messages or account data. */
export const telegramPosts = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await fetch('https://t.me/s/basileiaminintl', { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return { posts: [] as string[], unavailable: true };
    const html = await response.text();
    const matches = [...html.matchAll(/data-post="(basileiaminintl\/\d+)"/g)].map(match => match[1]).filter((id): id is string => !!id);
    return { posts: [...new Set(matches)].slice(-8).reverse(), unavailable: false };
  } catch { return { posts: [] as string[], unavailable: true }; }
});