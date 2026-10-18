import { createFileRoute } from '@tanstack/react-router';
import { ResourceList } from '@/components/ResourceList';
import { contentOptions } from '@/lib/content-query';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/library')({head:()=>pageMeta('Library','Library from Basileia Ministries International.'),loader:({context})=>context.queryClient.ensureQueryData(contentOptions),component:()=> <ResourceList module="library"/>});
