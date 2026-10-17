import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Bookmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { identityOptions } from '@/lib/content-query';
import { saveBookmark } from '@/lib/cms.functions';
import { Button } from './ui/button';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from './ui/dialog';
import { GoogleSignIn } from './GoogleSignIn';
export function BookmarkAction({type,refId}:{type:'sermon'|'library'|'bible';refId:string}){const [open,setOpen]=useState(false);const [text,setText]=useState('');const [note,setNote]=useState('');const [status,setStatus]=useState('');const {data:user}=useQuery(identityOptions);const save=useServerFn(saveBookmark);return <><Button variant="outline" size="icon" aria-label="Save bookmark" title="Save bookmark" onClick={()=>{setText(window.getSelection()?.toString()??'');setStatus('');setOpen(true);}}><Bookmark size={18}/></Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>Save bookmark</DialogTitle><DialogDescription>{refId}</DialogDescription>{user?.kind==='user'?<form className="cms-form" onSubmit={async e=>{e.preventDefault();try{await save({data:{type,ref_id:refId,highlighted_text:text,note}});setStatus('Bookmark saved.');}catch(e){setStatus(e instanceof Error?e.message:'Could not save bookmark.');}}}><label>Selected verse or line<textarea value={text} onChange={e=>setText(e.target.value)} rows={4}/></label><label>Note<textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}/></label><Button type="submit">Save bookmark</Button>{status&&<p role="status">{status}</p>}</form>:<GoogleSignIn/>}</DialogContent></Dialog></>;}
