export type BibleBook = { name: string; chapters: string[][] };
export type BibleData = { code: string; name: string; books: BibleBook[] };

/**
 * Accepts a Bible in the site's JSON format, or plain text with one verse per line:
 *   "Genesis 1:1 In the beginning…"  or  "Genesis<TAB>1<TAB>1<TAB>In the beginning…"
 */
export function parseBibleText(text: string, code: string, name: string): BibleData {
  const trimmed = text.trim().replace(/^\uFEFF/, '');
  if (trimmed.startsWith('{')) {
    const data = JSON.parse(trimmed) as Partial<BibleData>;
    if (!Array.isArray(data.books) || !data.books.length) throw new Error('This file has no Bible books in it.');
    const books = data.books.map(b => ({ name: String(b.name), chapters: (b.chapters ?? []).map(c => c.map(v => String(v ?? ''))) }));
    return { code, name, books };
  }
  const books: BibleBook[] = [];
  const index = new Map<string, BibleBook>();
  const line = /^\s*((?:[1-4]\s*)?[A-Za-z][A-Za-z .']*?)\s+(\d+)\s*:\s*(\d+)\s+(.+)$/;
  let count = 0;
  for (const raw of trimmed.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    let book: string | undefined, chapter: number, verse: number, words: string | undefined;
    const tabs = raw.split('\t');
    if (tabs.length >= 4 && /^\d+$/.test(tabs[1]!.trim()) && /^\d+$/.test(tabs[2]!.trim())) {
      book = tabs[0]!.trim(); chapter = Number(tabs[1]); verse = Number(tabs[2]); words = tabs.slice(3).join(' ').trim();
    } else {
      const m = raw.match(line);
      if (!m) continue;
      book = m[1]!.replace(/\s+/g, ' ').trim(); chapter = Number(m[2]); verse = Number(m[3]); words = m[4]!.trim();
    }
    if (!book || !words || chapter < 1 || verse < 1) continue;
    let entry = index.get(book);
    if (!entry) { entry = { name: book, chapters: [] }; index.set(book, entry); books.push(entry); }
    while (entry.chapters.length < chapter) entry.chapters.push([]);
    const verses = entry.chapters[chapter - 1]!;
    while (verses.length < verse) verses.push('');
    verses[verse - 1] = words;
    count++;
  }
  if (!count) throw new Error('No verses were found. Use one verse per line, like "Genesis 1:1 In the beginning…".');
  return { code, name, books };
}
