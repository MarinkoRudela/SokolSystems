// Outreach unsubscribe link (required in every cold email by CAN-SPAM).
//   GET  /api/unsubscribe?t=TOKEN  -> confirmation page with one button
//   POST /api/unsubscribe  t=TOKEN -> marks the prospect Unsubscribed + Email Status "Stopped"
// Also accepts RFC 8058 one-click POSTs (List-Unsubscribe=One-Click) with the token in the query.
// The token is a random code stored on the prospect's Airtable row; it reveals nothing else.
// Env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID.

const PROSPECTS = 'tbl3wphN8EDOjohGn';
const F = { token: 'fldtLLvgTt0B5iv8H', unsub: 'fldLxmQgY4mP9Bmu3', status: 'fldkEqgEtnwKbQZDU' };
const validToken = t => typeof t === 'string' && /^[a-f0-9]{32}$/.test(t);

async function at(path, opts = {}) {
  const r = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${path}`, {
    method: opts.method || 'GET', body: opts.body, signal: AbortSignal.timeout(7000),
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Airtable ${r.status}`);
  return j;
}

function page(title, body, form) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Sokol Systems</title><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/styles.css"></head>
<body class="page"><main id="main" class="doc"><h1>${title}</h1><p>${body}</p>${form || ''}
<p><a href="/">sokolsystems.io</a></p></main></body></html>`;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return Object.fromEntries(new URLSearchParams(req.body));
  return {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.method === 'GET') {
    const t = String(req.query.t || '');
    if (!validToken(t)) return res.status(400).send(page('Link not recognised', 'This unsubscribe link is incomplete. Reply to our email with "unsubscribe" and we will remove you by hand.'));
    const form = `<form method="post" action="/api/unsubscribe"><input type="hidden" name="t" value="${t}"><button class="btn btn-main" type="submit">Unsubscribe</button></form>`;
    return res.status(200).send(page('Unsubscribe', 'Click the button and we will never email this address again.', form));
  }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).send(page('Not allowed', 'Use the link from our email.')); }

  const b = await readBody(req);
  const t = String(b.t || req.query.t || '');
  if (!validToken(t)) return res.status(400).send(page('Link not recognised', 'Reply to our email with "unsubscribe" and we will remove you by hand.'));
  if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) return res.status(500).send(page('Something went wrong', 'Reply to our email with "unsubscribe" and we will remove you by hand.'));

  try {
    const f = encodeURIComponent(`{Unsub Token}='${t}'`);
    const found = await at(`${PROSPECTS}?maxRecords=1&returnFieldsByFieldId=true&filterByFormula=${f}`);
    const rec = found.records && found.records[0];
    if (rec) {
      await at(`${PROSPECTS}/${rec.id}`, { method: 'PATCH', body: JSON.stringify({ typecast: true, fields: { [F.unsub]: true, [F.status]: 'Stopped' } }) });
    }
    // Same answer whether or not the token matched, so the link reveals nothing.
    return res.status(200).send(page('You’re unsubscribed', 'You won’t receive any more emails from Sokol Systems. Sorry for the interruption.'));
  } catch (e) {
    console.error('Unsubscribe failure:', e && e.message);
    return res.status(502).send(page('Something went wrong', 'Please try again in a minute, or reply to our email with "unsubscribe" and we will remove you by hand.'));
  }
}
