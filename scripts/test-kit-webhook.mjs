// Offline test for the kit part of the Stripe webhook (no network: fetch is faked).
// Run from the repo root:  node scripts/test-kit-webhook.mjs
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
const mod = await import(new URL('../api/onboard-client.js', import.meta.url));
const kit = await import(new URL('../api/_lib/kit.js', import.meta.url));
const handler = mod.default;
const SECRET = 'whsec_test';
Object.assign(process.env, { STRIPE_WEBHOOK_SECRET: SECRET, GOOGLE_OAUTH_CLIENT_ID: 'x', GOOGLE_OAUTH_CLIENT_SECRET: 'y', GOOGLE_OAUTH_REFRESH_TOKEN: 'z', AIRTABLE_TOKEN: 't', AIRTABLE_BASE_ID: 'appafy4soN5K55Kn4' });

let calls = [], driveStatus = 200, existing = false;
globalThis.fetch = async (url, opts = {}) => {
  calls.push({ url: String(url), method: opts.method || 'GET', body: opts.body });
  const J = (o, status = 200) => ({ ok: status < 300, status, json: async () => o, text: async () => JSON.stringify(o) });
  if (String(url).includes('oauth2.googleapis.com')) return J({ access_token: 'tok' });
  if (String(url).includes('/permissions')) return driveStatus === 200 ? J({ id: 'perm' }) : J({ error: { message: driveStatus === 400 ? 'invalidSharingRequest: no Google account' : 'backend' } }, driveStatus);
  if (String(url).includes('api.airtable.com') && (opts.method || 'GET') === 'GET') return J({ records: existing ? [{ id: 'rec1', fields: {} }] : [] });
  if (String(url).includes('api.airtable.com')) return J({ records: [{ id: 'recNew' }] });
  throw new Error('unexpected ' + url);
};

function req(event) {
  const raw = Buffer.from(JSON.stringify(event));
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', SECRET).update(`${t}.${raw}`).digest('hex');
  const r = Readable.from([raw]); r.method = 'POST'; r.headers = { 'stripe-signature': `t=${t},v1=${sig}` }; return r;
}
function res() { const o = { code: 0, body: null, headers: {} }; o.status = c => (o.code = c, o); o.json = b => (o.body = b, o); o.setHeader = (k, v) => o.headers[k] = v; return o; }
const session = (extra = {}) => ({ type: 'checkout.session.completed', data: { object: { id: 'cs_live_123', mode: 'payment', amount_total: 14900, payment_status: 'paid', created: 1793770000, customer: 'cus_1', metadata: { kit: 'ai-creative-system' }, customer_details: { email: 'Owner@Example.com', name: 'Pat Owner' }, custom_fields: [], ...extra } } });
const posted = () => JSON.parse(calls.find(c => c.url.includes('airtable') && c.method === 'POST').body).records[0].fields;
const perm = () => JSON.parse(calls.find(c => c.url.includes('/permissions')).body);
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };

// 1 normal purchase
calls = []; let r = res(); await handler(req(session()), r);
let f = posted();
ok(r.code === 200 && r.body.kit && r.body.shared, '1 kit purchase -> 200 shared');
ok(perm().role === 'reader' && perm().emailAddress === 'owner@example.com', '1 shared view-only with checkout email (lowercased)');
ok(calls.find(c => c.url.includes('/permissions')).url.includes('18aJmaH44JFuLWRjGrPyxoV9Zbdno21KY') && calls.find(c => c.url.includes('/permissions')).url.includes('sendNotificationEmail=false'), '1 master folder, no Google email');
ok(f.Status === 'Ready' && f['Drive Access'] === 'Shared' && /^SK-[A-Z2-9]{6}$/.test(f['Buyer ID']), '1 row Ready/Shared with Buyer ID ' + f['Buyer ID']);
ok(f['Purchased On'] === '2026-11-04' && f['Updates Until'] === '2027-05-04' && f['Amount Paid'] === 149, '1 dates ' + f['Purchased On'] + ' -> ' + f['Updates Until']);
ok(f['Checkout Session ID'] === 'cs_live_123' && f.Name === 'Pat Owner', '1 session id + name');

// 2 different Google account entered at checkout
calls = []; r = res(); await handler(req(session({ custom_fields: [{ key: 'googleaccount', label: { custom: 'Google account for the kit folder (if not the email above)' }, text: { value: ' Pat.Work@gmail.com ' } }] })), r);
ok(perm().emailAddress === 'pat.work@gmail.com' && posted()['Google Account'] === 'pat.work@gmail.com' && posted().Email === 'Owner@Example.com', '2 uses the Google account field');

// 3 bad custom value falls back to checkout email
calls = []; r = res(); await handler(req(session({ custom_fields: [{ key: 'googleaccount', label: { custom: 'Google account' }, text: { value: 'not an email' } }] })), r);
ok(perm().emailAddress === 'owner@example.com', '3 invalid Google field falls back to checkout email');

// 4 not a Google account -> Needs attention, 200 (no endless retries)
driveStatus = 400; calls = []; r = res(); await handler(req(session()), r);
ok(r.code === 200 && r.body.shared === false && posted().Status === 'Needs attention' && posted()['Drive Access'] === 'Failed' && /400/.test(posted()['Access Error']), '4 share refused -> Needs attention');

// 5 Drive outage -> 500 so Stripe retries, no row
driveStatus = 500; calls = []; r = res(); await handler(req(session()), r);
ok(r.code === 500 && !calls.some(c => c.url.includes('airtable') && c.method === 'POST'), '5 Drive 500 -> 500, nothing written');
driveStatus = 200;

// 6 duplicate delivery -> skipped, no share
existing = true; calls = []; r = res(); await handler(req(session()), r);
ok(r.code === 200 && r.body.skipped && !calls.some(c => c.url.includes('/permissions')), '6 duplicate skipped');
existing = false;

// 7 Sokol subscription still goes the old way (not treated as kit)
calls = []; r = res(); await handler(req({ type: 'checkout.session.completed', data: { object: { id: 'cs_sub', mode: 'subscription', amount_total: 149500, customer: 'cus_2', customer_details: { email: 'c@x.com', name: 'C' } } } }), r);
ok(!calls.some(c => c.url.includes('/permissions') && c.url.includes('18aJmaH44')), '7 subscription not routed to kit');

// 8 other one-time product ignored
calls = []; r = res(); await handler(req({ type: 'checkout.session.completed', data: { object: { id: 'cs_o', mode: 'payment', amount_total: 999, customer_details: { email: 'a@b.co' } } } }), r);
ok(r.code === 200 && r.body.ignored && calls.length === 0, '8 other one-time checkout ignored');

// 9 bad signature
r = res(); const bad = req(session()); bad.headers['stripe-signature'] = 't=1,v1=00'; await handler(bad, r);
ok(r.code === 400, '9 bad signature rejected');

// 10 unpaid (async payment pending)
calls = []; r = res(); await handler(req(session({ payment_status: 'unpaid' })), r);
ok(r.code === 200 && r.body.ignored && calls.length === 0, '10 unpaid ignored');

existing = false; calls = []; r = res(); await handler(req(session({ payment_status: 'no_payment_required', amount_total: 0 })), r);
ok(r.code === 200 && r.body.shared && posted()['Amount Paid'] === 0, '10b free (100% promo code) still fulfilled');
ok(kit.addMonths('2026-08-31', 6) === '2027-02-28', '11 month-end clamp ' + kit.addMonths('2026-08-31', 6));
console.log(fail ? `${fail} FAILED` : 'ALL PASS');
