import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
export const adminLogin=createServerFn({method:'POST'}).inputValidator(z.object({email:z.string().email(),password:z.string().min(1).max(128)})).handler(async({data})=>{
 const {query,sessionConfig}=await import('./cloudflare.server');const {compare,hash}=await import('bcryptjs');const {updateSession,setResponseHeader}=await import('@tanstack/react-start/server');setResponseHeader('Cache-Control','no-store');
 const rows=await query('SELECT id,name,email,password_hash,active FROM admins WHERE email=?',[data.email.trim().toLowerCase()]);const row=rows[0];
 let stored=typeof row?.['password_hash']==='string'?row['password_hash']:'';
 if(row&&!stored){const initial=row['email']==='olofinoflife@gmail.com'?process.env['BMI_INITIAL_ADMIN_PASSWORD']:row['email']==='basileiaministriesfinances@gmail.com'?process.env['BMI_FINANCE_ADMIN_PASSWORD']:undefined;if(initial){stored=await hash(initial,12);await query('UPDATE admins SET password_hash=?,password=\'\' WHERE id=? AND password_hash IS NULL',[stored,row['id']]);}}
 if(!stored)return {ok:false,error:'Administrator passwords have not been securely configured yet.'};
 if(!row||!row['active']||!await compare(data.password,stored))return {ok:false,error:'Email or password is incorrect.'};
 const {adminMember}=await import('./admin-member.server');const memberId=await adminMember(row);
 await updateSession(sessionConfig(),{adminId:Number(row['id']),userId:memberId});return {ok:true,error:''};
});
export const signOut=createServerFn({method:'POST'}).handler(async()=>{const {sessionConfig}=await import('./cloudflare.server');const {clearSession}=await import('@tanstack/react-start/server');await clearSession(sessionConfig());return {ok:true};});
type MemberResult={ok:boolean;needsCode:boolean;error:string};
const memberEmail=z.string().trim().toLowerCase().pipe(z.string().email().max(200));
export const memberSignUp=createServerFn({method:'POST'}).inputValidator(z.object({name:z.string().trim().min(1).max(80),email:memberEmail,password:z.string().min(8).max(128)})).handler(async({data}):Promise<MemberResult>=>{
 const {query}=await import('./cloudflare.server');const {issueCode}=await import('./member-email.server');const {hash}=await import('bcryptjs');
 const existing=(await query('SELECT id,email_verified FROM users WHERE email=?',[data.email]))[0];
 if(existing&&Number(existing['email_verified'])===1)return {ok:false,needsCode:false,error:'An account with this email already exists. Please sign in instead.'};
 const passwordHash=await hash(data.password,10);const id=existing?String(existing['id']):crypto.randomUUID();
 if(existing)await query('UPDATE users SET name=?,password_hash=? WHERE id=?',[data.name,passwordHash,id]);
 else await query('INSERT INTO users(id,google_sub,email,name,password_hash,email_verified) VALUES (?,?,?,?,?,0)',[id,`email:${data.email}`,data.email,data.name,passwordHash]);
 try{await issueCode(id,data.email,data.name);}catch(e){return {ok:false,needsCode:true,error:e instanceof Error?e.message:'We could not send your code.'};}
 return {ok:true,needsCode:true,error:''};
});
export const memberSignIn=createServerFn({method:'POST'}).inputValidator(z.object({email:memberEmail,password:z.string().min(1).max(128)})).handler(async({data}):Promise<MemberResult>=>{
 const {query,sessionConfig}=await import('./cloudflare.server');const {compare}=await import('bcryptjs');const {updateSession,setResponseHeader}=await import('@tanstack/react-start/server');setResponseHeader('Cache-Control','no-store');
 const admin=(await query('SELECT id,name,email,password_hash,active FROM admins WHERE email=?',[data.email]))[0];
 if(admin&&Number(admin['active'])===1){
  const hash=typeof admin['password_hash']==='string'?admin['password_hash']:'';
  if(!hash||!await compare(data.password,hash))return {ok:false,needsCode:false,error:'Email or password is incorrect.'};
  const {adminMember}=await import('./admin-member.server');const memberId=await adminMember(admin);
  await updateSession(sessionConfig(),{adminId:Number(admin['id']),userId:memberId});return {ok:true,needsCode:false,error:''};
 }
 const row=(await query('SELECT id,name,email,password_hash,email_verified FROM users WHERE email=?',[data.email]))[0];
 const stored=typeof row?.['password_hash']==='string'?row['password_hash']:'';
 if(!row||!stored||!await compare(data.password,stored))return {ok:false,needsCode:false,error:'Email or password is incorrect.'};
 if(Number(row['email_verified'])!==1){const {issueCode}=await import('./member-email.server');try{await issueCode(String(row['id']),data.email,String(row['name']));}catch(e){return {ok:false,needsCode:true,error:e instanceof Error?e.message:'We could not send your code.'};}return {ok:false,needsCode:true,error:''};}
 await updateSession(sessionConfig(),{userId:String(row['id']),adminId:undefined});return {ok:true,needsCode:false,error:''};
});
export const memberVerify=createServerFn({method:'POST'}).inputValidator(z.object({email:memberEmail,code:z.string().trim().regex(/^\d{6}$/)})).handler(async({data}):Promise<MemberResult>=>{
 const {query,sessionConfig}=await import('./cloudflare.server');const {codeHash,sameHash}=await import('./member-email.server');const {updateSession,setResponseHeader}=await import('@tanstack/react-start/server');setResponseHeader('Cache-Control','no-store');
 const row=(await query('SELECT id,verify_code_hash,verify_expires,verify_attempts FROM users WHERE email=?',[data.email]))[0];
 const stored=typeof row?.['verify_code_hash']==='string'?row['verify_code_hash']:'';
 if(!row||!stored)return {ok:false,needsCode:true,error:'Please request a new code.'};
 if(Number(row['verify_attempts'])>=5)return {ok:false,needsCode:true,error:'Too many tries. Please request a new code.'};
 if(Number(row['verify_expires'])<Date.now())return {ok:false,needsCode:true,error:'This code has expired. Please request a new code.'};
 if(!sameHash(await codeHash(data.email,data.code),stored)){await query('UPDATE users SET verify_attempts=verify_attempts+1 WHERE id=?',[row['id']]);return {ok:false,needsCode:true,error:'That code is not correct.'};}
 await query('UPDATE users SET email_verified=1,verify_code_hash=NULL,verify_expires=NULL,verify_attempts=0 WHERE id=?',[row['id']]);
 await updateSession(sessionConfig(),{userId:String(row['id']),adminId:undefined});return {ok:true,needsCode:false,error:''};
});
export const memberResendCode=createServerFn({method:'POST'}).inputValidator(z.object({email:memberEmail})).handler(async({data}):Promise<MemberResult>=>{
 const {query}=await import('./cloudflare.server');const {issueCode}=await import('./member-email.server');
 const row=(await query('SELECT id,name,email_verified FROM users WHERE email=?',[data.email]))[0];
 if(row&&Number(row['email_verified'])!==1){try{await issueCode(String(row['id']),data.email,String(row['name']));}catch(e){return {ok:false,needsCode:true,error:e instanceof Error?e.message:'We could not send your code.'};}}
 return {ok:true,needsCode:true,error:''};
});
export const saveAdmin=createServerFn({method:'POST'}).inputValidator(z.object({id:z.number().optional(),email:z.string().email(),name:z.string().min(1),password:z.string().min(12).max(128).optional(),role:z.enum(['super_admin','editor']),permissions:z.array(z.string()),active:z.boolean()})).handler(async({data})=>{
 const {query,requireAdmin}=await import('./cloudflare.server');const user=await requireAdmin();if(user.role!=='super_admin')throw new Error('Super administrator access required.');
 if(data.id===Number(user.id)&&(!data.active||data.role!=='super_admin'))throw new Error('You cannot remove your own super administrator access.');
 const {hash}=await import('bcryptjs');const passwordHash=data.password?await hash(data.password,12):undefined;
 if(data.id){await query('UPDATE admins SET name=?,email=?,role=?,permissions=?,active=? WHERE id=?',[data.name,data.email.toLowerCase(),data.role,JSON.stringify(data.permissions),data.active?1:0,data.id]);if(passwordHash)await query('UPDATE admins SET password_hash=?,password=\'\' WHERE id=?',[passwordHash,data.id]);}
 else{if(!passwordHash)throw new Error('Set a password for the new administrator.');await query('INSERT INTO admins(name,email,password,password_hash,role,permissions,active) VALUES (?,?,\'\',?,?,?,?)',[data.name,data.email.toLowerCase(),passwordHash,data.role,JSON.stringify(data.permissions),data.active?1:0]);}return {ok:true};
});
export const removeAdmin=createServerFn({method:'POST'}).inputValidator(z.object({id:z.number()})).handler(async({data})=>{const {query,requireAdmin}=await import('./cloudflare.server');const user=await requireAdmin();if(user.role!=='super_admin'||Number(user.id)===data.id)throw new Error('Cannot remove this administrator.');await query('DELETE FROM admins WHERE id=?',[data.id]);return {ok:true};});
