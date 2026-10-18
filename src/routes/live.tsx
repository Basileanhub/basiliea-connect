import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { contentOptions } from '@/lib/content-query';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/live')({head:()=>pageMeta('Live broadcast','Join Basileia Ministries International live.'),loader:({context})=>context.queryClient.ensureQueryData(contentOptions),component:Live});
function Live(){const {data}=useSuspenseQuery(contentOptions);const raw=String(data.broadcasts[0]?.['embed_url']??data.settings['live_youtube']??'');let src='';try{const url=new URL(raw);if(['www.youtube.com','youtube.com','www.youtube-nocookie.com'].includes(url.hostname)){const id=url.searchParams.get('v')??url.pathname.split('/').pop();if(id&&/^[\w-]{11}$/.test(id))src=`https://www.youtube-nocookie.com/embed/${id}`;}}catch{}return <main className="container-main section">{src?<iframe className="live-player" src={src} title="BMI live broadcast" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>:<p className="status">No live broadcast is scheduled.</p>}</main>;}
