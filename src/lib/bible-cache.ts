import type { Row } from './cms-model';
export const BIBLE_CACHE = 'bmi-bibles-v1';
const active = new Map<string, Promise<void>>();
/** Cache each published text address once; a changed address gets a fresh copy. */
export async function cachePublishedBibles(versions: Row[]) {
  if (typeof caches === 'undefined') return;
  const cache = await caches.open(BIBLE_CACHE);
  for (const version of versions) {
    const url = String(version['text_url'] ?? '');
    if (!url || await cache.match(url)) continue;
    let task = active.get(url);
    if (!task) {
      task = (async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Bible cache unavailable');
        await cache.put(url, response);
      })().finally(() => active.delete(url));
      active.set(url, task);
    }
    await task;
  }
}