// SOOSUNG FABRIC Instagram gallery. Never place your access token in this file.
const grid = document.querySelector('#grid');
const search = document.querySelector('#searchInput');
const result = document.querySelector('#resultText');
const modal = document.querySelector('#modal');
let fabrics = [];
let current = 'all';
let activeImages = [];
let activeImageIndex = 0;
let showroomConfig = { covers: {}, assignments: {} };
const CATEGORY_KEYS = ['knit', 'jersey', 'woven', 'etc'];

function normalizeConfig(data) {
  const covers = {};
  const assignments = {};
  for (const key of CATEGORY_KEYS) {
    const url = data?.covers?.[key];
    if (typeof url === 'string' && /^(https:\/\/|[a-zA-Z0-9][a-zA-Z0-9._/-]*$)/.test(url) && !url.includes('..')) covers[key] = url;
  }
  if (data?.assignments && typeof data.assignments === 'object') {
    for (const [id, cat] of Object.entries(data.assignments)) {
      if (/^\d{5,40}$/.test(id) && CATEGORY_KEYS.includes(cat)) assignments[id] = cat;
    }
  }
  return { covers, assignments };
}

function applyCategoryCovers() {
  document.querySelectorAll('.categories .cat[data-filter]').forEach(button => {
    const url = showroomConfig.covers[button.dataset.filter];
    button.classList.toggle('has-cover', !!url);
    if (url) button.style.setProperty('--cover-image', `url(${JSON.stringify(url)})`);
    else button.style.removeProperty('--cover-image');
  });
}

async function loadShowroomConfig() {
  try {
    const response = await fetch('/category-config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Config HTTP ${response.status}`);
    showroomConfig = normalizeConfig(await response.json());
  } catch (error) {
    console.warn('Using default category settings:', error);
    showroomConfig = { covers: {}, assignments: {} };
  }
  applyCategoryCovers();
}


function category(caption) {
  const t = caption.toLowerCase();
  // Explicit tags take priority over incidental words in captions.
  if (/#(?:single_?jersey|jersey|싱글)(?![\w가-힣])/.test(t)) return 'jersey';
  if (/#(?:woven|twill|poplin|트윌|평직)(?![\w가-힣])/.test(t)) return 'woven';
  if (/#(?:knit|jacquard|니트|자카드)(?![\w가-힣])/.test(t)) return 'knit';
  if (/#(?:etc|기타)(?![\w가-힣])/.test(t)) return 'etc';
  if (/single jersey|jersey|싱글|쭈리|쮸리/.test(t)) return 'jersey';
  if (/woven|twill|poplin|plain weave|직물|트윌|평직/.test(t)) return 'woven';
  if (/jacquard|knit|니트|자카드|스웨터/.test(t)) return 'knit';
  return 'etc';
}
function safeText(value) { return String(value || ''); }
function render() {
  const q = (search?.value || '').toLowerCase().trim();
  const rows = fabrics.filter(f => (current === 'all' || f.cat === current) && `${f.name} ${f.desc}`.toLowerCase().includes(q));
  grid.replaceChildren();
  for (const f of rows) {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundImage = `url(${JSON.stringify(f.image)})`;
    swatch.style.backgroundSize = 'cover';
    swatch.style.backgroundPosition = 'center';
    const heading = document.createElement('h3');
    heading.textContent = f.name;
    const desc = document.createElement('p');
    desc.textContent = f.desc;
    card.append(swatch, heading, desc);
    card.addEventListener('click', () => openFabric(f));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFabric(f); } });
    grid.append(card);
  }
  if (result) result.textContent = `${rows.length} fabric${rows.length === 1 ? '' : 's'} shown`;
}
function showModalImage() {
  const el = document.querySelector('#modalImage');
  if (!el) return;
  el.style.backgroundImage = `url(${JSON.stringify(activeImages[activeImageIndex])})`;
  el.style.backgroundColor = '#f2f0eb';
  el.style.backgroundSize = 'contain';
  el.style.backgroundPosition = 'center';
  el.style.backgroundRepeat = 'no-repeat';
  let counter = document.querySelector('#igImageCounter');
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'igImageCounter';
    counter.style.cssText = 'text-align:center;padding:8px;font-size:12px;';
    el.insertAdjacentElement('afterend', counter);
  }
  counter.textContent = activeImages.length > 1 ? `${activeImageIndex + 1} / ${activeImages.length}  ·  ← → 키로 이동` : '';
}
function openFabric(f) {
  activeImages = f.images.length ? f.images : [f.image];
  activeImageIndex = 0;
  showModalImage();
  const set = (sel, value) => { const el = document.querySelector(sel); if (el) el.textContent = value; };
  set('#modalCat', f.cat.toUpperCase());
  set('#modalName', f.name);
  set('#modalCode', f.date);
  set('#modalDesc', f.desc);
  let link = document.querySelector('#igOriginalLink');
  if (!link) {
    link = document.createElement('a');
    link.id = 'igOriginalLink';
    link.textContent = 'Instagram 원본 게시물 보기 ↗';
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.style.cssText = 'display:inline-block;margin:12px 0;text-decoration:underline;';
    document.querySelector('#modalDesc')?.insertAdjacentElement('afterend', link);
  }
  link.href = f.permalink || 'https://www.instagram.com/soosung_fabric/';
  modal?.classList.add('open');
}
document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => {
  current = b.dataset.filter;
  document.querySelectorAll('.filters button').forEach(x => x.classList.toggle('active', x.dataset.filter === current));
  document.querySelector('#lookbook')?.scrollIntoView({ behavior: 'smooth' });
  render();
}));
search?.addEventListener('input', render);
document.querySelector('#closeModal')?.addEventListener('click', () => modal?.classList.remove('open'));
modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
document.addEventListener('keydown', e => {
  if (!modal?.classList.contains('open')) return;
  if (e.key === 'Escape') modal.classList.remove('open');
  if (activeImages.length > 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    activeImageIndex = (activeImageIndex + (e.key === 'ArrowRight' ? 1 : -1) + activeImages.length) % activeImages.length;
    showModalImage();
  }
});
async function loadInstagram() {
  if (result) result.textContent = 'Instagram 사진을 불러오는 중…';
  try {
    const response = await fetch('/api/instagram');
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    fabrics = (data.posts || []).filter(p => p && p.id && p.image).map((p, i) => {
      const desc = safeText(p.caption).trim();
      return {
        code: p.id, name: desc.split('\n').find(Boolean)?.slice(0, 65) || `Instagram Post ${i + 1}`,
        cat: showroomConfig.assignments[String(p.id)] || category(desc), desc: desc.slice(0, 240) || 'SOOSUNG FABRIC',
        image: p.image, images: p.images || [], permalink: p.permalink,
        date: p.timestamp ? new Date(p.timestamp).toLocaleDateString('ko-KR') : ''
      };
    });
    render();
    if (!fabrics.length && result) result.textContent = '표시할 Instagram 게시물이 없습니다.';
  } catch (e) {
    console.error('Instagram gallery:', e);
    grid.replaceChildren();
    if (result) result.textContent = 'Instagram 사진을 불러오지 못했습니다. 관리자에게 문의해 주세요.';
  }
}
// Load manual settings before fetching posts so overrides apply immediately.
loadShowroomConfig().then(loadInstagram);
