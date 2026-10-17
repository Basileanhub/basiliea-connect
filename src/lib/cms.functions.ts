import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { modules, isModule } from './cms-model';
export const publicContent=createServerFn({method:'GET'}).handler(async()=>{
 const {query}=await import('./cloudflare.server');
 const settings=Object.fromEntries((await query('SELECT key,value FROM settings')).map(row=>[String(row.key),String(row.value??'')]));
 const [devotions,sermons,events,library,reading_plans,downloads,broadcasts]=await Promise.all([
 query('SELECT * FROM devotions WHERE is_published=1 ORDER BY date DESC LIMIT 100'),query('SELECT * FROM sermons WHERE is_published=1 ORDER BY date DESC LIMIT 100'),query('SELECT * FROM events ORDER BY is_pinned DESC,created_at DESC LIMIT 100'),query('SELECT * FROM library ORDER BY published_at DESC LIMIT 100'),query('SELECT * FROM reading_plans ORDER BY date DESC LIMIT 100'),query('SELECT * FROM downloads ORDER BY id DESC LIMIT 100'),query('SELECT * FROM broadcasts ORDER BY id DESC LIMIT 10')]);
 return {settings,devotions,sermons,events,library,reading_plans,downloads,broadcasts};
});
export const currentIdentity=createServerFn({method:'GET'}).handler(async()=>{const {identity}=await import('./cloudflare.server');return identity();});
export const adminRows=createServerFn({method:'POST'}).inputValidator(z.object({module:z.string()})).handler(async({data})=>{
 const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin(data.module);
 if(data.module==='settings')return query('SELECT key,value FROM settings ORDER BY key');
 if(data.module==='bookmarks')return query('SELECT id,type,ref_id,highlighted_text,note,created_at FROM bookmarks ORDER BY created_at DESC LIMIT 100');
 if(data.module==='admins'){const user=await requireAdmin();if(user.role!=='super_admin')throw new Error('Super administrator access required.');return query('SELECT id,name,email,role,permissions,active FROM admins');}
 if(!isModule(data.module))throw new Error('Unknown module.');return query(`SELECT * FROM ${data.module} ORDER BY id DESC LIMIT 100`);
});
export const saveContent=createServerFn({method:'POST'}).inputValidator(z.object({module:z.string(),id:z.number().optional(),values:z.record(z.union([z.string().max(100000),z.number(),z.null()]))})).handler(async({data})=>{
 const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin(data.module);if(!isModule(data.module))throw new Error('Unknown module.');
 const fields=modules[data.module].fields.filter(f=>Object.hasOwn(data.values,f));if(!fields.length)throw new Error('Enter content to save.');
 const values=fields.map(f=>data.values[f]);
 if(data.id)await query(`UPDATE ${data.module} SET ${fields.map(f=>`${f}=?`).join(',')} WHERE id=?`,[...values,data.id]);
 else await query(`INSERT INTO ${data.module} (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,values);
 return {ok:true};
});
export const deleteContent=createServerFn({method:'POST'}).inputValidator(z.object({module:z.string(),id:z.number()})).handler(async({data})=>{const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin(data.module);if(!isModule(data.module))throw new Error('Unknown module.');await query(`DELETE FROM ${data.module} WHERE id=?`,[data.id]);return {ok:true};});
export const saveSettings=createServerFn({method:'POST'}).inputValidator(z.record(z.string().max(100000))).handler(async({data})=>{const {query,requireAdmin}=await import('./cloudflare.server');await requireAdmin('settings');for(const [key,value] of Object.entries(data)){if(!/^[a-z_]+$/.test(key))throw new Error('Invalid setting.');if(/(?:url|video|instagram|facebook|youtube|telegram|^x$)/.test(key)&&value&&!value.startsWith('/api/media/')&&!/^https:\/\//.test(value))throw new Error('Use an HTTPS link.');await query('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[key,value]);}return {ok:true};});
export const submitPrayer=createServerFn({method:'POST'}).inputValidator(z.object({text:z.string().trim().min(1).max(3000)})).handler(async({data})=>{const {query}=await import('./cloudflare.server');await query('INSERT INTO prayer_requests(request,is_private) VALUES (?,1)',[data.text]);return {ok:true};});
export const myBookmarks=createServerFn({method:'GET'}).handler(async()=>{const {query,identity}=await import('./cloudflare.server');const user=await identity();if(!user||user.kind!=='user')return [];return query('SELECT * FROM bookmarks WHERE user_id=? ORDER BY created_at DESC',[user.id]);});
export const saveBookmark=createServerFn({method:'POST'}).inputValidator(z.object({type:z.enum(['sermon','library','bible']),ref_id:z.string().min(1).max(200),highlighted_text:z.string().max(10000),note:z.string().max(3000)})).handler(async({data})=>{const {query,identity}=await import('./cloudflare.server');const user=await identity();if(!user||user.kind!=='user')throw new Error('Continue with Google to save bookmarks.');await query('INSERT INTO bookmarks(id,user_id,type,ref_id,highlighted_text,note) VALUES (?,?,?,?,?,?)',[crypto.randomUUID(),user.id,data.type,data.ref_id,data.highlighted_text,data.note]);return {ok:true};});
export const deleteBookmark=createServerFn({method:'POST'}).inputValidator(z.object({id:z.string()})).handler(async({data})=>{const {query,identity}=await import('./cloudflare.server');const user=await identity();if(!user||user.kind!=='user')throw new Error('Sign in to manage bookmarks.');await query('DELETE FROM bookmarks WHERE id=? AND user_id=?',[data.id,user.id]);return {ok:true};});
