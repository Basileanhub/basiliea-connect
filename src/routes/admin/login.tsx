import { createFileRoute,useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminLogin } from '@/lib/auth.functions';
import { Button } from '@/components/ui/button';
import { pageMeta } from '@/lib/page-meta';
import { signInDestination } from '@/lib/visual-order';
export const Route=createFileRoute('/admin/login')({head:()=>pageMeta('Administrator sign-in','Secure administrator access for Basileia Ministries International.'),component:Login});
function Login(){const login=useServerFn(adminLogin);const navigate=useNavigate();const qc=useQueryClient();const [error,setError]=useState('');const [busy,setBusy]=useState(false);return <main className="container-main section"><form className="cms-form auth-form" onSubmit={async e=>{e.preventDefault();setBusy(true);const form=new FormData(e.currentTarget);try{const result=await login({data:{email:String(form.get('email')),password:String(form.get('password'))}});if(result.ok){await qc.invalidateQueries({queryKey:['identity']});await navigate({to:signInDestination});}else setError(result.error);}catch{setError('Sign-in could not be completed. Please try again.');}finally{setBusy(false);}}}><h1>Administrator sign-in</h1><label>Email<input name="email" type="email" required autoComplete="username"/></label><label>Password<input name="password" type="password" required autoComplete="current-password"/></label><Button type="submit" disabled={busy}>{busy?'Signing in…':'Sign in'}</Button>{error&&<p role="alert">{error}</p>}</form></main>;}
