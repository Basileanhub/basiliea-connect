import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Send, ExternalLink } from 'lucide-react';
import { telegramPosts } from '@/lib/telegram.functions';
import { Button } from './ui/button';
import { ResourceList } from './ResourceList';

function TelegramPost({ post }: { post: string }) {
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = holder.current; if (!node) return;
    const script = document.createElement('script'); script.src = 'https://telegram.org/js/telegram-widget.js?22'; script.async = true;
    script.setAttribute('data-telegram-post', post); script.setAttribute('data-width', '100%'); script.setAttribute('data-userpic', 'false');
    node.replaceChildren(script); return () => node.replaceChildren();
  }, [post]);
  return <div className="telegram-post"><div ref={holder} /><a href={`https://t.me/${post}`} target="_blank" rel="noreferrer" className="telegram-post-link">Open post <ExternalLink size={14} /></a></div>;
}
export function TelegramWord() {
  const read = useServerFn(telegramPosts);
  const { data, isPending } = useQuery({ queryKey: ['telegram-posts'], queryFn: () => read(), staleTime: 60000, refetchInterval: 60000, retry: false });
  return <><section className="container-main telegram-section"><div className="telegram-heading"><div><span className="telegram-channel"><Send size={16} />@basileiaminintl</span><h1>The Word</h1></div><Button asChild variant="outline"><a href="https://t.me/basileiaminintl" target="_blank" rel="noreferrer">Open channel <ExternalLink /></a></Button></div>
    {isPending ? <p className="status">Opening messages…</p> : data?.posts.length ? <div className="telegram-feed">{data.posts.map(post => <TelegramPost key={post} post={post} />)}</div> : <p className="status">Messages are available on our Telegram channel.</p>}
  </section><ResourceList module="sermons" /></>;
}