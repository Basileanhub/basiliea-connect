import { createFileRoute, Link } from '@tanstack/react-router';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle, MemberNotice } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/devotion')({head:()=>pageMeta('Daily devotion','Set your heart on His Word. A quiet moment for faith, reflection, and renewal.'),component:Page});
function Page(){return <main><PageTitle title="Daily devotion" description="Set your heart on His Word. A quiet moment for faith, reflection, and renewal."/><section className="section"><div className="container-main"><div className="empty-state"><BookOpen size={36}/><h2>A moment in the Word</h2><p>Our daily devotion will be shared here soon. In the meantime, spend a moment in Scripture.</p><Button asChild className="mt-5"><Link to="/bible">Read the Bible <ArrowRight/></Link></Button></div></div></section></main>;}
