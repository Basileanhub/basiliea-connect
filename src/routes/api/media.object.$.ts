import { createFileRoute } from '@tanstack/react-router';
export const Route=createFileRoute('/api/media/object/$')({server:{handlers:{GET:async({params,request})=>{
 const {gateway}=await import('@/lib/cloudflare.server');const key=params._splat??'';if(!/^(hero|pdfs|audios|images|bibles)\/[a-zA-Z0-9._-]+$/.test(key))return new Response('Not found',{status:404});
 const g=gateway();const range=request.headers.get('Range');const response=await fetch(`${g.base}/r2/buckets/basileia-media/objects/${key}`,{headers:{...g.headers,...(range?{Range:range}:{})}});
 if(!response.ok)return new Response('Media unavailable',{status:response.status});const headers=new Headers();for(const name of ['Content-Type','Content-Length','Content-Range','Accept-Ranges']){const value=response.headers.get(name);if(value)headers.set(name,value);}headers.set('Cache-Control','public,max-age=3600');headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,headers});
}}}});
