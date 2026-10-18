import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { contentOptions } from '@/lib/content-query';
import { SocialLinks } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/contact')({head:()=>pageMeta('Contact BMI','Connect with Basileia Ministries International.'),loader:({context})=>context.queryClient.ensureQueryData(contentOptions),component:Contact});
function Contact(){const {data}=useSuspenseQuery(contentOptions);return <main className="container-main section"><SocialLinks settings={data.settings}/></main>;}
