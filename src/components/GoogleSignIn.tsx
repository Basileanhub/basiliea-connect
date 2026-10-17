import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from './ui/button';
import { startGoogle } from '@/lib/auth.functions';
export function GoogleSignIn(){const start=useServerFn(startGoogle);const [error,setError]=useState('');const [busy,setBusy]=useState(false);return <div><Button variant="outline" disabled={busy} onClick={async()=>{setBusy(true);try{const result=await start();if(result.url)window.location.assign(result.url);else setError(result.error);}catch{setError('Sign-in is unavailable. Please try again.');}finally{setBusy(false);}}}><span aria-hidden="true" className="font-bold">G</span>{busy?'Connecting…':'Continue with Google'}</Button>{error&&<p role="status" className="status">{error}</p>}</div>;}
