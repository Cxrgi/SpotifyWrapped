// exchange.js - Proxy für Spotify Token Endpoint (Vercel / Netlify compatible)
export default async function handler(req, res) {
  // CORS: erlauben, was von GitHub Pages / localhost / Vercel kommt
  const origin = req.headers.origin || '';
  if (origin && (origin.endsWith('.github.io') || origin.includes('localhost') || origin.includes('vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://cxrgi.github.io');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, refresh_token, redirect_uri, code_verifier } = req.body || {};
    const params = new URLSearchParams();

    if (refresh_token) {
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refresh_token);
    } else {
      if (!code) return res.status(400).json({ error: 'Missing code' });
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      if (redirect_uri) params.append('redirect_uri', redirect_uri);
      if (code_verifier) params.append('code_verifier', code_verifier);
    }

    // CLIENT_ID ist für PKCE nötig:
    if (process.env.CLIENT_ID) params.append('client_id', process.env.CLIENT_ID);

    // Bereite Headers vor. Wenn CLIENT_SECRET gesetzt ist, nutze Basic Auth.
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (process.env.CLIENT_SECRET) {
      // prefer Basic auth when client secret exists (confidential client)
      const basic = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
      headers['Authorization'] = `Basic ${basic}`;
      // don't append client_secret in body
    }

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers,
      body: params.toString(),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('Spotify token error', tokenRes.status, data);
      return res.status(tokenRes.status).json({ error: data.error || 'token_error', details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Exchange proxy error', err);
    return res.status(500).json({ error: 'internal_server_error', details: err.message || err });
  }
}
