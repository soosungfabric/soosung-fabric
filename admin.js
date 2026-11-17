// Static editor: edits are local until the exported JSON and image files are uploaded to GitHub.
const cats = [
  {key:'knit', label:'KNIT FABRIC'}, {key:'jersey', label:'SINGLE JERSEY'},
  {key:'woven', label:'WOVEN'}, {key:'etc', label:'ETC'}
];
let settings = {covers:{}, assignments:{}, hero:{mode:'original',image:'',position:'center'}};
let posts = [];
const pendingCoverFiles = {};
const localPreviews = {};
let pendingHeroFile = null;
let heroPreviewUrl = null;
const HERO_MODES = ['original','photo','plain','hidden'];
const HERO_POSITIONS = ['center','left','right','top','bottom'];
const $ = selector => document.querySelector(selector);
function validPath(url) {
  return /^(https:\/\/|[a-zA-Z0-9][a-zA-Z0-9._/-]*$)/.test(url) && !url.includes('..');
}
function inferCategory(caption) {
  const t = String(caption || '').toLowerCase();
  if (/#(?:single_?jersey|jersey|싱글)(?![\w가-힣])/.test(t)) return 'jersey';
  if (/#(?:woven|twill|poplin|트윌|평직)(?![\w가-힣])/.test(t)) return 'woven';
  if (/#(?:knit|jacquard|니트|자카드)(?![\w가-힣])/.test(t)) return 'knit';
  if (/#(?:etc|기타)(?![\w가-힣])/.test(t)) return 'etc';
  if (/single jersey|jersey|싱글|쭈리|쮸리/.test(t)) return 'jersey';
  if (/woven|twill|poplin|plain weave|직물|트윌|평직/.test(t)) return 'woven';
  if (/jacquard|knit|니트|자카드|스웨터/.test(t)) return 'knit';
  return 'etc';
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function getHeroSettings() {
  const raw = settings.hero && typeof settings.hero === 'object' ? settings.hero : {};
  return {
    mode: HERO_MODES.includes(raw.mode) ? raw.mode : 'original',
    image: typeof raw.image === 'string' && validPath(raw.image) ? raw.image : '',
    position: HERO_POSITIONS.includes(raw.position) ? raw.position : 'center'
  };
}
function renderHeroEditor() {
  const hero = getHeroSettings();
  $('#heroMode').value = hero.mode;
  $('#heroPath').value = hero.image;
  $('#heroPosition').value = hero.position;
  updateHeroPreview();
}
function updateHeroPreview() {
  const mode = $('#heroMode').value;
  const path = $('#heroPath').value.trim();
  const preview = $('#heroPreview');
  const help = $('#heroHelp');
  const photoFields = $('#heroPhotoFields');
  photoFields.hidden = mode !== 'photo';
  preview.className = 'admin-hero-preview mode-' + mode;
  preview.style.backgroundImage = '';
  preview.style.backgroundPosition = $('#heroPosition').value;
  if (mode === 'photo') {
    const src = heroPreviewUrl || (validPath(path) ? path : '');
    if (src) preview.style.backgroundImage = `linear-gradient(90deg,rgba(36,29,23,.54),rgba(36,29,23,.05)),url(${JSON.stringify(src)})`;
    $('#heroPreviewText').textContent = src ? 'FABRIC FOR A BRIGHTER TOMORROW' : '배너 사진을 선택하세요';
    help.textContent = pendingHeroFile ? `선택된 파일: ${pendingHeroFile.filename} · 배너 사진 다운로드 후 GitHub에 올려주세요.` : 'GitHub에 이미 올린 사진은 이미지 경로만 입력해도 됩니다.';
  } else if (mode === 'plain') {
    $('#heroPreviewText').textContent = 'FABRIC FOR A BRIGHTER TOMORROW';
  } else if (mode === 'hidden') {
    $('#heroPreviewText').textContent = '메인 배너를 숨깁니다. 카테고리가 바로 표시됩니다.';
  } else {
    $('#heroPreviewText').textContent = '기존 메인 배너 디자인 유지';
  }
}
$('#heroMode').addEventListener('change', updateHeroPreview);
$('#heroPosition').addEventListener('change', updateHeroPreview);
$('#heroPath').addEventListener('input', () => {
  // Manually typed paths should preview the entered file, not an earlier local selection.
  if (pendingHeroFile && $('#heroPath').value.trim() !== pendingHeroFile.filename) {
    pendingHeroFile = null;
    $('#downloadHero').disabled = true;
    if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl);
    heroPreviewUrl = null;
  }
  updateHeroPreview();
});
$('#heroFile').addEventListener('change', () => {
  const file = $('#heroFile').files?.[0];
  if (!file) return;
  const extensions = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  const ext = extensions[file.type];
  if (!ext || file.size > 10 * 1024 * 1024) {
    alert('10MB 이하의 JPG, PNG 또는 WEBP 사진을 선택하세요.');
    $('#heroFile').value = ''; return;
  }
  const filename = `hero-banner.${ext}`;
  pendingHeroFile = {file,filename};
  if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl);
  heroPreviewUrl = URL.createObjectURL(file);
  $('#heroPath').value = filename;
  $('#heroMode').value = 'photo';
  $('#downloadHero').disabled = false;
  updateHeroPreview();
});
$('#downloadHero').addEventListener('click', () => {
  if (pendingHeroFile) downloadBlob(pendingHeroFile.file, pendingHeroFile.filename);
});
function coverCard(cat) {
  const box = document.createElement('section'); box.className = 'admin-cover';
  const img = document.createElement('img'); img.alt = cat.label + ' 대표 이미지 미리보기';
  img.src = settings.covers[cat.key] || 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="250"><rect width="100%" height="100%" fill="#ded3c3"/><text x="50%" y="50%" text-anchor="middle" fill="#776b5e" font-size="20">대표 사진 미설정</text></svg>');
  const h = document.createElement('h3'); h.textContent = cat.label;
  const fileLabel = document.createElement('label'); fileLabel.textContent = '새 이미지 선택 (JPG / PNG / WEBP)';
  const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/jpeg,image/png,image/webp';
  const pathLabel = document.createElement('label'); pathLabel.textContent = 'GitHub 이미지 경로';
  const path = document.createElement('input'); path.type = 'text'; path.value = settings.covers[cat.key] || ''; path.placeholder = 'cover-' + cat.key + '.jpg';
  const download = document.createElement('button'); download.className = 'admin-secondary'; download.textContent = '대표 이미지 다운로드'; download.disabled = true;
  const note = document.createElement('p'); note.className = 'admin-muted'; note.textContent = '선택한 이미지를 저장한 뒤 GitHub에 함께 업로드하세요.';
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]; if (!file) return;
    const extensions = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
    const ext = extensions[file.type];
    if (!ext || file.size > 10*1024*1024) { alert('JPG, PNG, WEBP 형식의 10MB 이하 이미지를 선택하세요.'); fileInput.value = ''; return; }
    const filename = `cover-${cat.key}.${ext}`;
    pendingCoverFiles[cat.key] = {file,filename};
    settings.covers[cat.key] = filename; path.value = filename;
    if (localPreviews[cat.key]) URL.revokeObjectURL(localPreviews[cat.key]);
    localPreviews[cat.key] = URL.createObjectURL(file);
    img.src = localPreviews[cat.key]; download.disabled = false;
    note.textContent = `파일명: ${filename} · 다운로드 후 GitHub에 업로드해야 합니다.`;
  });
  path.addEventListener('change', () => {
    const value = path.value.trim();
    if (value && !validPath(value)) { alert('GitHub 파일 경로 또는 https:// 이미지 주소만 입력하세요.'); path.value = settings.covers[cat.key] || ''; return; }
    if (value) settings.covers[cat.key] = value; else delete settings.covers[cat.key];
    if (value && !pendingCoverFiles[cat.key]) img.src = value;
  });
  download.addEventListener('click', () => {
    const entry = pendingCoverFiles[cat.key]; if (entry) downloadBlob(entry.file, entry.filename);
  });
  box.append(img,h,fileLabel,fileInput,pathLabel,path,download,note);
  return box;
}
function renderCovers() {
  const target = $('#adminCovers'); target.replaceChildren();
  cats.forEach(cat => target.append(coverCard(cat)));
}
function renderPosts() {
  const q = $('#adminSearch').value.toLowerCase().trim();
  const filter = $('#adminFilter').value;
  const target = $('#adminPosts'); target.replaceChildren();
  const filtered = posts.filter(post => {
    const cat = settings.assignments[String(post.id)] || inferCategory(post.caption);
    return (filter === 'all' || cat === filter) && String(post.caption || '').toLowerCase().includes(q);
  });
  for (const post of filtered) {
    const card = document.createElement('article'); card.className = 'admin-post';
    const img = document.createElement('img'); img.src = post.image; img.loading = 'lazy'; img.alt = '인스타그램 원단 사진';
    const caption = document.createElement('p'); caption.textContent = post.caption || '설명 없음';
    const small = document.createElement('small'); small.textContent = '게시물 ID: ' + post.id;
    const select = document.createElement('select'); select.setAttribute('aria-label','게시물 카테고리');
    const choices = [{key:'auto',label:'자동 분류 (' + inferCategory(post.caption).toUpperCase() + ')'},...cats];
    choices.forEach(item => {const option=document.createElement('option'); option.value=item.key; option.textContent=item.label; select.append(option);});
    select.value = settings.assignments[String(post.id)] || 'auto';
    select.addEventListener('change', () => {
      if (select.value === 'auto') delete settings.assignments[String(post.id)];
      else settings.assignments[String(post.id)] = select.value;
      if ($('#adminFilter').value !== 'all') renderPosts();
    });
    const link = document.createElement('a'); link.textContent = '인스타그램 원본 보기';
    link.href = /^https:\/\/www\.instagram\.com\//.test(post.permalink || '') ? post.permalink : 'https://www.instagram.com/soosung_fabric/';
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    card.append(img,caption,small,select,link); target.append(card);
  }
  $('#adminStatus').textContent = `총 ${posts.length}개 중 ${filtered.length}개 표시 · 직접 분류 ${Object.keys(settings.assignments).length}개`;
}
async function init() {
  try {
    const response = await fetch('/category-config.json', {cache:'no-store'});
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        settings.covers = data.covers && typeof data.covers === 'object' ? {...data.covers} : {};
        settings.assignments = data.assignments && typeof data.assignments === 'object' ? {...data.assignments} : {};
        settings.hero = data.hero && typeof data.hero === 'object' ? {...data.hero} : {mode:'original',image:'',position:'center'};
      }
    }
  } catch (e) { console.warn('No saved settings found:', e); }
  renderHeroEditor();
  renderCovers();
  try {
    const response = await fetch('/api/instagram');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    posts = Array.isArray(data.posts) ? data.posts.filter(p => p && p.id && p.image) : [];
    renderPosts();
  } catch (error) {
    $('#adminStatus').textContent = '게시물을 불러오지 못했습니다. /api/instagram 연동 상태를 확인하세요.';
    console.error(error);
  }
}
$('#adminSearch').addEventListener('input', renderPosts);
$('#adminFilter').addEventListener('change', renderPosts);
$('#downloadConfig').addEventListener('click', () => {
  for (const cat of cats) {
    const input = [...document.querySelectorAll('.admin-cover')][cats.indexOf(cat)]?.querySelector('input[type=text]');
    if (!input) continue;
    const value = input.value.trim();
    if (value && !validPath(value)) { alert(cat.label + ' 이미지 경로를 확인하세요.'); return; }
    if (value) settings.covers[cat.key] = value; else delete settings.covers[cat.key];
  }
  const hero = {
    mode: $('#heroMode').value,
    image: $('#heroPath').value.trim(),
    position: $('#heroPosition').value
  };
  if (!HERO_MODES.includes(hero.mode) || !HERO_POSITIONS.includes(hero.position)) { alert('배너 설정을 확인하세요.'); return; }
  if (hero.mode === 'photo' && (!hero.image || !validPath(hero.image))) { alert('배너 사진을 선택하거나 올바른 이미지 경로를 입력하세요.'); return; }
  if (hero.image && !validPath(hero.image)) { alert('배너 이미지 경로를 확인하세요.'); return; }
  const clean = {covers:{},assignments:{},hero};
  for (const cat of cats) if (settings.covers[cat.key]) clean.covers[cat.key] = settings.covers[cat.key];
  for (const [id,cat] of Object.entries(settings.assignments)) if (/^\d{5,40}$/.test(id) && cats.some(c => c.key === cat)) clean.assignments[id] = cat;
  downloadBlob(new Blob([JSON.stringify(clean,null,2)+'\n'],{type:'application/json;charset=utf-8'}),'category-config.json');
  if (Object.keys(pendingCoverFiles).length || (hero.mode === 'photo' && pendingHeroFile)) alert('설정 파일을 다운로드했습니다. 선택한 사진도 각각 다운로드한 뒤 사진 파일과 JSON 파일을 GitHub에 업로드하세요.');
});
init();
