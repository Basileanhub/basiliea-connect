import { createFileRoute } from '@tanstack/react-router';
import { AdminPanel } from '@/components/AdminPanel';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/admin/settings')({head:()=>pageMeta('Studio settings','Manage ministry identity, media and administrators.'),component:()=> <AdminPanel settings/>});
