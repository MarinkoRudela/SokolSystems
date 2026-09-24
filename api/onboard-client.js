// Stripe webhook: finishes onboarding a new $2,995 subscriber automatically.
// 1. Verifies the request really came from Stripe (signature check on the raw body).
// 2. Finds the client record the Airtable onboarding automation created.
// 3. Creates their Google Drive folder (+ Brand Assets, Deliveries) and shares it with them.
// 4. Writes the folder link to their record; sets Status = Active if their request form link exists,
//    which triggers the "You're all set" email automation in Airtable.
// Any non-2xx response makes Stripe retry later, so a slow step never loses a client.
//
// Env vars (Vercel): STRIPE_WEBHOOK_SECRET, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
// GOOGLE_OAUTH_REFRESH_TOKEN, AIRTABLE_TOKEN (needs data.records:read + write), AIRTABLE_BASE_ID.
// Optional: ONBOARDING_GUIDE_URL, DRIVE_PARENT_FOLDER_ID, AIRTABLE_CLIENTS_TABLE_ID.
import crypto from 'node:crypto';

const PRICE_CENTS = 299500;
const DEFAULT_PARENT = '1zfBgXHf1FmKzOLpM1HGNorfRLDTHAH07';   // "Sokol Systems — Clients"
const DEFAULT_CLIENTS = 'tbloJmuK4GVVz3ZrU';

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function verifyStripe(raw, header, secret, toleranceSec = 300, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')).filter(p => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const sigs = header.split(',').filter(p => p.trim().startsWith('v1=')).map(p => p.trim().slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length || Math.abs(now / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw.toString('utf8')}`).digest('hex');
  return sigs.some(s => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function googleToken(env) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GOOGLE_OAUTH_CLIENT_ID, client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET, refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN, grant_type: 'refresh_token' })
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Google token refresh failed: ' + (j.error_description || j.error));
  return j.access_token;
}

async function driveFolder(token, name, parent) {
  const r = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink&supportsAllDrives=true', {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parent] })
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Drive folder create failed: ' + JSON.stringify(j.error || j));
  return j;
}

async function driveShare(token, fileId, email) {
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false&supportsAllDrives=true`, {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'user', role: 'writer', emailAddress: email })
  });
  if (!r.ok) throw new Error('Drive share failed: ' + (await r.text()));
}

async function airtable(env, path, opts = {}) {
  const r = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${path}`, {
    ...opts, signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Airtable error ' + r.status + ': ' + JSON.stringify(j.error || j));
  return j;
}

export default async function handler(req, res) {
  const env = process.env;
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }

  const raw = await readRaw(req);
  if (!verifyStripe(raw, req.headers['stripe-signature'], env.STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return res.status(400).json({ error: 'Bad JSON' }); }
  if (event.type !== 'checkout.session.completed') return res.status(200).json({ ignored: event.type });

  const s = event.data && event.data.object || {};
  if (s.mode !== 'subscription' || s.amount_total !== PRICE_CENTS) return res.status(200).json({ ignored: 'not a Sokol subscription' });

  const email = s.customer_details && s.customer_details.email;
  const name = (s.customer_details && s.customer_details.name) || email;
  const customer = s.customer;
  if (!email || !customer) return res.status(200).json({ ignored: 'missing customer details' });

  if (!env.GOOGLE_OAUTH_REFRESH_TOKEN) {
    console.error('Onboarding: GOOGLE_OAUTH_REFRESH_TOKEN not set yet — Stripe will retry.');
    return res.status(503).json({ error: 'Drive not authorized yet' });
  }

  const table = env.AIRTABLE_CLIENTS_TABLE_ID || DEFAULT_CLIENTS;
  try {
    // The Airtable automation creates the record from the same Stripe event; give it a moment.
    let rec = null;
    const formula = encodeURIComponent(`{Stripe Customer ID}='${String(customer).replace(/'/g, '')}'`);
    for (let i = 0; i < 3 && !rec; i++) {
      const found = await airtable(env, `${table}?maxRecords=1&filterByFormula=${formula}`);
      rec = found.records && found.records[0];
      if (!rec) await sleep(1800);
    }
    if (!rec) { console.error('Onboarding: client record not found yet for', customer); return res.status(503).json({ error: 'Client record not ready' }); }

    const f = rec.fields || {};
    if (f['Drive Folder']) return res.status(200).json({ ok: true, skipped: 'already onboarded' });

    const token = await googleToken(env);
    const folder = await driveFolder(token, f['Client Name'] || name, env.DRIVE_PARENT_FOLDER_ID || DEFAULT_PARENT);
    await driveFolder(token, 'Brand Assets', folder.id);
    await driveFolder(token, 'Deliveries', folder.id);
    await driveShare(token, folder.id, email);

    const fields = { 'Drive Folder': folder.webViewLink };
    if (env.ONBOARDING_GUIDE_URL) fields['Notion Onboarding Page'] = env.ONBOARDING_GUIDE_URL;
    // Every client gets a private portal (send requests, track status, approve deliveries).
    let formLink = f['Request Form Link'];
    if (!f['Portal Token']) {
      const code = crypto.randomBytes(24).toString('hex');           // 48 hex chars, unguessable
      fields['Portal Token'] = code;
      formLink = `https://sokolsystems.io/portal?c=${code}`;
      fields['Request Form Link'] = formLink;
    }
    const ready = Boolean(formLink);
    if (ready) fields['Status'] = 'Active';
    await airtable(env, `${table}/${rec.id}`, { method: 'PATCH', body: JSON.stringify({ typecast: true, fields }) });

    console.log('Onboarded', customer, 'folder', folder.id, ready ? '(activated)' : '(left in Onboarding)');
    return res.status(200).json({ ok: true, activated: ready });
  } catch (e) {
    console.error('Onboarding failure:', e && e.message);
    return res.status(500).json({ error: 'Onboarding failed; Stripe will retry' });
  }
}
