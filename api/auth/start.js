// Step 1 of the one-time Drive authorization: redirects Marinko to Google's
// consent screen. Visiting /api/auth/start is the "click one link" step.
export default function handler(req, res) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = `https://${req.headers.host}/api/auth/callback`;

  if (!clientId) {
    res.statusCode = 500;
    return res.end('GOOGLE_OAUTH_CLIENT_ID is not set in Vercel environment variables.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',   // required to receive a refresh_token
    prompt: 'consent',        // forces a refresh_token even on repeat authorizations
    scope: 'https://www.googleapis.com/auth/drive'
  });

  res.statusCode = 302;
  res.setHeader('Location', `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.end();
}
