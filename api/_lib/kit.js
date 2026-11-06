// AI Creative System Kit fulfilment ($149 one-time). Called by the Stripe webhook in
// api/onboard-client.js, so it reuses that endpoint's signing secret and the same Google
// and Airtable credentials. Nothing new to configure in Vercel.
//
// For each completed kit checkout:
//   1. Skips it if a Kit Buyers row already has this Checkout Session ID (Stripe retries are safe).
//   2. Shares the master kit folder (view only) with the buyer's Google account: the optional
//      "Google account" checkout field if they filled it in, otherwise their checkout email.
//   3. Creates the Kit Buyers row with a Buyer ID and "Updates Until" = purchase date + 3 months.
//      Status "Ready" -> Airtable emails the buyer their welcome email.
//      Status "Needs attention" -> Airtable alerts Marinko (for example, the address isn't a
//      Google account, so Drive can't share with it).
// Transient errors (Google/Airtable down) return an error so Stripe retries later.
import crypto from 'node:crypto';
import { googleToken } from './drive.js';

export const KIT_TAG = 'ai-creative-system';
export const KIT_CENTS = 14900;
const DEFAULT_MASTER = '18aJmaH44JFuLWRjGrPyxoV9Zbdno21KY';   // "AI Creative System Kit" (master)
const DEFAULT_TABLE = 'tbl5rYuwLeoQSZXvP';                       // Kit Buyers
const UPDATE_MONTHS = 3;

export function isKitSession(s) {
  if (!s || s.mode !== 'payment') return false;
  return (s.metadata && s.metadata.kit === KIT_TAG) || s.amount_total === KIT_CENTS;
}

const EMAIL = /^[^\s@<>()",;:]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,}$/;
export function validEmail(v) { return typeof v === 'string' && EMAIL.test(v.trim()); }

// The optional "Google account for the kit folder" field. Matches on key or label, like websiteFromSession.
export function googleAccountFromSession(s) {
  const cf = Array.isArray(s && s.custom_fields) ? s.custom_fields : [];
  const hit = cf.find(c => c && c.text && (/google/i.test(c.key || '') || /google/i.test((c.label && c.label.custom) || '')));
  const v = hit && String(hit.text.value || '').trim().toLowerCase();
  return v && validEmail(v) ? v : null;
}

export function buyerId(bytes = crypto.randomBytes(6)) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';           // no 0/O, 1/I
  return 'SK-' + Array.from(bytes, b => abc[b % abc.length]).join('');
}

export function addMonths(isoDate, months) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, last));
  return t.toISOString().slice(0, 10);
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

// View-only share. Returns { ok:true } or { ok:false, permanent:true, message } for addresses Drive
// can never share with (not a Google account, blocked domain). Throws on anything that may pass on retry.
export async function shareKitFolder(token, folderId, email, fetchFn = fetch) {
  const r = await fetchFn(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions?sendNotificationEmail=false&supportsAllDrives=true`, {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'user', role: 'reader', emailAddress: email })
  });
  if (r.ok) return { ok: true };
  const text = await r.text();
  if (r.status === 400 || (r.status === 403 && /sharing|domain|policy/i.test(text))) {
    return { ok: false, permanent: true, message: `Drive ${r.status}: ${text.slice(0, 400)}` };
  }
  throw new Error(`Drive share failed ${r.status}: ${text.slice(0, 200)}`);
}

export async function handleKitPurchase(env, s, deps = {}) {
  const at = deps.airtable || ((p, o) => airtable(env, p, o));
  const table = env.KIT_BUYERS_TABLE_ID || DEFAULT_TABLE;
  const master = env.KIT_MASTER_FOLDER_ID || DEFAULT_MASTER;

  const email = s.customer_details && s.customer_details.email;
  if (!email) return { status: 200, body: { ignored: 'kit checkout without an email' } };
  // 'no_payment_required' = a 100% promo code (a comped tester); still fulfil it.
  if (s.payment_status && !['paid', 'no_payment_required'].includes(s.payment_status)) return { status: 200, body: { ignored: 'kit checkout not paid yet' } };
  const name = (s.collected_information && s.collected_information.individual_name) ||
               (s.customer_details && s.customer_details.name) || email;

  // Stripe retries and duplicate deliveries: one row per checkout session.
  const sid = String(s.id || '').replace(/'/g, '');
  const found = await at(`${table}?maxRecords=1&filterByFormula=${encodeURIComponent(`{Checkout Session ID}='${sid}'`)}`);
  if (found.records && found.records.length) return { status: 200, body: { ok: true, skipped: 'kit buyer already recorded' } };

  if (!env.GOOGLE_OAUTH_REFRESH_TOKEN && !deps.token) {
    return { status: 503, body: { error: 'Drive not authorized yet' } };
  }
  const google = googleAccountFromSession(s) || String(email).trim().toLowerCase();
  const token = deps.token || await googleToken(env);
  const share = await (deps.share || shareKitFolder)(token, master, google);

  const purchased = new Date((s.created || Date.now() / 1000) * 1000).toISOString().slice(0, 10);
  const fields = {
    'Name': String(name).slice(0, 120),
    'Email': email,
    'Google Account': google,
    'Buyer ID': deps.buyerId || buyerId(),
    'Status': share.ok ? 'Ready' : 'Needs attention',
    'Drive Access': share.ok ? 'Shared' : 'Failed',
    'Purchased On': purchased,
    'Updates Until': addMonths(purchased, UPDATE_MONTHS),
    'Membership': 'None',
    'Amount Paid': (s.amount_total || 0) / 100,
    'Stripe Customer ID': s.customer || '',
    'Checkout Session ID': sid
  };
  if (!share.ok) fields['Access Error'] = share.message;
  await at(table, { method: 'POST', body: JSON.stringify({ typecast: true, records: [{ fields }] }) });
  return { status: 200, body: { ok: true, kit: true, shared: share.ok } };
}
