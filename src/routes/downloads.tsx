import { createFileRoute, Link } from '@tanstack/react-router';
import { Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle, MemberNotice } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/downloads')({head:()=>pageMeta('My downloads','Your saved messages and Scripture, wherever you are.'),component:Page});
function Page(){return <main><PageTitle title="My downloads" description="Your saved messages and Scripture, wherever you are."/><section className="section"><div className="container-main"><MemberNotice/></div></section></main>;}
