import { createFileRoute } from '@tanstack/react-router';

const folders: Record<string, string[]> = {
  hero: ['video/mp4', 'video/webm'],
  pdfs: ['application/pdf'],
  audios: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'],
  images: ['image/jpeg', 'image/png', 'image/webp'],
  bibles: ['application/json'],
};

export const Route = createFileRoute('/api/media/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { requireAdmin, gateway } = await import('@/lib/cloudflare.server');
        try {
          const form = await request.formData();
          const module = String(form.get('module') ?? '');
          await requireAdmin(module);
          const file = form.get('file');
          if (!(file instanceof File)) return Response.json({ error: 'Choose a file.' }, { status: 400 });
          const type = file.type || (file.name.endsWith('.json') ? 'application/json' : '');
          const folder = Object.entries(folders).find(([, types]) => types.includes(type))?.[0];
          if (!folder) return Response.json({ error: 'This file type is not supported.' }, { status: 400 });
          const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const key = `${folder}/${crypto.randomUUID()}-${name}`;
          const g = gateway();
          const response = await fetch(`${g.base}/r2/buckets/basileia-media/objects/${key}`, { method: 'PUT', headers: { ...g.headers, 'Content-Type': type }, body: file });
          if (!response.ok) {
            const details = await response.text();
            console.error('R2 upload', response.status, details);
            return Response.json({ error: `Cloudflare upload failed (${response.status}). Check the R2 Edit permission on the Cloudflare token.` }, { status: response.status });
          }
          return Response.json({ url: `/api/media/object/${key}` });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : 'Upload failed.' }, { status: 403 });
        }
      },
    },
  },
});
