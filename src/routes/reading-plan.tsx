import { createFileRoute } from '@tanstack/react-router';
import { ResourceList } from '@/components/ResourceList';
import { contentOptions } from '@/lib/content-query';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/reading-plan')({head:()=>pageMeta('Monthly Bible reading plan','Monthly Bible reading plan from Basileia Ministries International.'),loader:({context})=>context.queryClient.ensureQueryData(contentOptions),component:()=> <ResourceList module="reading_plans"/>});
