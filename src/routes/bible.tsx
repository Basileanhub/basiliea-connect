import { createFileRoute } from '@tanstack/react-router';
import { PageTitle } from '@/components/MinistryShell';
import { BibleReader } from '@/components/BibleReader';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/bible')({head:()=>pageMeta('The Holy Bible','Read the King James Version and New International Version of the Bible with Basileia Ministries International.'),component:Bible});
function Bible(){return <main><PageTitle title="The Holy Bible" description="The living Word. Read Scripture in the King James Version or New International Version."/><section className="section"><div className="container-main"><BibleReader/></div></section></main>;}
