import { getSession } from '@tanstack/react-start/server';
import type { Row } from './cms-model';
const account='90357f553484eaff4eb76be861ed8001';
const database='2267907d-aef3-46d3-bc8d-b755c9892bc7';
export function gateway() {
 const base=process.env['CONNECTOR_GATEWAY_BASE_URL']??'https://connector-gateway.lovable.dev';
 const key=process.env['CLOUDFLARE_API_KEY'];const lovable=process.env['LOVABLE_API_KEY'];
 if(!key||!lovable)throw new Error('Cloudflare connection is unavailable.');
 return {base:`${base.replace(/\/$/,'')}/cloudflare/client/v4/accounts/${account}`,headers:{Authorization:`Bearer ${lovable}`,'X-Connection-Api-Key':key}};
}
export async function query(sql:string, params:unknown[]=[]):Promise<Row[]> {
 const g=gateway();const response=await fetch(`${g.base}/d1/database/${database}/query`,{method:'POST',headers:{...g.headers,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});
 if(!response.ok){const details=await response.text();console.error('Cloudflare D1',response.status,details);throw new Error(`Cloudflare data request failed (${response.status}).`);}
 const result=await response.json() as {success:boolean;errors?:{message:string}[];result:{success:boolean;results:Row[]}[]};
 if(!result.success||result.result.some(r=>!r.success)) {console.error('Cloudflare D1 error',result.errors);throw new Error('Cloudflare could not save this request.');}
 return result.result[0]?.results??[];
}
export function sessionConfig(){const password=process.env['BMI_SESSION_SECRET'];if(!password)throw new Error('Secure sessions are not configured.');return {name:'bmi-session',password,maxAge:60*60*24*7,cookie:{httpOnly:true,sameSite:'lax' as const,secure:process.env['NODE_ENV']==='production',path:'/'}};}
export async function identity(){const session=await getSession<{adminId?:number;userId?:string}>(sessionConfig());
 if(session.data.adminId){const rows=await query('SELECT id,name,email,role,permissions FROM admins WHERE id=? AND active=1',[session.data.adminId]);const row=rows[0];if(row){let permissions:string[]=[];try{const p=JSON.parse(String(row['permissions']));if(Array.isArray(p))permissions=p.filter((v):v is string=>typeof v==='string');}catch{}return {kind:'admin' as const,id:String(row['id']),name:String(row['name']),email:String(row['email']),role:String(row['role']),permissions};}}
 if(session.data.userId){const rows=await query('SELECT id,name,email FROM users WHERE id=?',[session.data.userId]);const row=rows[0];if(row)return {kind:'user' as const,id:String(row['id']),name:String(row['name']),email:String(row['email']),role:'user',permissions:[] as string[]};}
 return null;
}
export async function requireAdmin(module?:string){const user=await identity();if(!user||user.kind!=='admin'||(module&&user.role!=='super_admin'&&!user.permissions.includes(module)))throw new Error('You do not have permission for this module.');return user;}
