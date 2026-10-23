// Google Drive helpers shared by the onboarding webhook and the client portal.
// Files in api/_lib are not endpoints (Vercel skips paths that start with an underscore).
// Env: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN.

export function driveReady(env = process.env) {
  return Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET && env.GOOGLE_OAUTH_REFRESH_TOKEN);
}

export async function googleToken(env = process.env) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GOOGLE_OAUTH_CLIENT_ID, client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET, refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN, grant_type: 'refresh_token' })
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Google token refresh failed: ' + (j.error_description || j.error));
  return j.access_token;
}

export async function driveFolder(token, name, parent) {
  const r = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink&supportsAllDrives=true', {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parent] })
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Drive folder create failed: ' + JSON.stringify(j.error || j));
  return j;
}

export async function driveShare(token, fileId, email) {
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false&supportsAllDrives=true`, {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'user', role: 'writer', emailAddress: email })
  });
  if (!r.ok) throw new Error('Drive share failed: ' + (await r.text()));
}

// A brand gets its own folder inside the client's shared folder, with the same two
// subfolders every client already knows. Sharing is inherited from the client's folder.
export async function brandFolders(token, brandName, clientFolderId) {
  const folder = await driveFolder(token, brandName, clientFolderId);
  await driveFolder(token, 'Brand Assets', folder.id);
  await driveFolder(token, 'Deliveries', folder.id);
  return folder;
}

// Folder names can't hold slashes cleanly and shouldn't carry control characters.
export function folderName(s) {
  return String(s || '').replace(/[\u0000-\u001F\u007F/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Brand';
}

export function folderIdFromUrl(url) {
  const m = /\/folders\/([A-Za-z0-9_-]{10,})/.exec(String(url || ''));
  return m ? m[1] : null;
}
