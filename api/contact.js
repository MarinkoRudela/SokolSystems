// Contact form handler (Vercel serverless function).
// Secrets live in Vercel environment variables, never in the page:
//   AIRTABLE_TOKEN     personal access token (scope: data.records:write, this base only)
//   AIRTABLE_BASE_ID   appafy4soN5K55Kn4
//   AIRTABLE_TABLE_ID  tblqoNGS0BE4Huvyn

const ALLOWED_ORIGINS = ['https://sokolsystems.io', 'https://www.sokolsystems.io'];
const hits = new Map(); // best-effort per-IP rate limit (per warm instance)
const LIMIT = 5, WINDOW_MS = 10 * 60 * 1000;

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const origin = req.headers.origin || '';
  const isPreview = /\.vercel\.app$/.test(origin.replace(/^https?:\/\//, ''));
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !isPreview) {
    return res.status(403).json({ error: 'Request blocked.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    return res.status(429).json({ error: 'Too many messages. Try again in a few minutes, or email marinko@sokolsystems.io.' });
  }

  const b = typeof req.body === 'object' && req.body ? req.body : {};

  // Spam traps: filled honeypot or form submitted faster than a human could type.
  // Respond with success so bots don't learn anything.
  const started = Number(b.started_at || 0);
  if (clean(b.company_fax, 200) !== '' || !started || now - started < 3000) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(b.name, 80);
  const email = clean(b.email, 160).toLowerCase();
  let website = clean(b.website, 200);
  // Which form: the agency page's free-sample form tags its messages so they stand out in Airtable.
  const topic = b.topic === 'agency-sample' ? '[Free sample request: agency] ' : '';
  const message = clean(b.message, 2000);

  if (name.length < 2) return res.status(400).json({ error: 'Enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (message.length < 10) return res.status(400).json({ error: 'Your message is too short.' });
  if ((message.match(/https?:\/\//gi) || []).length > 2) return res.status(400).json({ error: 'Please include no more than two links.' });
  if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
  if (website) { try { new URL(website); } catch { website = ''; } }

  // Which ad or link brought them (utm tags from the landing URL, sent by the page).
  const src = clean(b.utm_source, 80), med = clean(b.utm_medium, 80);
  const source = src ? (med ? `${src} / ${med}` : src) : '';
  const campaign = clean(b.utm_campaign, 120);
  const ad = clean(b.utm_content, 120);
  const landing = clean(b.landing_page, 200);

  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID } = process.env;
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error('Contact form: Airtable environment variables are missing.');
    return res.status(500).json({ error: 'The form is temporarily unavailable. Email marinko@sokolsystems.io.' });
  }

  recent.push(now); hits.set(ip, recent);

  try {
    const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
      method: 'POST',
      signal: AbortSignal.timeout(7000),
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        typecast: true,
        records: [{ fields: {
          Name: name, Email: email, Website: website || undefined,
          Message: topic + message, Submitted: new Date().toISOString(), Status: 'New',
          Source: source || undefined, Campaign: campaign || undefined, Ad: ad || undefined, 'Landing page': landing || undefined
        } }]
      })
    });
    if (!r.ok) {
      console.error('Airtable error', r.status, await r.text());
      return res.status(502).json({ error: 'Your message was not sent. Try again, or email marinko@sokolsystems.io.' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Contact form failure:', e && e.name, e && e.message, e && e.cause && (e.cause.code || e.cause.message));
    return res.status(502).json({ error: 'Your message was not sent. Try again, or email marinko@sokolsystems.io.' });
  }
}
