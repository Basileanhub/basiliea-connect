import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle, MemberNotice } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/announcements')({head:()=>pageMeta('Announcements','Updates and news from Basileia Ministries International.'),component:Page});
function Page(){return <main><PageTitle title="Announcements" description="Updates and news from Basileia Ministries International."/><section className="section"><div className="container-main"><div className="empty-state"><Bell size={36}/><h2>Stay connected</h2><p>Ministry announcements will be published here soon.</p><Button asChild className="mt-5"><Link to="/bible">Read the Bible <ArrowRight/></Link></Button></div></div></section></main>;}
