// Client portal API. Every call is keyed by the client's secret portal code (?c=...).
// The server looks up that one client and only ever reads/writes records linked to them,
// so a client can never see or change another client's requests or brands.
//   GET  /api/portal?c=CODE                         -> the client's info + brands + requests
//   POST /api/portal {c, action:"create", ...}      -> new request (+ optional small files), for one of their brands
//   POST /api/portal {c, action:"approve", requestId}
//   POST /api/portal {c, action:"revise",  requestId, note}
//   POST /api/portal {c, action:"answer",  requestId, answer}   (reply to a Needs info question)
//   POST /api/portal {c, action:"website", website}              (only if their record has no website yet)
//   POST /api/portal {c, action:"addBrand", name, website, notes} -> new brand: Drive folders + a Brand setup request in their queue
//   POST /api/portal {c, action:"archiveBrand", brandId}         -> hide a brand (files stay in Drive)
//   POST /api/portal {c, action:"restoreBrand", brandId}
// Brands are unlimited. Requests are produced one at a time across all of a client's brands,
// and setting up a new brand takes one turn in that queue.
// Env: AIRTABLE_TOKEN (read+write), AIRTABLE_BASE_ID; Google OAuth vars for brand folders (see _lib/drive.js).
import { driveReady, googleToken, brandFolders, folderName, folderIdFromUrl } from './_lib/drive.js';

const CLIENTS = 'tbloJmuK4GVVz3ZrU', REQS = 'tblm5o91bZlNIXHGh', BRANDS = 'tbl3s2meIuOoKE2Uj';
const C = { name: 'fldGq2o6mNqKxA720', status: 'fld1Q2C8VOcA1b5Fq', drive: 'fldUdUTB1vAsTxfRL', guide: 'fldxUywS2Z1iPoOcR', website: 'fld3SQJEoAbRfozKe', requests: 'fldg2gDHEkeokRnXt', brands: 'fldV0pAWCrCncNGEg' };
const R = { title: 'fldHYOaV2M8JIWsyJ', client: 'fldrjEMKK2nCN7r8s', type: 'fldR5VxCVB4CE4Tfa', brief: 'fldCVL7mLSq1t5HTh', platforms: 'fldUQh0oUi3nWr9xz',
            sizes: 'fldfe4mOOsR6H7MwR', files: 'fld9HJ8EnwxcatsQx', status: 'fldQdbNa8d1gEgR6m', delivery: 'fldrQ55bcoeGQJJol', notes: 'fldEr7VAXfT9t93wj', deliveredOn: 'fldVISA4yqIH0Wp2J', question: 'fldijVbhic2iMm0zW', answer: 'fldTHGQmE5cRN8fuz', brand: 'fld7JdZPmMpXpR19A' };
const B = { name: 'fldzh637XEYcua8D1', client: 'fld2mlr49XBWk6AZc', website: 'fld0F4D4flV4IlKmO', status: 'fldTb42tdtecRjFdN', drive: 'fldHr0pOGwPrmc5ou', driveId: 'fldZCl5dvmLERRkr8' };
const TYPES = ['Winner to multiply', 'Static ad', 'Video ad', 'Reel / video edit', 'UGC-style ad', 'Product visual', 'Carousel', 'Hook variations', 'Social content', 'Other'];
const SETUP_TYPE = 'Brand setup';
const PLATFORMS = ['Meta (Facebook/Instagram)', 'TikTok', 'YouTube', 'Google', 'Website', 'Organic social', 'Other'];
const SIZES = ['1:1 square', '4:5 portrait', '9:16 vertical', '16:9 landscape'];
const OPEN = ['New', 'In progress', 'Needs info', 'Info received', 'Revision requested'];
const FILE_TYPES = /^(image\/(png|jpeg|webp|gif)|application\/pdf|video\/mp4)$/;
const MAX_FILES = 3, MAX_BYTES = 2.5 * 1024 * 1024, MAX_BRANDS = 50;
const BILLING = 'https://billing.stripe.com/p/login/8x2eVd5SX3767u5b2W5Ne00';
const ALLOWED_ORIGINS = ['https://sokolsystems.io', 'https://www.sokolsystems.io'];
const hits = new Map(); const LIMIT = 40, WINDOW_MS = 10 * 60 * 1000;

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const validCode = c => typeof c === 'string' && /^[a-f0-9]{48}$/.test(c);
const validRec = id => typeof id === 'string' && /^rec[A-Za-z0-9]{14}$/.test(id);
const sel = v => (v && typeof v === 'object' ? v.name : v) || '';

async function at(path, opts = {}) {
  const base = opts.content ? 'https://content.airtable.com' : 'https://api.airtable.com';
  const r = await fetch(`${base}/v0/${process.env.AIRTABLE_BASE_ID}/${path}`, {
    method: opts.method || 'GET', body: opts.body, signal: AbortSignal.timeout(7000),
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(`Airtable ${r.status}: ${JSON.stringify(j.error || j)}`); e.status = r.status; throw e; }
  return j;
}

async function findClient(code) {
  const f = encodeURIComponent(`{Portal Token}='${code}'`);
  const j = await at(`${CLIENTS}?maxRecords=1&returnFieldsByFieldId=true&filterByFormula=${f}`);
  return j.records && j.records[0];
}

async function byIds(table, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40).filter(validRec);
    if (!chunk.length) continue;
    const f = encodeURIComponent(`OR(${chunk.map(id => `RECORD_ID()='${id}'`).join(',')})`);
    const j = await at(`${table}?returnFieldsByFieldId=true&filterByFormula=${f}`);
    out.push(...(j.records || []));
  }
  return out;
}

async function clientBrands(client) {
  const recs = await byIds(BRANDS, (client.fields || {})[C.brands] || []);
  return recs.filter(r => ((r.fields || {})[B.client] || []).includes(client.id)).map(r => {
    const f = r.fields || {};
    return { id: r.id, created: r.createdTime, name: f[B.name] || 'Untitled brand', status: sel(f[B.status]) || 'Active', website: f[B.website] || '', drive: f[B.drive] || '' };
  }).sort((a, b) => (a.status === 'Archived') - (b.status === 'Archived') || (a.created || '').localeCompare(b.created || ''));
}

async function clientRequests(client) {
  const recs = await byIds(REQS, (client.fields || {})[C.requests] || []);
  return recs.filter(r => ((r.fields || {})[R.client] || []).includes(client.id)).map(r => {
    const f = r.fields || {};
    return { id: r.id, created: r.createdTime, title: f[R.title] || 'Untitled request', type: sel(f[R.type]), status: sel(f[R.status]) || 'New',
             brief: f[R.brief] || '', platforms: (f[R.platforms] || []).map(sel), sizes: (f[R.sizes] || []).map(sel),
             delivery: f[R.delivery] || '', deliveredOn: f[R.deliveredOn] || '', notes: f[R.notes] || '',
             question: f[R.question] || '', answer: f[R.answer] || '', brandId: (f[R.brand] || [])[0] || '',
             files: (f[R.files] || []).length };
  }).sort((a, b) => (b.created || '').localeCompare(a.created || ''));
}

function normalizeUrl(raw) {
  let v = clean(raw, 300);
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  try { const u = new URL(v); if (/^https?:$/.test(u.protocol) && /\.[a-z]{2,}$/i.test(u.hostname)) return u.toString(); } catch {}
  return null;
}

function limited(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  recent.push(now); hits.set(ip, recent);
  return recent.length > LIMIT;
}

const closedMsg = status => status === 'Payment issue' ? 'Your latest payment didn\'t go through. Update your card in the billing portal and new requests open right back up.'
  : status === 'Paused' ? 'Your subscription is paused. Resume it in the billing portal to send new requests.'
  : 'Your subscription has ended, so new requests are closed.';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) return res.status(500).json({ error: 'Portal is temporarily unavailable. Email marinko@sokolsystems.io.' });
  if (limited(req)) return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });

  try {
    if (req.method === 'GET') {
      const code = String(req.query.c || '');
      if (!validCode(code)) return res.status(404).json({ error: 'This portal link is not valid.' });
      const client = await findClient(code);
      if (!client) return res.status(404).json({ error: 'This portal link is not valid.' });
      const f = client.fields || {};
      const [brands, requests] = await Promise.all([clientBrands(client), clientRequests(client)]);
      const names = Object.fromEntries(brands.map(b => [b.id, b.name]));
      requests.forEach(r => { r.brand = names[r.brandId] || ''; });
      return res.status(200).json({
        client: { name: f[C.name] || 'there', status: sel(f[C.status]) || 'Active', drive: f[C.drive] || '', guide: f[C.guide] || '', billing: BILLING, needsWebsite: !f[C.website] },
        options: { types: TYPES, platforms: PLATFORMS, sizes: SIZES, maxFiles: MAX_FILES, maxBytes: MAX_BYTES },
        brands, requests
      });
    }

    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
    const origin = req.headers.origin || '';
    if (origin && !ALLOWED_ORIGINS.includes(origin) && !/\.vercel\.app$/.test(origin.replace(/^https?:\/\//, ''))) return res.status(403).json({ error: 'Request blocked.' });

    const b = typeof req.body === 'object' && req.body ? req.body : {};
    if (!validCode(b.c)) return res.status(404).json({ error: 'This portal link is not valid.' });
    const client = await findClient(b.c);
    if (!client) return res.status(404).json({ error: 'This portal link is not valid.' });
    const cf = client.fields || {}, status = sel(cf[C.status]) || 'Active';
    const owned = new Set(cf[C.requests] || []);
    const closed = ['Paused', 'Cancelled', 'Payment issue'].includes(status);

    if (b.action === 'create') {
      if (closed) return res.status(403).json({ error: closedMsg(status) });
      const title = clean(b.title, 120), brief = clean(b.brief, 4000), type = clean(b.type, 40);
      const platforms = (Array.isArray(b.platforms) ? b.platforms : []).filter(p => PLATFORMS.includes(p));
      const sizes = (Array.isArray(b.sizes) ? b.sizes : []).filter(s => SIZES.includes(s));
      if (title.length < 3) return res.status(400).json({ error: 'Give your request a short name (at least 3 characters).' });
      if (!TYPES.includes(type)) return res.status(400).json({ error: 'Choose what type of creative you need.' });
      if (brief.length < 10) return res.status(400).json({ error: 'Tell us a little more in the brief (at least 10 characters).' });

      // Which brand: required once a client has more than one; automatic when they have one.
      const live = (await clientBrands(client)).filter(x => x.status !== 'Archived');
      let brandId = null;
      if (live.length === 1) brandId = live[0].id;
      else if (live.length > 1) {
        const pick = live.find(x => x.id === b.brandId);
        if (!pick) return res.status(400).json({ error: 'Choose which brand this request is for.' });
        brandId = pick.id;
      }

      const files = Array.isArray(b.files) ? b.files.slice(0, MAX_FILES + 1) : [];
      if (files.length > MAX_FILES) return res.status(400).json({ error: `Attach up to ${MAX_FILES} files. Bigger batches can go in your Drive folder.` });
      let total = 0;
      for (const file of files) {
        if (!file || !FILE_TYPES.test(String(file.type)) || typeof file.data !== 'string') return res.status(400).json({ error: 'Files must be images, PDFs or short MP4s.' });
        total += Math.floor(file.data.length * 3 / 4);
      }
      if (total > MAX_BYTES) return res.status(400).json({ error: 'Files are too large to attach here (2.5 MB total). Add them to your Drive folder instead.' });

      const fields = { [R.title]: title, [R.client]: [client.id], [R.type]: type, [R.brief]: brief, [R.platforms]: platforms, [R.sizes]: sizes, [R.status]: 'New' };
      if (brandId) fields[R.brand] = [brandId];
      const created = await at(REQS, { method: 'POST', body: JSON.stringify({ typecast: true, records: [{ fields }] }) });
      const recId = created.records[0].id;
      let attached = 0;
      for (const file of files) {
        try {
          await at(`${recId}/${R.files}/uploadAttachment`, { content: true, method: 'POST',
            body: JSON.stringify({ contentType: file.type, file: file.data, filename: clean(file.name, 120) || 'reference' }) });
          attached++;
        } catch (e) { console.error('Portal attachment failed:', e.message); }
      }
      return res.status(200).json({ ok: true, id: recId, attached, skipped: files.length - attached });
    }

    if (b.action === 'addBrand') {
      if (closed) return res.status(403).json({ error: closedMsg(status) });
      const name = clean(b.name, 80), notes = clean(b.notes, 1500), site = normalizeUrl(b.website);
      if (name.length < 2) return res.status(400).json({ error: 'Enter the brand\'s name.' });
      if (!site) return res.status(400).json({ error: 'Add the brand\'s website (or its main social page), like brandname.com. We study it before making anything.' });
      const brands = await clientBrands(client);
      const live = brands.filter(x => x.status !== 'Archived');
      if (live.length >= MAX_BRANDS) return res.status(409).json({ error: 'You have a lot of brands live. Archive some you\'re not using, or email us.' });
      const dupe = brands.find(x => x.name.toLowerCase() === name.toLowerCase());
      if (dupe) return res.status(409).json({ error: dupe.status === 'Archived' ? `${dupe.name} is archived. Restore it under Your brands instead.` : `${dupe.name} is already one of your brands.` });

      // Its own folder (Brand Assets + Deliveries) inside the client's shared folder. If Drive is
      // unavailable the brand is still added and Marinko creates the folder by hand.
      let folder = null, driveNote = '';
      const parent = folderIdFromUrl(cf[C.drive]);
      if (parent && driveReady()) {
        try { folder = await brandFolders(await googleToken(), folderName(name), parent); }
        catch (e) { console.error('Brand folder failed:', e.message); driveNote = '\n\nNote: the Drive folder could not be created automatically. Create it by hand.'; }
      } else driveNote = '\n\nNote: no Drive folder was created automatically. Create it by hand.';

      const brandFields = { [B.name]: name, [B.client]: [client.id], [B.website]: site, [B.status]: 'Setting up' };
      if (folder) { brandFields[B.drive] = folder.webViewLink; brandFields[B.driveId] = folder.id; }
      const brand = (await at(BRANDS, { method: 'POST', body: JSON.stringify({ typecast: true, records: [{ fields: brandFields }] }) })).records[0];

      const brief = `New brand added from the portal. Before making anything for it, we research its website and current ads and build its brand profile.\n\nWebsite: ${site}` +
        (notes ? `\n\nFrom the client: ${notes}` : '') + driveNote;
      await at(REQS, { method: 'POST', body: JSON.stringify({ typecast: true, records: [{ fields: {
        [R.title]: `Brand setup: ${name}`, [R.client]: [client.id], [R.brand]: [brand.id], [R.type]: SETUP_TYPE, [R.brief]: brief, [R.status]: 'New'
      } }] }) });
      return res.status(200).json({ ok: true, brandId: brand.id, drive: folder ? folder.webViewLink : '' });
    }

    if (b.action === 'archiveBrand' || b.action === 'restoreBrand') {
      if (status === 'Cancelled') return res.status(403).json({ error: 'Your subscription has ended.' });
      const brands = await clientBrands(client);
      const brand = validRec(b.brandId) && brands.find(x => x.id === b.brandId);
      if (!brand) return res.status(404).json({ error: 'Brand not found.' });
      if (b.action === 'archiveBrand') {
        if (brand.status === 'Archived') return res.status(200).json({ ok: true });
        if (brands.filter(x => x.status !== 'Archived').length <= 1) return res.status(409).json({ error: 'This is your only brand, so it can\'t be archived.' });
        const open = (await clientRequests(client)).filter(r => r.brandId === brand.id && OPEN.includes(r.status));
        if (open.length) return res.status(409).json({ error: `${brand.name} still has ${open.length === 1 ? 'a request' : open.length + ' requests'} in your queue. Once ${open.length === 1 ? 'it\'s' : 'they\'re'} delivered, you can archive it.` });
        await at(`${BRANDS}/${brand.id}`, { method: 'PATCH', body: JSON.stringify({ typecast: true, fields: { [B.status]: 'Archived' } }) });
      } else {
        if (closed) return res.status(403).json({ error: closedMsg(status) });
        if (brand.status !== 'Archived') return res.status(200).json({ ok: true });
        await at(`${BRANDS}/${brand.id}`, { method: 'PATCH', body: JSON.stringify({ typecast: true, fields: { [B.status]: 'Active' } }) });
      }
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'approve' || b.action === 'revise') {
      if (status === 'Cancelled') return res.status(403).json({ error: 'Your subscription has ended.' });
      if (!validRec(b.requestId) || !owned.has(b.requestId)) return res.status(404).json({ error: 'Request not found.' });
      const rec = await at(`${REQS}/${b.requestId}?returnFieldsByFieldId=true`);
      const f = rec.fields || {};
      if (!(f[R.client] || []).includes(client.id)) return res.status(404).json({ error: 'Request not found.' });
      if (sel(f[R.status]) !== 'Delivered') return res.status(409).json({ error: 'You can approve or request changes once a request is delivered.' });

      let fields;
      if (b.action === 'approve') fields = { [R.status]: 'Approved' };
      else {
        const note = clean(b.note, 2000);
        if (note.length < 5) return res.status(400).json({ error: 'Tell us what you\'d like changed.' });
        const stamp = new Date().toISOString().slice(0, 10);
        fields = { [R.status]: 'Revision requested', [R.notes]: ((f[R.notes] ? f[R.notes] + '\n\n' : '') + `[${stamp}] ${note}`).slice(0, 10000) };
      }
      await at(`${REQS}/${b.requestId}`, { method: 'PATCH', body: JSON.stringify({ typecast: true, fields }) });
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'answer') {
      if (status === 'Cancelled') return res.status(403).json({ error: 'Your subscription has ended.' });
      if (!validRec(b.requestId) || !owned.has(b.requestId)) return res.status(404).json({ error: 'Request not found.' });
      const rec = await at(`${REQS}/${b.requestId}?returnFieldsByFieldId=true`);
      const f = rec.fields || {};
      if (!(f[R.client] || []).includes(client.id)) return res.status(404).json({ error: 'Request not found.' });
      if (sel(f[R.status]) !== 'Needs info') return res.status(409).json({ error: 'There\'s no open question on this request.' });
      const answer = clean(b.answer, 4000);
      if (answer.length < 2) return res.status(400).json({ error: 'Type your answer first.' });
      await at(`${REQS}/${b.requestId}`, { method: 'PATCH', body: JSON.stringify({ typecast: true, fields: { [R.answer]: answer, [R.status]: 'Info received' } }) });
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'website') {
      if (cf[C.website]) return res.status(409).json({ error: 'We already have your website. Email us if it has changed.' });
      const url = normalizeUrl(b.website);
      if (!url) return res.status(400).json({ error: 'That doesn\'t look like a website address. Try something like yourcompany.com.' });
      await at(`${CLIENTS}/${client.id}`, { method: 'PATCH', body: JSON.stringify({ fields: { [C.website]: url } }) });
      // A client with a single brand and no brand website: that's the same site.
      const brands = (await clientBrands(client)).filter(x => x.status !== 'Archived');
      if (brands.length === 1 && !brands[0].website) {
        try { await at(`${BRANDS}/${brands[0].id}`, { method: 'PATCH', body: JSON.stringify({ fields: { [B.website]: url } }) }); }
        catch (e) { console.error('Brand website update failed:', e.message); }
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    console.error('Portal failure:', e && e.message);
    return res.status(502).json({ error: 'Something went wrong on our side. Try again, or email marinko@sokolsystems.io.' });
  }
}
