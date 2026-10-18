import { createFileRoute } from '@tanstack/react-router';
import { ResourceList } from '@/components/ResourceList';
import { contentOptions } from '@/lib/content-query';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/events')({head:()=>pageMeta('Events','Events from Basileia Ministries International.'),loader:({context})=>context.queryClient.ensureQueryData(contentOptions),component:()=> <ResourceList module="events"/>});
