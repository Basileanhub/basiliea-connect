import { createFileRoute } from '@tanstack/react-router';
export const Route=createFileRoute('/api/media/upload')({server:{handlers:{POST:async({request})=>{
 const {requireAdmin,gateway}=await import('@/lib/cloudflare.server');
 try{const form=await request.formData();const module=String(form.get('module')??'');await requireAdmin(module);const file=form.get('file');if(!(file instanceof File))return Response.json({error:'Choose a file.'},{status:400});
 const folder=module==='settings'?'hero':module==='library'?'pdfs':module==='sermons'?'audios':'images';const allowed=folder==='hero'?['video/mp4','video/webm']:folder==='pdfs'?['application/pdf']:folder==='audios'?['audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg']:['image/jpeg','image/png','image/webp'];
 if(!allowed.includes(file.type))return Response.json({error:'This file type is not supported for this module.'},{status:400});
 const name=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const key=`${folder}/${crypto.randomUUID()}-${name}`;const g=gateway();const response=await fetch(`${g.base}/r2/buckets/basileia-media/objects/${key}`,{method:'PUT',headers:{...g.headers,'Content-Type':file.type},body:file});if(!response.ok){console.error('R2 upload',response.status,await response.text());return Response.json({error:`Cloudflare upload failed (${response.status}). Check R2 Edit permission.`},{status:response.status});}
 return Response.json({url:`/api/media/object/${key}`});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Upload failed.'},{status:403});}
}}}});
