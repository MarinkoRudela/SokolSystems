// Step 2: Google redirects here with a one-time code after Marinko clicks
// Allow. We exchange it for a refresh token and display it ONCE so it can be
// copied into Vercel's environment variables. Nothing is stored by this
// endpoint itself — it has no database. The token is only ever shown here,
// server-rendered, never logged, never sent anywhere else.
export default async function handler(req, res) {
  const { code, error } = req.query;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = `https://${req.headers.host}/api/auth/callback`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (error) {
    return res.end(`<p>Google returned an error: ${escapeHtml(error)}. Close this tab and try the link again.</p>`);
  }
  if (!code) {
    return res.end('<p>No authorization code received. Close this tab and try the link again.</p>');
  }
  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    return res.end('<p>GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET is missing in Vercel environment variables.</p>');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.end(`<p>Google rejected the exchange: ${escapeHtml(data.error_description || data.error || 'unknown error')}.</p>`);
    }
    if (!data.refresh_token) {
      return res.end(`<p>No refresh_token was returned. This usually means this Google account already authorized this app once before without a fresh consent prompt. In Google Account settings → Security → Third-party access, remove "Sokol Systems", then use the /api/auth/start link again.</p>`);
    }

    return res.end(`
      <div style="font-family:system-ui;max-width:640px;margin:60px auto;line-height:1.6">
        <h2>Drive access authorized.</h2>
        <p>Copy the value below into Vercel as the environment variable
        <code>GOOGLE_OAUTH_REFRESH_TOKEN</code>. This page will not show it again.</p>
        <textarea readonly style="width:100%;height:80px;font-family:monospace;padding:10px">${escapeHtml(data.refresh_token)}</textarea>
        <p>Once it's saved in Vercel, close this tab. Do not share this value anywhere else.</p>
      </div>
    `);
  } catch (e) {
    res.statusCode = 502;
    return res.end('<p>Unexpected error contacting Google. Try the link again.</p>');
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
