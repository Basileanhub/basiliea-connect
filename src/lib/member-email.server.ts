import { query } from './cloudflare.server';

export function newCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1000000;
  return String(n).padStart(6, '0');
}

export async function codeHash(email: string, code: string) {
  const secret = process.env['BMI_SESSION_SECRET'] ?? '';
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}:${email}:${code}`));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Stores a fresh 15-minute code for the member and emails it through Resend. */
export async function issueCode(userId: string, email: string, name: string) {
  const code = newCode();
  await query('UPDATE users SET verify_code_hash=?,verify_expires=?,verify_attempts=0 WHERE id=?', [await codeHash(email, code), Date.now() + 15 * 60 * 1000, userId]);
  await sendCode(email, name, code);
}

async function sendCode(email: string, name: string, code: string) {
  const lovable = process.env['LOVABLE_API_KEY'];
  const resend = process.env['RESEND_API_KEY'];
  if (!lovable || !resend) throw new Error('Email sending is not configured yet.');
  const settings = Object.fromEntries((await query("SELECT key,value FROM settings WHERE key IN ('email_from','brand_name')")).map(r => [String(r['key']), String(r['value'] ?? '')]));
  const brand = settings['brand_name'] || 'Basileia Ministries International';
  const from = settings['email_from'] || `${brand} <onboarding@resend.dev>`;
  const base = (process.env['CONNECTOR_GATEWAY_BASE_URL'] ?? 'https://connector-gateway.lovable.dev').replace(/\/$/, '');
  const safeName = name.replace(/[<>&"]/g, '');
  const response = await fetch(`${base}/resend/emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lovable}`, 'X-Connection-Api-Key': resend },
    body: JSON.stringify({
      from, to: [email], subject: `${code} is your ${brand} code`,
      text: `Hello ${safeName},\n\nYour verification code is ${code}. It expires in 15 minutes.\n\nIf you did not ask for this, you can ignore this email.\n\n${brand}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#2b1d1a"><h2 style="color:#7a1414;margin:0 0 16px">${brand}</h2><p>Hello ${safeName},</p><p>Your verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:16px 0">${code}</p><p>It expires in 15 minutes. If you did not ask for this, you can ignore this email.</p></div>`,
    }),
  });
  if (!response.ok) {
    console.error('Resend send failed', response.status, await response.text());
    throw new Error('We could not send your code right now. Please try again shortly.');
  }
}
