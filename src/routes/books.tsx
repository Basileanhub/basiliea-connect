import { createFileRoute, Link } from '@tanstack/react-router';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle, MemberNotice } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/books')({head:()=>pageMeta('Books','Resources for a deeper understanding of Scripture and a growing life of faith.'),component:Page});
function Page(){return <main><PageTitle title="Books" description="Resources for a deeper understanding of Scripture and a growing life of faith."/><section className="section"><div className="container-main"><div className="empty-state"><BookOpen size={36}/><h2>A library for your faith</h2><p>Books from the ministry will be shared here soon.</p><Button asChild className="mt-5"><Link to="/bible">Read the Bible <ArrowRight/></Link></Button></div></div></section></main>;}
