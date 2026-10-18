import { createFileRoute } from '@tanstack/react-router';
import { AdminPanel } from '@/components/AdminPanel';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/admin/')({head:()=>pageMeta('Ministry Studio','Manage Basileia Ministries International resources.'),component:()=> <AdminPanel/>});
