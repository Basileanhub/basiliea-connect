import { query } from './cloudflare.server';
import type { Row } from './cms-model';
/** Admins have an ordinary member row for prayer and personal highlights. */
export async function adminMember(row: Row): Promise<string> {
  const existing = (await query('SELECT id FROM users WHERE email=?', [row['email']]))[0];
  if (existing) return String(existing['id']);
  const id = crypto.randomUUID();
  await query('INSERT INTO users(id,google_sub,email,name,email_verified) VALUES (?,?,?,?,1)', [id, `admin:${row['id']}`, row['email'], row['name'] ?? row['email']]);
  return id;
}