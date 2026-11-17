// Vercel Serverless Function. Keep INSTAGRAM_ACCESS_TOKEN in Vercel environment variables.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ error: 'Instagram access token is not configured' });
  try {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}'; 
let next = `https://graph.facebook.com/v26.0/17841462395203093/media?fields=${encodeURIComponent(fields)}&limit=50&access_token=${encodeURIComponent(token)}`;
    const items = [];
    for (let page = 0; page < 4 && next; page++) {
      const response = await fetch(next, { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error?.message || `Instagram API HTTP ${response.status}`);
      items.push(...(data.data || []));
      next = data.paging?.next || null;
    }
    const posts = items.map(p => ({
      id: p.id, caption: p.caption || '', mediaType: p.media_type,
      image: p.media_type === 'VIDEO' ? (p.thumbnail_url || p.media_url) :
        p.media_type === 'CAROUSEL_ALBUM' ? (p.media_url || p.children?.data?.[0]?.media_url) : p.media_url,
      images: p.media_type === 'CAROUSEL_ALBUM' ? (p.children?.data || []).filter(c => c.media_url || c.thumbnail_url).map(c => c.media_url || c.thumbnail_url) : [],
      permalink: p.permalink, timestamp: p.timestamp
    })).filter(p => p.image);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=60');
    return res.status(200).json({ posts });
  } catch (err) {
    console.error('Instagram API failed:', err.message);
    return res.status(502).json({ error: 'Unable to load Instagram posts. Check token validity and API permissions.' });
  }
}
