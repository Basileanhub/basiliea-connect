import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
export const adminLogin=createServerFn({method:'POST'}).inputValidator(z.object({email:z.string().email(),password:z.string().min(1).max(128)})).handler(async({data})=>{
 const {query,sessionConfig}=await import('./cloudflare.server');const {compare,hash}=await import('bcryptjs');const {updateSession,setResponseHeader}=await import('@tanstack/react-start/server');setResponseHeader('Cache-Control','no-store');
 const rows=await query('SELECT id,email,password_hash,active FROM admins WHERE email=?',[data.email.trim().toLowerCase()]);const row=rows[0];
 let stored=typeof row?.['password_hash']==='string'?row['password_hash']:'';
 if(row&&!stored){const initial=row['email']==='olofinoflife@gmail.com'?process.env['BMI_INITIAL_ADMIN_PASSWORD']:row['email']==='basileiaministriesfinances@gmail.com'?process.env['BMI_FINANCE_ADMIN_PASSWORD']:undefined;if(initial){stored=await hash(initial,12);await query('UPDATE admins SET password_hash=?,password=\'\' WHERE id=? AND password_hash IS NULL',[stored,row['id']]);}}
 if(!stored)return {ok:false,error:'Administrator passwords have not been securely configured yet.'};
 if(!row||!row['active']||!await compare(data.password,stored))return {ok:false,error:'Email or password is incorrect.'};
 await updateSession(sessionConfig(),{adminId:Number(row['id']),userId:undefined});return {ok:true,error:''};
});
export const signOut=createServerFn({method:'POST'}).handler(async()=>{const {sessionConfig}=await import('./cloudflare.server');const {clearSession}=await import('@tanstack/react-start/server');await clearSession(sessionConfig());return {ok:true};});
export const startGoogle=createServerFn({method:'POST'}).handler(async()=>{
 const {setCookie,getRequestUrl}=await import('@tanstack/react-start/server');const client=process.env['GOOGLE_CLIENT_ID'];if(!client||!process.env['GOOGLE_CLIENT_SECRET'])return {url:'',error:'Google sign-in is awaiting ministry setup.'};
 const state=crypto.randomUUID();setCookie('bmi-oauth-state',state,{httpOnly:true,sameSite:'lax',secure:process.env['NODE_ENV']==='production',maxAge:600,path:'/'});
 const origin=new URL(getRequestUrl()).origin;const params=new URLSearchParams({client_id:client,redirect_uri:`${origin}/api/public/google-callback`,response_type:'code',scope:'openid email profile',state,prompt:'select_account'});
 return {url:`https://accounts.google.com/o/oauth2/v2/auth?${params}`,error:''};
});
export const saveAdmin=createServerFn({method:'POST'}).inputValidator(z.object({id:z.number().optional(),email:z.string().email(),name:z.string().min(1),password:z.string().min(12).max(128).optional(),role:z.enum(['super_admin','editor']),permissions:z.array(z.string()),active:z.boolean()})).handler(async({data})=>{
 const {query,requireAdmin}=await import('./cloudflare.server');const user=await requireAdmin();if(user.role!=='super_admin')throw new Error('Super administrator access required.');
 if(data.id===Number(user.id)&&(!data.active||data.role!=='super_admin'))throw new Error('You cannot remove your own super administrator access.');
 const {hash}=await import('bcryptjs');const passwordHash=data.password?await hash(data.password,12):undefined;
 if(data.id){await query('UPDATE admins SET name=?,email=?,role=?,permissions=?,active=? WHERE id=?',[data.name,data.email.toLowerCase(),data.role,JSON.stringify(data.permissions),data.active?1:0,data.id]);if(passwordHash)await query('UPDATE admins SET password_hash=?,password=\'\' WHERE id=?',[passwordHash,data.id]);}
 else{if(!passwordHash)throw new Error('Set a password for the new administrator.');await query('INSERT INTO admins(name,email,password,password_hash,role,permissions,active) VALUES (?,?,\'\',?,?,?,?)',[data.name,data.email.toLowerCase(),passwordHash,data.role,JSON.stringify(data.permissions),data.active?1:0]);}return {ok:true};
});
export const removeAdmin=createServerFn({method:'POST'}).inputValidator(z.object({id:z.number()})).handler(async({data})=>{const {query,requireAdmin}=await import('./cloudflare.server');const user=await requireAdmin();if(user.role!=='super_admin'||Number(user.id)===data.id)throw new Error('Cannot remove this administrator.');await query('DELETE FROM admins WHERE id=?',[data.id]);return {ok:true};});
