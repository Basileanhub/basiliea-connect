import { createFileRoute } from '@tanstack/react-router';
export const Route=createFileRoute('/api/public/google-callback')({server:{handlers:{GET:async({request})=>{
 const {getCookie,deleteCookie,updateSession}=await import('@tanstack/react-start/server');const {query,sessionConfig}=await import('@/lib/cloudflare.server');
 const url=new URL(request.url);const state=url.searchParams.get('state');const expected=getCookie('bmi-oauth-state');deleteCookie('bmi-oauth-state',{path:'/'});
 if(!state||!expected||state!==expected)return new Response('Invalid or expired sign-in. Please try again.',{status:400});
 const code=url.searchParams.get('code');const client=process.env['GOOGLE_CLIENT_ID'];const secret=process.env['GOOGLE_CLIENT_SECRET'];if(!code||!client||!secret)return new Response('Sign-in is unavailable.',{status:400});
 const tokens=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:client,client_secret:secret,code,grant_type:'authorization_code',redirect_uri:`${url.origin}/api/public/google-callback`})});if(!tokens.ok)return new Response('Google could not complete sign-in.',{status:400});
 const token=await tokens.json() as {access_token?:string};if(!token.access_token)return new Response('Google sign-in failed.',{status:400});
 const info=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${token.access_token}`}});if(!info.ok)return new Response('Google could not verify your account.',{status:400});
 const profile=await info.json() as {sub?:string;email?:string;email_verified?:boolean;name?:string};if(!profile.sub||!profile.email||profile.email_verified!==true)return new Response('A verified Google email is required.',{status:403});
 await query('INSERT INTO users(id,google_sub,email,name) VALUES (?,?,?,?) ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email,name=excluded.name',[crypto.randomUUID(),profile.sub,profile.email.toLowerCase(),profile.name??profile.email]);const rows=await query('SELECT id FROM users WHERE google_sub=?',[profile.sub]);const user=rows[0];if(!user)return new Response('Account could not be saved.',{status:500});
 await updateSession(sessionConfig(),{userId:String(user['id']),adminId:undefined});return new Response(null,{status:302,headers:{Location:'/bookmarks','Cache-Control':'no-store'}});
}}}});
