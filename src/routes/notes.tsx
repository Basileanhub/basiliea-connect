import { createFileRoute, Link } from '@tanstack/react-router';
import { NotebookPen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle, MemberNotice } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/notes')({head:()=>pageMeta('My notepad','A place to gather your thoughts, prayers, and reflections.'),component:Page});
function Page(){return <main><PageTitle title="My notepad" description="A place to gather your thoughts, prayers, and reflections."/><section className="section"><div className="container-main"><MemberNotice/></div></section></main>;}
