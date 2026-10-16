import { createFileRoute, Link } from '@tanstack/react-router';
import { Headphones, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle, MemberNotice } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/the-word')({head:()=>pageMeta('The Word','Messages that build faith, renew the mind, and reveal the Kingdom.'),component:Page});
function Page(){return <main><PageTitle title="The Word" description="Messages that build faith, renew the mind, and reveal the Kingdom."/><section className="section"><div className="container-main"><div className="empty-state"><Headphones size={36}/><h2>Listen. Reflect. Grow.</h2><p>Recorded messages and sermons will appear here when they are uploaded.</p><Button asChild className="mt-5"><Link to="/bible">Read the Bible <ArrowRight/></Link></Button></div></div></section></main>;}
