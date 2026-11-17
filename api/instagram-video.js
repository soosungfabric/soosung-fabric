// On-demand Instagram VIDEO playback URL; access token remains server-side.
// Keep the existing api/instagram.js unchanged.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query.id || '');
  if (!/^\d{5,40}$/.test(id)) return res.status(400).json({ error: 'Invalid media ID' });
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ error: 'Instagram token not configured' });

  // Both Meta Graph hosts are supported because the existing showroom may use
  // Instagram Login or Facebook Login. Neither endpoint exposes the token.
  const endpoints = [
    `https://graph.facebook.com/${id}`,
    `https://graph.instagram.com/${id}`
  ];
  for (const endpoint of endpoints) {
    try {
      const url = new URL(endpoint);
      url.searchParams.set('fields', 'id,media_type,media_url');
      url.searchParams.set('access_token', token);
      const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      const data = await response.json();
      if (response.ok && data.media_type === 'VIDEO' && typeof data.media_url === 'string' && data.media_url.startsWith('https://')) {
        res.setHeader('Cache-Control', 'public, s-maxage=60');
        return res.status(200).json({ videoUrl: data.media_url });
      }
    } catch (err) {
      console.error('Instagram video metadata request failed:', err.message);
    }
  }
  return res.status(404).json({ error: 'Video URL unavailable; open the Instagram post instead.' });
}
