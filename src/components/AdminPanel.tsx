import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Link } from '@tanstack/react-router';
import { Pencil, Trash2, Plus, Settings, Save, BookText } from 'lucide-react';
import { modules, isModule, allowed, defaultPreacher, type Row, type Module } from '@/lib/cms-model';
import { adminRows, saveContent, deleteContent, saveSettings, saveOrder } from '@/lib/cms.functions';
import { saveAdmin, removeAdmin } from '@/lib/auth.functions';
import { identityOptions, contentOptions } from '@/lib/content-query';
import { orderedRows } from '@/lib/visual-order';
import { StudioHomeEditor } from './StudioHomeEditor';
import { StudioSort, StudioSortableItem } from './StudioSort';
import { parseBibleText, type BibleData } from '@/lib/bible-text';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { MediaUpload, uploadMedia } from './MediaUpload';

const labels: Record<string, string> = {
  event_date: 'Program day', time: 'Time (e.g. 5:00 PM)', branch: 'Branch (optional)', text_url: 'Bible text file', pdf_url: 'Bible PDF (optional)',
  code: 'Short code (e.g. KJV)', name: 'Name', start_date: 'Start date', end_date: 'End date', is_pinned: 'Pinned', image_url: 'Image',
};
const hints: Record<string, string> = {
  event_date: 'Only days you add here are highlighted on the calendar. All other days show as free.',
  text_url: 'Upload a .json Bible, or a .txt file with one verse per line, like "Genesis 1:1 In the beginning…".',
};

function field(form: HTMLFormElement | null | undefined, name: string) { return form?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`) ?? null; }

function FieldInput({ module, name, row }: { module: Module; name: string; row: Row }) {
  const value = String(row[name] ?? (name === 'preacher' ? defaultPreacher : ''));
  if (name.startsWith('is_')) return <select name={name} defaultValue={String(row[name] ?? (name === 'is_pinned' || name === 'is_answered' ? 0 : 1))}><option value="1">Yes</option><option value="0">No</option></select>;
  if (/^(date|event_date|published_at)$/.test(name)) return <input type="date" required={name === 'event_date'} name={name} defaultValue={value.slice(0, 10)} />;
  if (name === 'scheduled_at') return <input type="datetime-local" name={name} defaultValue={value.slice(0, 16)} />;
  if (name === 'day_number' || name === 'sort_order') return <input type="number" name={name} defaultValue={value || '0'} />;
  const long = name === 'content' || name === 'description' || name === 'request';
  const required = name === 'title' || name === 'event_date' || name === 'request' || (module === 'library' && name === 'file_url') || (module === 'bibles' && (name === 'code' || name === 'name' || name === 'text_url'));
  return <textarea name={name} required={required} rows={long ? 5 : 1} defaultValue={value} />;
}

function uploadsFor(module: Module): { accept: string; label: string; target: (file: File) => string; prepare?: (file: File, form: HTMLFormElement | null) => Promise<File> }[] {
  switch (module) {
    case 'sermons': return [
      { accept: 'audio/*', label: 'Upload message audio', target: () => 'audio_url' },
      { accept: 'image/*', label: 'Upload cover image', target: () => 'cover_image_url' },
    ];
    case 'library': return [
      { accept: 'application/pdf', label: 'Upload PDF book', target: () => 'file_url' },
      { accept: 'image/*', label: 'Upload cover image', target: () => 'cover_image_url' },
    ];
    case 'bibles': return [
      {
        accept: '.json,.txt,application/json,text/plain', label: 'Upload Bible text', target: () => 'text_url',
        prepare: async (file, form) => {
          const code = (field(form, 'code')?.value ?? '').trim().toUpperCase();
          const name = (field(form, 'name')?.value ?? '').trim();
          if (!/^[A-Z0-9]{2,12}$/.test(code) || !name) throw new Error('Enter the short code and name first.');
          const bible = parseBibleText(await file.text(), code, name);
          return new File([JSON.stringify(bible)], `${code}.json`, { type: 'application/json' });
        },
      },
      { accept: 'application/pdf', label: 'Upload Bible PDF', target: () => 'pdf_url' },
    ];
    case 'events': return [{ accept: 'image/*', label: 'Upload event image', target: () => 'image_url' }];
    case 'devotions': return [{ accept: 'image/*', label: 'Upload cover image', target: () => 'cover_image_url' }];
    default: return [];
  }
}

export function AdminPanel({ settings = false }: { settings?: boolean }) {
  const { data: user, isPending } = useQuery(identityOptions);
  const { data: publicData } = useQuery(contentOptions);
  const [module, setModule] = useState(settings ? 'settings' : 'devotions');
  const [editing, setEditing] = useState<Row | null>(null);
  const [editingText, setEditingText] = useState<Row | null>(null);
  const [status, setStatus] = useState('');
  const qc = useQueryClient();
  const read = useServerFn(adminRows);
  const save = useServerFn(saveContent);
  const remove = useServerFn(deleteContent);
  const settingsSave = useServerFn(saveSettings);
  const adminSave = useServerFn(saveAdmin);
  const adminRemove = useServerFn(removeAdmin);
  const orderSave = useServerFn(saveOrder);
  const { data: rows = [], error } = useQuery({ queryKey: ['admin-rows', module], queryFn: () => read({ data: { module } }), enabled: user?.kind === 'admin' && allowed(user.role, user.permissions, module), retry: false });
  async function refresh() { await qc.invalidateQueries({ queryKey: ['admin-rows'] }); await qc.invalidateQueries({ queryKey: ['ministry-content'] }); }
  const displayRows = orderedRows(rows, publicData?.settings[`${module}_order`]);
  async function reorder(ids: string[]) {
    if (!window.confirm('Publish this content order?')) return;
    try { await orderSave({ data: { module, ids } }); await refresh(); setStatus('Order saved.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Order could not be saved.'); }
  }

  if (isPending) return <main className="container-main section">Loading…</main>;
  if (user?.kind !== 'admin') return <main className="container-main section"><h1>Administrator access</h1><Button asChild><Link to="/admin/login">Sign in as administrator</Link></Button></main>;

  const choices: [string, string][] = settings
    ? [['settings', 'Website & Hero'], ...(user.role === 'super_admin' ? [['admins', 'Admins Management'] as [string, string]] : [])]
    : [...Object.entries(modules).map(([key, v]) => [key, v.label] as [string, string]), ['bookmarks', 'Bookmarks']];
  const title = module === 'admins' ? 'Administrators' : module === 'bookmarks' ? 'Bookmarks' : isModule(module) ? modules[module].label : '';
  const canAdd = module !== 'bookmarks' && module !== 'prayer_requests';

  async function submitItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const data = new FormData(e.currentTarget);
    try {
      if (module === 'admins') {
        await adminSave({ data: { id: editing['id'] ? Number(editing['id']) : undefined, name: String(data.get('name')), email: String(data.get('email')), password: data.get('password') ? String(data.get('password')) : undefined, role: data.get('role') === 'super_admin' ? 'super_admin' : 'editor', permissions: data.getAll('permissions').map(String), active: data.get('active') === 'on' } });
      } else {
        const values = Object.fromEntries([...data.entries()].map(([key, value]) => [key, /^(is_|day_number|sort_order)/.test(key) ? Number(value) : key === 'code' ? String(value).trim().toUpperCase() : String(value)]));
        await save({ data: { module, id: editing['id'] ? Number(editing['id']) : undefined, values } });
      }
      setEditing(null); await refresh(); setStatus('Saved.');
    } catch (err) { setStatus(err instanceof Error ? err.message : 'Save failed.'); }
  }

  return (
    <main className="container-main section">
      <div className="admin-heading">
        <div><h1>{settings ? 'Settings' : 'Ministry Studio'}</h1><p className="status">{user.name} · {user.role === 'super_admin' ? 'Super administrator' : 'Editor'}</p></div>
        <Button asChild variant="outline"><Link to={settings ? '/admin' : '/admin/settings'}><Settings />{settings ? 'Studio' : 'Settings'}</Link></Button>
      </div>
      <div className="admin-tabs">
        {choices.filter(([key]) => allowed(user.role, user.permissions, key)).map(([key, label]) => <Button key={key} variant={module === key ? 'default' : 'outline'} onClick={() => { setModule(key); setEditing(null); setEditingText(null); setStatus(''); }}>{label}</Button>)}
      </div>
      {error && <p role="alert">{error.message}</p>}
      {status && <p role="status" className="status">{status}</p>}
      {module === 'settings' && publicData && <StudioHomeEditor initial={publicData.settings} onSaved={refresh} />}

      {module === 'settings' ? (
        <form key={rows.map(r => r['value']).join('|')} className="cms-form settings-form" onSubmit={async e => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.currentTarget).entries());
          try { await settingsSave({ data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) }); setStatus('Settings saved.'); await refresh(); }
          catch (err) { setStatus(err instanceof Error ? err.message : 'Save failed.'); }
        }}>
          <h2>Website settings</h2>
          {rows.filter(row => !/^(hero_|home_order|(?:devotion|plan|prayer|word)_(?:image_url|label|verse_text|verse_ref|cta))/.test(String(row['key'])) && !String(row['key']).endsWith('_order')).map(row => <label key={String(row['key'])}>{String(row['key']).replaceAll('_', ' ')}<textarea name={String(row['key'])} defaultValue={String(row['value'] ?? '')} rows={String(row['value'] ?? '').length > 120 || String(row['value'] ?? '').includes('\n') ? 4 : 1} /></label>)}
          <Button type="submit"><Save />Save settings</Button>
        </form>
      ) : (
        <>
          <div className="admin-heading"><h2>{title}</h2>{canAdd && <Button onClick={() => setEditing({})}><Plus />Add</Button>}</div>
          <StudioSort ids={displayRows.map(row => String(row['id']))} onOrder={ids => { if (isModule(module)) void reorder(ids); }}>
          <div className="admin-list studio-card-list">
            {displayRows.length ? displayRows.map((row, index) => (
              <StudioSortableItem key={String(row['id'])} id={String(row['id'])} first={index === 0 || !isModule(module)} last={index === displayRows.length - 1 || !isModule(module)} move={step => { const ids = displayRows.map(item => String(item['id'])); const id = ids[index]; const other = ids[index + step]; if (!id || !other || !isModule(module)) return; ids[index] = other; ids[index + step] = id; void reorder(ids); }}>
                {(row['cover_image_url'] || row['image_url']) && <img className="studio-card-cover" src={String(row['cover_image_url'] || row['image_url'])} alt="" loading="lazy" />}
                <div>
                  <strong>{row['title'] ?? row['name'] ?? row['type'] ?? row['id']}</strong>
                  <p className="status">{module === 'events' ? [row['event_date'], row['time'], row['location']].filter(Boolean).join(' · ') : module === 'prayer_requests' ? `${Number(row['is_published']) === 1 ? 'Published' : 'Waiting to be published'} — ${row['request']}` : row['email'] ?? row['code'] ?? row['description'] ?? row['request'] ?? row['highlighted_text']}</p>
                </div>
                {module !== 'bookmarks' && (
                  <div className="flex gap-2">
                    {module === 'prayer_requests' && Number(row['is_published']) !== 1 && <Button size="sm" onClick={async () => { try { await save({ data: { module, id: Number(row['id']), values: { is_published: 1 } } }); await refresh(); setStatus('Prayer request published.'); } catch (err) { setStatus(err instanceof Error ? err.message : 'Publish failed.'); } }}>Publish</Button>}
                    {module === 'bibles' && <Button variant="outline" size="icon" title="Edit verses" aria-label="Edit verses" onClick={() => setEditingText(row)}><BookText size={16} /></Button>}
                    <Button variant="outline" size="icon" title="Edit" aria-label="Edit item" onClick={() => setEditing(row)}><Pencil size={16} /></Button>
                    <Button variant="outline" size="icon" title="Delete" aria-label="Delete item" onClick={async () => {
                      if (!window.confirm(`Delete ${row['title'] ?? row['name'] ?? 'this item'}? This cannot be undone.`)) return;
                      try { if (module === 'admins') await adminRemove({ data: { id: Number(row['id']) } }); else await remove({ data: { module, id: Number(row['id']) } }); await refresh(); }
                      catch (err) { setStatus(err instanceof Error ? err.message : 'Delete failed.'); }
                    }}><Trash2 size={16} /></Button>
                  </div>
                )}
              </StudioSortableItem>
            )) : <p className="status">No records yet.</p>}
          </div>
          </StudioSort>
        </>
      )}

      {editing && <section className="studio-item-editor cms-dialog">
          <div className="admin-heading"><h2>{editing?.['id'] ? 'Edit' : 'Add'} {module === 'admins' ? 'administrator' : isModule(module) ? modules[module].label : 'item'}</h2><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
          {editing && (
            <form key={`${module}-${String(editing['id'] ?? 'new')}`} className="cms-form" onSubmit={submitItem}>
              {module === 'admins' ? (
                <>
                  <label>Name<input name="name" required defaultValue={String(editing['name'] ?? '')} /></label>
                  <label>Email<input name="email" type="email" required defaultValue={String(editing['email'] ?? '')} /></label>
                  <label>New password<input name="password" type="password" minLength={12} required={!editing['id']} autoComplete="new-password" /></label>
                  <label>Role<select name="role" defaultValue={String(editing['role'] ?? 'editor')}><option value="editor">Editor</option><option value="super_admin">Super administrator</option></select></label>
                  <label className="check-label"><input type="checkbox" name="active" defaultChecked={editing['active'] !== 0} />Active</label>
                  <fieldset><legend>Module permissions</legend>{[...Object.keys(modules), 'settings', 'bookmarks'].map(key => <label key={key} className="check-label"><input type="checkbox" name="permissions" value={key} defaultChecked={String(editing['permissions'] ?? '').includes(`"${key}"`)} />{key.replaceAll('_', ' ')}</label>)}</fieldset>
                </>
              ) : isModule(module) ? (
                <>
                  {modules[module].fields.map(name => (
                    <label key={name}>
                      {labels[name] ?? name.replaceAll('_', ' ')}
                      <FieldInput module={module} name={name} row={editing} />
                      {hints[name] && <span className="field-hint">{hints[name]}</span>}
                    </label>
                  ))}
                  <div className="upload-row">
                    {uploadsFor(module).map(u => (
                      <MediaUpload key={u.label} module={module} accept={u.accept} label={u.label}
                        prepare={u.prepare ? file => { const prepare = u.prepare; return prepare ? prepare(file, document.querySelector<HTMLFormElement>('.studio-item-editor form')) : Promise.resolve(file); } : undefined}
                        onUploaded={(url, file) => { const name = u.target(file); const input = field(document.querySelector<HTMLFormElement>('.cms-dialog form'), name); if (input) input.value = url; }} />
                    ))}
                  </div>
                </>
              ) : null}
              <Button type="submit"><Save />Save</Button>
            </form>
          )}
      </section>}

      {editingText && <BibleEditor row={editingText} onClose={() => setEditingText(null)} onSaved={async () => { setEditingText(null); await refresh(); setStatus('Bible text updated.'); }} />}
    </main>
  );
}

/** Lets an administrator correct the verses of an uploaded Bible, one chapter at a time. */
function BibleEditor({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => Promise<void> }) {
  const [bible, setBible] = useState<BibleData | null>(null);
  const [book, setBook] = useState(0);
  const [chapter, setChapter] = useState(0);
  const [status, setStatus] = useState('Opening the Bible text…');
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveContent);
  useEffect(() => {
    let live = true;
    fetch(String(row['text_url']), { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<BibleData>; })
      .then(b => { if (live) { setBible(b); setStatus(''); } })
      .catch(() => { if (live) setStatus('This Bible text could not be opened.'); });
    return () => { live = false; };
  }, [row]);
  const verses = bible?.books[book]?.chapters[chapter] ?? [];

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="cms-dialog">
        <DialogTitle>Edit verses — {String(row['name'])}</DialogTitle>
        <DialogDescription>Each line is one verse, starting with its number. Saving publishes the corrected text for everyone.</DialogDescription>
        {bible && (
          <div className="cms-form">
            <div className="upload-row">
              <label>Book<select value={book} onChange={e => { setBook(Number(e.target.value)); setChapter(0); }}>{bible.books.map((b, i) => <option key={b.name} value={i}>{b.name}</option>)}</select></label>
              <label>Chapter<select value={chapter} onChange={e => setChapter(Number(e.target.value))}>{(bible.books[book]?.chapters ?? []).map((_, i) => <option key={i} value={i}>{i + 1}</option>)}</select></label>
            </div>
            <form key={`${book}-${chapter}`} className="cms-form" onSubmit={async e => {
              e.preventDefault();
              const text = String(new FormData(e.currentTarget).get('verses') ?? '');
              const lines = text.split(/\r?\n/).filter(l => l.trim()).map(l => l.replace(/^\s*\d+\s/, '').trim());
              const updated: BibleData = { ...bible, books: bible.books.map((b, bi) => bi !== book ? b : { ...b, chapters: b.chapters.map((c, ci) => ci !== chapter ? c : lines) }) };
              setBusy(true); setStatus('Saving…');
              try {
                const url = await uploadMedia('bibles', new File([JSON.stringify(updated)], `${bible.code}.json`, { type: 'application/json' }));
                await save({ data: { module: 'bibles', id: Number(row['id']), values: { text_url: url } } });
                await onSaved();
              } catch (err) { setStatus(err instanceof Error ? err.message : 'Save failed.'); setBusy(false); }
            }}>
              <textarea name="verses" rows={14} defaultValue={verses.map((v, i) => `${i + 1} ${v}`).join('\n')} />
              <Button type="submit" disabled={busy}><Save />{busy ? 'Saving…' : 'Save chapter'}</Button>
            </form>
          </div>
        )}
        {status && <p role="status" className="status">{status}</p>}
      </DialogContent>
    </Dialog>
  );
}
