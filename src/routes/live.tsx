import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Radio, Video, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/live')({head:()=>pageMeta('Live broadcast','Join Basileia Ministries International live in worship, teaching and prayer.'),component:Live});
function Live(){const [mode,setMode]=useState('Video');return <main><PageTitle title="Gather with us. Live." description="Join our worship, teaching, and prayer — wherever you are." kicker="LIVE BROADCAST"/><section className="section"><div className="container-main"><div className="flex justify-center gap-2"><Button variant={mode==='Video'?'default':'outline'} onClick={()=>setMode('Video')}><Video/> Video</Button><Button variant={mode==='Audio'?'default':'outline'} onClick={()=>setMode('Audio')}><Headphones/> Audio</Button></div><div className="empty-state"><Radio size={36}/><h2>We're not broadcasting right now.</h2><p>The next {mode.toLowerCase()} broadcast will be available here when the ministry goes live.</p></div></div></section></main>;}
