/* ============================================================
   发布作品：选图 / 预览 / 压缩 / 发布到画廊
   ============================================================ */

let pickedFile = null;
let pickedRatio = 1;

const fCat = document.getElementById('fCat');
fCat.innerHTML =
  getCats().map(c => `<option>${c}</option>`).join('') +
  '<option value="__custom">✚ 自定义分类…</option>';

/* 选了「自定义分类」就展开输入框 */
fCat.addEventListener('change', () => {
  const custom = fCat.value === '__custom';
  document.getElementById('fCatCustom').style.display = custom ? 'block' : 'none';
  if (custom) document.getElementById('fCatCustomInput').focus();
});

const dz = document.getElementById('dropzone');
const fi = document.getElementById('fileInput');

dz.addEventListener('click', () => fi.click());
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('over'));
dz.addEventListener('drop', e => {
  e.preventDefault();
  dz.classList.remove('over');
  if (e.dataTransfer.files[0]) useFile(e.dataTransfer.files[0]);
});
fi.addEventListener('change', () => {
  if (fi.files[0]) useFile(fi.files[0]);
});

function useFile(file) {
  if (!/^image\//.test(file.type)) return toast('请选一张图片');
  pickedFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    pickedRatio = img.naturalWidth / img.naturalHeight;
    document.getElementById('previewImg').src = url;
    document.getElementById('previewBox').style.display = 'block';
    dz.style.display = 'none';
  };
  img.src = url;
}

function resetFile() {
  pickedFile = null;
  fi.value = '';
  document.getElementById('previewBox').style.display = 'none';
  dz.style.display = 'block';
}

/* 压缩成适合 localStorage 的尺寸，返回 dataURL */
function compress(file, maxDim) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.8));
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ---------- 最近挂上墙的 ---------- */
(function () {
  const grid = document.getElementById('recentGrid');
  if (!grid) return;
  const list = [...getWorks()].sort((a, b) => (b.ts < a.ts ? -1 : 1)).slice(0, 8);
  grid.innerHTML = list.map(w => `
    <a class="l-card" href="artwork.html?id=${w.id}">
      <img src="${w.src}" alt="${esc(w.title)}" loading="lazy">
      <div class="info">
        <div class="t">${esc(w.title)}</div>
        <div class="m"><span>${esc(w.author)}</span><span class="tag">${esc(w.cat)}</span><span class="lk">❤ ${w.likes}</span></div>
      </div>
    </a>`).join('');
})();

async function publish() {
  const btn = document.getElementById('publishBtn');
  const title = document.getElementById('fTitle').value.trim();
  const tags = document.getElementById('fTags').value.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  const agree = document.getElementById('fAgree').checked;

  if (!mustLogin('发布作品')) return;
  if (!title) return toast('给作品起个标题');
  if (!pickedFile) return toast('先选一张图');
  if (!agree) return toast('需要同意开放共享与二创才能发布');

  let cat = document.getElementById('fCat').value;
  if (cat === '__custom') {
    cat = document.getElementById('fCatCustomInput').value.trim();
    if (!cat) return toast('给自定义分类起个名字');
    if (cat.length > 10) return toast('分类名别超过 10 个字');
    addCat(cat);   /* 新分类记进 localStorage，画廊分类图卡同步出现 */
  }

  btn.disabled = true;
  btn.textContent = '压缩上传中…';
  try {
    const dataUrl = await compress(pickedFile, 1400);
    const w = addWork({
      title, src: dataUrl, author: getUser().name,
      cat, tags: tags.length ? tags : [cat], ratio: pickedRatio,
    });
    toast('发布成功！去看看你的作品');
    setTimeout(() => { location.href = 'artwork.html?id=' + w.id; }, 800);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = '✚ 发布到画廊';
    toast('图片处理失败，换一张试试');
  }
}
