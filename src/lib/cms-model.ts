export const modules = {
 devotions: { label:'Daily Devotion', fields:['title','scripture','content','cover_image_url','date','is_published'] },
 reading_plans: { label:'Reading Plan', fields:['title','day_number','book','chapters','content','date'] },
 sermons: { label:'The Word', fields:['title','preacher','description','audio_url','cover_image_url','duration','category','date','is_published'] },
 library: { label:'Library', fields:['title','author','description','file_url','cover_image_url','published_at'] },
 events: { label:'Events', fields:['title','description','location','image_url','start_date','end_date','registration_link','is_pinned'] },
 downloads: { label:'Downloads', fields:['title','file_url','file_type','category'] },
 broadcasts: { label:'Live Broadcast', fields:['title','embed_url','is_live','scheduled_at'] },
 prayer_requests: { label:'Prayer Wall', fields:['name','request','is_private','is_answered'] },
} as const;
export type Module = keyof typeof modules;
export type Row = Record<string,string|number|null>;
export function isModule(value:string):value is Module { return Object.hasOwn(modules,value); }
export function allowed(role:string, permissions:string[], module:string) {return role==='super_admin'||permissions.includes(module);}
export function canManageAdmins(role:string) {return role==='super_admin';}
export const defaultPreacher='Apostle Gabriel Idogbe';
