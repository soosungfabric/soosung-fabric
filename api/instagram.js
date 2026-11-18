// SOOSUNG FABRIC — Instagram feed for Meta Unified / Facebook Login (EAA tokens).
// Only the server reads the token. Never add the token to GitHub.
const IG_USER_ID = '17841462395203093'; // ID shown for @soosung_fabric in Meta's app setup
const GRAPH_VERSION = 'v26.0';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
  if (!token) return res.status(503).json({ error: 'INSTAGRAM_ACCESS_TOKEN is not configured' });

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}';
  const firstUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${IG_USER_ID}/media`);
  firstUrl.searchParams.set('fields', fields);
  firstUrl.searchParams.set('limit', '50');
  firstUrl.searchParams.set('access_token', token);

  const items = [];
  let next = firstUrl.toString();

  try {
    for (let page = 0; page < 4 && next; page++) {
      const response = await fetch(next, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        const e = data.error || {};
        // Do not log token-bearing request URLs or return access tokens.
        console.error('Instagram API failed:', e.message || `HTTP ${response.status}`,
          'code:', e.code ?? 'unknown', 'subcode:', e.error_subcode ?? 'none');
        return res.status(502).json({
          error: 'Unable to load Instagram posts.',
          metaCode: e.code ?? null,
          metaSubcode: e.error_subcode ?? null,
          detail: String(e.message || `HTTP ${response.status}`).slice(0, 250)
        });
      }
      items.push(...(Array.isArray(data.data) ? data.data : []));
      next = typeof data.paging?.next === 'string' ? data.paging.next : null;
    }

    const posts = items.map(p => ({
      id: p.id,
      caption: p.caption || '',
      mediaType: p.media_type,
      image: p.media_type === 'VIDEO'
        ? (p.thumbnail_url || p.media_url)
        : p.media_type === 'CAROUSEL_ALBUM'
          ? (p.media_url || p.children?.data?.[0]?.media_url)
          : p.media_url,
      images: p.media_type === 'CAROUSEL_ALBUM'
        ? (p.children?.data || []).filter(c => c.media_url || c.thumbnail_url)
          .map(c => c.media_url || c.thumbnail_url)
        : [],
      permalink: p.permalink,
      timestamp: p.timestamp
    })).filter(p => p.image);

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, must-revalidate');
    return res.status(200).json({ posts });
  } catch (err) {
    console.error('Instagram request failed:', err?.message || 'Unknown error');
    return res.status(502).json({ error: 'Unable to load Instagram posts.', detail: 'Network or response error' });
  }
}
