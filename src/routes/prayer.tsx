import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { submitPrayer } from '@/lib/cms.functions';
import { HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/MinistryShell';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/prayer')({head:()=>pageMeta('Anonymous prayer requests','Find joint prayer support with Basileia Ministries International.'),component:Prayer});
function Prayer(){const submit=useServerFn(submitPrayer);const [text,setText]=useState('');const [status,setStatus]=useState('');return <main><PageTitle title="Let us stand with you in prayer." description="You are not alone. Bring your prayer needs to a family that cares." kicker="ANONYMOUS PRAYER SUPPORT"/><section className="section"><div className="container-main"><form className="form-panel" onSubmit={async e=>{e.preventDefault();try{await submit({data:{text}});setText('');setStatus('Your prayer request has been received privately by the ministry.');}catch{setStatus('Your request could not be sent. Please try again.');}}}><HeartHandshake className="text-primary" size={32}/><label htmlFor="prayer">Your prayer request</label><textarea id="prayer" required rows={7} maxLength={3000} placeholder="What would you like us to pray about?" value={text} onChange={e=>setText(e.target.value)}/><p className="status">No name or email is required.</p><Button className="mt-5" type="submit">Request prayer <HeartHandshake/></Button>{status&&<p className="status" role="status">{status}</p>}</form></div></section></main>;}
