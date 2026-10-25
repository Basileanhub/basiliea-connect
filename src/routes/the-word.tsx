import { createFileRoute } from '@tanstack/react-router';
import { TelegramWord } from '@/components/TelegramWord';
import { contentOptions } from '@/lib/content-query';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/the-word')({head:()=>pageMeta('The Word — channel','The Word and ministry channel from Basileia Ministries International.'),loader:({context})=>context.queryClient.ensureQueryData(contentOptions),component:TelegramWord});
