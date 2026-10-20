import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { modules, isModule, highlightColors, canSubmitPrayer } from './cms-model';

export const publicContent=createServerFn({method:'GET'}).handler(async()=>{
 const {query}=await import('./cloudflare.server');
 const settings=Object.fromEntries((await query('SELECT key,value FROM settings')).map(row=>[String(row['key']),String(row['value']??'')]));
 const [devotions,sermons,events,library,reading_plans,broadcasts,bibles,prayers]=await Promise.all([
  query('SELECT * FROM devotions WHERE is_published=1 ORDER BY date DESC LIMIT 100'),
  query('SELECT * FROM sermons WHERE is_published=1 ORDER BY date DESC LIMIT 100'),
  query('SELECT * FROM events ORDER BY is_pinned DESC,created_at DESC LIMIT 200'),
  query('SELECT * FROM library ORDER BY published_at DESC LIMIT 100'),
  query('SELECT * FROM reading_plans ORDER BY date DESC LIMIT 100'),
  query('SELECT * FROM broadcasts ORDER BY id DESC LIMIT 10'),
  query('SELECT id,code,name,text_url,pdf_url FROM bibles WHERE is_published=1 ORDER BY sort_order,id'),
  query('SELECT id,request,is_answered,is_published,created_at FROM prayer_requests WHERE is_published=1 ORDER BY created_at DESC LIMIT 60'),
 ]);
 return {settings,devotions,sermons,events,library,reading_plans,broadcasts,bibles,prayers};
});
export const currentIdentity=createServerFn({method:'GET'}).handler(async()=>{const {identity}=await import('./cloudflare.server');return identity();});
export const adminRows=createServerFn({method:'POST'}).inputValidator(z.object({module:z.string()})).handler(async({data})=>{
 const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin(data.module);
 if(data.module==='settings')return query('SELECT key,value FROM settings ORDER BY key');
 if(data.module==='bookmarks')return query('SELECT id,type,ref_id,color,highlighted_text,note,created_at FROM bookmarks ORDER BY created_at DESC LIMIT 100');
 if(data.module==='admins'){const user=await requireAdmin();if(user.role!=='super_admin')throw new Error('Super administrator access required.');return query('SELECT id,name,email,role,permissions,active FROM admins');}
 if(!isModule(data.module))throw new Error('Unknown module.');
 const order=data.module==='prayer_requests'?'is_published ASC,id DESC':data.module==='bibles'?'sort_order,id':'id DESC';
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
export const submitPrayer=createServerFn({method:'POST'}).inputValidator(z.object({text:z.string().trim().min(1).max(3000)})).handler(async({data})=>{
 const {query,identity}=await import('./cloudflare.server');const user=await identity();
 if(!canSubmitPrayer(user)||!user)throw new Error('Please sign in as a member to send a prayer request.');
 await query('INSERT INTO prayer_requests(name,request,user_id,is_private,is_published) VALUES (?,?,?,1,0)',[user.name,data.text,user.id]);return {ok:true};
});
const refId=z.string().min(3).max(200).regex(/^[A-Za-z0-9]+:[^:]{1,60}:\d+:\d+$/);
export const chapterHighlights=createServerFn({method:'POST'}).inputValidator(z.object({prefix:z.string().min(3).max(120)})).handler(async({data})=>{
 const {query,identity}=await import('./cloudflare.server');const user=await identity();if(!user||user.kind!=='user')return [];
 return query("SELECT ref_id,color,note FROM bookmarks WHERE user_id=? AND type='bible' AND substr(ref_id,1,?)=?",[user.id,data.prefix.length,data.prefix]);
});
export const saveHighlight=createServerFn({method:'POST'}).inputValidator(z.object({ref_id:refId,color:z.enum(highlightColors),highlighted_text:z.string().max(4000),note:z.string().max(3000)})).handler(async({data})=>{
 const {query,identity}=await import('./cloudflare.server');const user=await identity();if(!user||user.kind!=='user')throw new Error('Sign in to highlight verses.');
 await query("DELETE FROM bookmarks WHERE user_id=? AND type='bible' AND ref_id=?",[user.id,data.ref_id]);
 await query("INSERT INTO bookmarks(id,user_id,type,ref_id,color,highlighted_text,note) VALUES (?,?,'bible',?,?,?,?)",[crypto.randomUUID(),user.id,data.ref_id,data.color,data.highlighted_text,data.note]);return {ok:true};
});
export const removeHighlight=createServerFn({method:'POST'}).inputValidator(z.object({ref_id:refId})).handler(async({data})=>{
 const {query,identity}=await import('./cloudflare.server');const user=await identity();if(!user||user.kind!=='user')throw new Error('Sign in to manage highlights.');
 await query("DELETE FROM bookmarks WHERE user_id=? AND type='bible' AND ref_id=?",[user.id,data.ref_id]);return {ok:true};
});
