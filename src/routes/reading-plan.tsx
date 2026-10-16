import { createFileRoute, Link } from '@tanstack/react-router';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle, MemberNotice } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/reading-plan')({head:()=>pageMeta('Monthly Bible reading plan','Build a daily rhythm of Scripture with the BMI family.'),component:Page});
function Page(){return <main><PageTitle title="Monthly Bible reading plan" description="Build a daily rhythm of Scripture with the BMI family."/><section className="section"><div className="container-main"><div className="empty-state"><CalendarDays size={36}/><h2>A journey through Scripture</h2><p>The ministry’s monthly reading plan will be published here soon.</p><Button asChild className="mt-5"><Link to="/bible">Read the Bible <ArrowRight/></Link></Button></div></div></section></main>;}
