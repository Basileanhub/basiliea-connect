import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { modules, isModule, highlightColors, canSubmitPrayer } from './cms-model';

export const publicContent=createServerFn({method:'GET'}).handler(async()=>{
 const {query}=await import('./cloudflare.server');
 const settings=Object.fromEntries((await query('SELECT key,value FROM settings')).map(row=>[String(row['key']),String(row['value']??'')]));
 const [devotions,sermons,events,library,reading_plans,broadcasts,bibles,prayers]=await Promise.all([
  query('SELECT * FROM devotions WHERE is_published=1 ORDER BY date DESC LIMIT 100'),
  query('SELECT * FROM sermons WHERE is_published=1 ORDER BY date DESC LIMIT 100'),
  query("SELECT * FROM events WHERE event_date>=date('now','-62 days') ORDER BY event_date,time LIMIT 400"),
  query('SELECT * FROM library ORDER BY published_at DESC LIMIT 100'),
  query('SELECT * FROM reading_plans ORDER BY date DESC LIMIT 100'),
  query('SELECT * FROM broadcasts ORDER BY id DESC LIMIT 10'),
  query('SELECT id,code,name,text_url,pdf_url FROM bibles WHERE is_published=1 ORDER BY sort_order,id'),
  query('SELECT id,request,is_answered,is_published,created_at FROM prayer_requests WHERE is_published=1 ORDER BY created_at DESC LIMIT 60'),
 ]);
 const brand=<T,>(v:T):T=>JSON.parse(JSON.stringify(v).replace(/\bBMI\b/g,"BMi"));
 return brand({settings,devotions,sermons,events,library,reading_plans,broadcasts,bibles,prayers});
});
export const currentIdentity=createServerFn({method:'GET'}).handler(async()=>{const {identity}=await import('./cloudflare.server');return identity();});
export const adminRows=createServerFn({method:'POST'}).inputValidator(z.object({module:z.string()})).handler(async({data})=>{
 const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin(data.module);
 if(data.module==='settings')return query('SELECT key,value FROM settings ORDER BY key');
 if(data.module==='bookmarks')return query('SELECT id,type,ref_id,color,highlighted_text,note,created_at FROM bookmarks ORDER BY created_at DESC LIMIT 100');
 if(data.module==='admins'){const user=await requireAdmin();if(user.role!=='super_admin')throw new Error('Super administrator access required.');return query('SELECT id,name,email,role,permissions,active FROM admins');}
 if(!isModule(data.module))throw new Error('Unknown module.');
 const order=data.module==='prayer_requests'?'is_published ASC,id DESC':data.module==='bibles'?'sort_order,id':data.module==='events'?'event_date DESC':'id DESC';
 return query(`SELECT * FROM ${data.module} ORDER BY ${order} LIMIT 200`);
});
export const saveContent=createServerFn({method:'POST'}).inputValidator(z.object({module:z.string(),id:z.number().optional(),values:z.record(z.union([z.string().max(100000),z.number(),z.null()]))})).handler(async({data})=>{
 const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin(data.module);if(!isModule(data.module))throw new Error('Unknown module.');
 const fields=(modules[data.module].fields as readonly string[]).filter(f=>Object.hasOwn(data.values,f));if(!fields.length)throw new Error('Enter content to save.');
 const values=fields.map(f=>{const v=data.values[f];return v===''&&/(date|_at)$/.test(f)?null:v;});
 if(data.id)await query(`UPDATE ${data.module} SET ${fields.map(f=>`${f}=?`).join(',')} WHERE id=?`,[...values,data.id]);
 else await query(`INSERT INTO ${data.module} (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,values);
 return {ok:true};
});
export const deleteContent=createServerFn({method:'POST'}).inputValidator(z.object({module:z.string(),id:z.number()})).handler(async({data})=>{const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin(data.module);if(!isModule(data.module))throw new Error('Unknown module.');await query(`DELETE FROM ${data.module} WHERE id=?`,[data.id]);return {ok:true};});
export const saveSettings=createServerFn({method:'POST'}).inputValidator(z.record(z.string().max(100000))).handler(async({data})=>{const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin('settings');for(const [key,value] of Object.entries(data)){if(!/^[a-z_]+$/.test(key))throw new Error('Invalid setting.');if(/(?:url|video|instagram|facebook|youtube|telegram|^x$)/.test(key)&&value&&!value.startsWith('/api/media/')&&!value.startsWith('/__l5e/')&&!/^https:\/\//.test(value))throw new Error('Use an HTTPS link.');await query('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[key,value]);}return {ok:true};});
export const saveOrder=createServerFn({method:'POST'}).inputValidator(z.object({module:z.string(),ids:z.array(z.string().max(80)).max(200)})).handler(async({data})=>{
 const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin(data.module);
 if(!isModule(data.module))throw new Error('Unknown module.');
 const rows=await query(`SELECT id FROM ${data.module}`);const allowedIds=new Set(rows.map(row=>String(row['id'])));
 if(new Set(data.ids).size!==data.ids.length||data.ids.some(id=>!allowedIds.has(id)))throw new Error('Invalid content order.');
 await query('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[`${data.module}_order`,JSON.stringify(data.ids)]);return {ok:true};
});
export const submitPrayer=createServerFn({method:'POST'}).inputValidator(z.object({text:z.string().trim().min(1).max(3000)})).handler(async({data})=>{
 const {query,identity}=await import('./cloudflare.server');const user=await identity();
 if(!canSubmitPrayer(user)||!user)throw new Error('Please sign in as a member to send a prayer request.');
 const memberId=user.kind==='admin'?String((await query('SELECT id FROM users WHERE email=?',[user.email]))[0]?.['id']??''):user.id;
 if(!memberId)throw new Error('Please sign in again.');
 await query('INSERT INTO prayer_requests(name,request,user_id,is_private,is_published) VALUES (?,?,?,1,0)',[user.name,data.text,memberId]);return {ok:true};
});
const refId=z.string().min(3).max(200).regex(/^[A-Za-z0-9]+:[^:]{1,60}:\d+:\d+$/);
export const chapterHighlights=createServerFn({method:'POST'}).inputValidator(z.object({prefix:z.string().min(3).max(120)})).handler(async({data})=>{
 const {query,identity}=await import('./cloudflare.server');const user=await identity();if(!user)return [];
 const memberId=user.kind==='admin'?String((await query('SELECT id FROM users WHERE email=?',[user.email]))[0]?.['id']??''):user.id;
 return query("SELECT ref_id,color,note FROM bookmarks WHERE user_id=? AND type='bible' AND substr(ref_id,1,?)=?",[memberId,data.prefix.length,data.prefix]);
});
export const saveHighlight=createServerFn({method:'POST'}).inputValidator(z.object({ref_id:refId,color:z.enum(highlightColors),highlighted_text:z.string().max(4000),note:z.string().max(3000)})).handler(async({data})=>{
 const {query,identity}=await import('./cloudflare.server');const user=await identity();if(!user)throw new Error('Sign in to highlight verses.');
 const memberId=user.kind==='admin'?String((await query('SELECT id FROM users WHERE email=?',[user.email]))[0]?.['id']??''):user.id;
 if(!memberId)throw new Error('Please sign in again.');
 await query("DELETE FROM bookmarks WHERE user_id=? AND type='bible' AND ref_id=?",[memberId,data.ref_id]);
 await query("INSERT INTO bookmarks(id,user_id,type,ref_id,color,highlighted_text,note) VALUES (?,?,'bible',?,?,?,?)",[crypto.randomUUID(),memberId,data.ref_id,data.color,data.highlighted_text,data.note]);return {ok:true};
});
export const removeHighlight=createServerFn({method:'POST'}).inputValidator(z.object({ref_id:refId})).handler(async({data})=>{
 const {query,identity}=await import('./cloudflare.server');const user=await identity();if(!user)throw new Error('Sign in to manage highlights.');
 const memberId=user.kind==='admin'?String((await query('SELECT id FROM users WHERE email=?',[user.email]))[0]?.['id']??''):user.id;
 await query("DELETE FROM bookmarks WHERE user_id=? AND type='bible' AND ref_id=?",[memberId,data.ref_id]);return {ok:true};
});
