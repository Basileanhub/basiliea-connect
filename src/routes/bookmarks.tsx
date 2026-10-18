import { createFileRoute } from '@tanstack/react-router';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Trash2 } from 'lucide-react';
import { myBookmarks,deleteBookmark } from '@/lib/cms.functions';
import { identityOptions } from '@/lib/content-query';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { Button } from '@/components/ui/button';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/bookmarks')({head:()=>pageMeta('My bookmarks','Your saved Scripture, library text and sermons.'),component:Bookmarks});
function Bookmarks(){const {data:user}=useQuery(identityOptions);const {data:rows=[]}=useQuery({queryKey:['bookmarks'],queryFn:()=>myBookmarks(),enabled:user?.kind==='user'});const remove=useServerFn(deleteBookmark);const qc=useQueryClient();return <main className="container-main section">{user?.kind==='user'?<div className="content-list">{rows.length?rows.map(row=><article className="content-item" key={String(row['id'])}><div><h2>{row['type']} · {row['ref_id']}</h2><blockquote>{row['highlighted_text']}</blockquote><p>{row['note']}</p><Button size="icon" variant="outline" aria-label="Remove bookmark" onClick={async()=>{if(!window.confirm('Remove this bookmark?'))return;await remove({data:{id:String(row['id'])}});await qc.invalidateQueries({queryKey:['bookmarks']});}}><Trash2/></Button></div></article>):<p>No saved bookmarks yet.</p>}</div>:<GoogleSignIn/>}</main>;}
