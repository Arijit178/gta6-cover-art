// Wires Vice City Cover Studio: photos in, layout / caption / grade controls,
// a live canvas preview you can drag and zoom, undo/redo, and one-click PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { renderCover, exportCoverBlob, layoutRects } from './cover.js';
import { freshState, makeHistory, snapshotState, PRESETS, SIZES } from './state.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const stage = document.getElementById('dropzone');

let state = freshState();
const history = makeHistory(state);
let photos = []; // Loaded Image objects, in the order they were added.
let photoNames = [];

function redraw() {
  const [w, h] = SIZES[state.exportSize] ?? [1080, 1080];
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  renderCover(canvas, state, photos);
  syncControls();
}

function commit() {
  history.push(state);
  redraw();
}

function applySnapshot(snap) {
  state = snapshotState(snap);
  redraw();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function addPhotoFile(file) {
  const img = await loadImage(URL.createObjectURL(file));
  photos.push(img);
  photoNames.push(file.name.replace(/\.[^.]+$/, ''));
  renderThumbs();
  if (photos.length === 1) {
    for (const panel of state.panels) panel.photo = 0;
  }
  commit();
  status.textContent = `${photoNames.length} photo${photoNames.length === 1 ? '' : 's'} loaded — pick a layout and export.`;
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  photos.push(img);
  photoNames.push(name);
  renderThumbs();
  if (photos.length === 1) {
    for (const panel of state.panels) panel.photo = 0;
  }
  commit();
  status.textContent = `Sample “${name}” loaded.`;
}

function renderThumbs() {
  const box = document.getElementById('thumbs');
  box.innerHTML = '';
  photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = photoNames[i] ?? `Photo ${i + 1}`;
    thumb.title = photoNames[i] ?? `Photo ${i + 1}`;
    thumb.classList.toggle('active', state.panels[state.selectedPanel].photo === i);
    thumb.addEventListener('click', () => {
      state.panels[state.selectedPanel].photo = i;
      commit();
    });
    box.appendChild(thumb);
  });
}

function syncControls() {
  const panel = state.panels[state.selectedPanel];
  document.getElementById('panelName').textContent = String(state.selectedPanel + 1);
  document.getElementById('zoom').value = String(panel.zoom);
  document.getElementById('zoomVal').textContent = `${panel.zoom.toFixed(2)}×`;
  document.getElementById('panX').value = String(panel.ox);
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('titleFont').value = state.titleFont;
  document.getElementById('titleSize').value = String(state.titleSize);
  document.getElementById('titleColor').value = state.titleColor;
  document.getElementById('titlePlace').value = state.titlePlace;
  document.getElementById('outline').checked = state.outline;
  document.getElementById('shadow').checked = state.shadow;
  document.getElementById('showSubtitle').checked = state.showSubtitle;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  document.getElementById('halftone').checked = state.halftone;
  document.getElementById('fitFill').classList.toggle('active', panel.fit === 'fill');
  document.getElementById('fitFit').classList.toggle('active', panel.fit === 'fit');
  for (const btn of document.querySelectorAll('#layouts button')) btn.classList.toggle('active', btn.dataset.layout === state.layout);
  for (const btn of document.querySelectorAll('#grades button')) btn.classList.toggle('active', btn.dataset.grade === state.grade);
  for (const btn of document.querySelectorAll('#sizes button')) btn.classList.toggle('active', btn.dataset.size === state.exportSize);
  document.getElementById('undo').disabled = !history.canUndo();
  document.getElementById('redo').disabled = !history.canRedo();
  renderThumbs();
}

function bind(id, event, fn) {
  document.getElementById(id).addEventListener(event, fn);
}

bind('photo', 'change', async (e) => {
  for (const file of e.target.files) await addPhotoFile(file);
  e.target.value = '';
});
bind('sampleBoulevard', 'click', () => loadSample('boulevard'));
bind('samplePier', 'click', () => loadSample('pier'));

for (const btn of document.querySelectorAll('#layouts button')) {
  btn.addEventListener('click', () => { state.layout = btn.dataset.layout; commit(); });
}
for (const btn of document.querySelectorAll('#grades button')) {
  btn.addEventListener('click', () => { state.grade = btn.dataset.grade; commit(); });
}
for (const btn of document.querySelectorAll('#sizes button')) {
  btn.addEventListener('click', () => { state.exportSize = btn.dataset.size; commit(); });
}
for (const btn of document.querySelectorAll('#presets button')) {
  btn.addEventListener('click', () => {
    state.title = btn.dataset.title;
    state.subtitle = btn.dataset.subtitle;
    const preset = PRESETS.find((p) => p.title === btn.dataset.title);
    if (preset) { state.grade = preset.grade; state.layout = preset.layout; }
    commit();
    status.textContent = `Preset “${btn.dataset.title}” applied.`;
  });
}
for (const btn of document.querySelectorAll('[data-panel-photo]')) {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.panelPhoto);
    if (idx < photos.length) { state.panels[state.selectedPanel].photo = idx; commit(); }
    else status.textContent = `Add photo ${idx + 1} first — use Add photos or a sample.`;
  });
}
bind('title', 'input', (e) => { state.title = e.target.value; redraw(); });
bind('title', 'change', () => commit());
bind('subtitle', 'input', (e) => { state.subtitle = e.target.value; redraw(); });
bind('subtitle', 'change', () => commit());
bind('titleFont', 'change', (e) => { state.titleFont = e.target.value; commit(); });
bind('titleSize', 'input', (e) => { state.titleSize = Number(e.target.value); redraw(); });
bind('titleSize', 'change', () => commit());
bind('titleColor', 'change', (e) => { state.titleColor = e.target.value; commit(); });
bind('titlePlace', 'change', (e) => { state.titlePlace = e.target.value; commit(); });
bind('outline', 'change', (e) => { state.outline = e.target.checked; commit(); });
bind('shadow', 'change', (e) => { state.shadow = e.target.checked; commit(); });
bind('showSubtitle', 'change', (e) => { state.showSubtitle = e.target.checked; commit(); });
bind('grain', 'change', (e) => { state.grain = e.target.checked; commit(); });
bind('vignette', 'change', (e) => { state.vignette = e.target.checked; commit(); });
bind('halftone', 'change', (e) => { state.halftone = e.target.checked; commit(); });
bind('zoom', 'input', (e) => { state.panels[state.selectedPanel].zoom = Number(e.target.value); redraw(); });
bind('zoom', 'change', () => commit());
bind('panX', 'input', (e) => { state.panels[state.selectedPanel].ox = Number(e.target.value); redraw(); });
bind('panX', 'change', () => commit());
bind('fitFill', 'click', () => { state.panels[state.selectedPanel].fit = 'fill'; commit(); });
bind('fitFit', 'click', () => { state.panels[state.selectedPanel].fit = 'fit'; commit(); });
bind('undo', 'click', () => { const snap = history.undo(); if (snap) applySnapshot(snap); });
bind('redo', 'click', () => { const snap = history.redo(); if (snap) applySnapshot(snap); });
bind('reset', 'click', () => {
  state = freshState();
  for (const panel of state.panels) panel.photo = 0;
  commit();
  status.textContent = 'Cleared — fresh cover.';
});
bind('export', 'click', async () => {
  const [w, h] = SIZES[state.exportSize];
  status.textContent = `Exporting ${w} × ${h}…`;
  try {
    const blob = await exportCoverBlob(state, photos, w, h);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-city-cover-${w}x${h}.png`;
  } catch {
    status.textContent = 'Export failed — try adding a photo first.';
  }
});

// Drag-and-drop photos onto the preview.
stage.addEventListener('dragover', (e) => { e.preventDefault(); stage.classList.add('dragging'); });
stage.addEventListener('dragleave', () => stage.classList.remove('dragging'));
stage.addEventListener('drop', async (e) => {
  e.preventDefault();
  stage.classList.remove('dragging');
  for (const file of e.dataTransfer.files) {
    if (file.type.startsWith('image/')) await addPhotoFile(file);
  }
});

// Click a panel to select it; drag inside it to pan its photo; scroll to zoom it.
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const px = ((clientX - box.left) / box.width) * canvas.width;
  const py = ((clientY - box.top) / box.height) * canvas.height;
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  const used = state.layout === 'single' ? [0] : [0, 1, 2, 3];
  for (let k = used.length - 1; k >= 0; k--) {
    const i = used[k];
    const [x, y, w, h] = rects[i];
    if (px >= x && px <= x + w && py >= y && py <= y + h) return i;
  }
  return null;
}
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i === null) return;
  state.selectedPanel = i;
  dragging = { x: e.clientX, y: e.clientY, ox: state.panels[i].ox, oy: state.panels[i].oy };
  canvas.setPointerCapture(e.pointerId);
  syncControls();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const box = canvas.getBoundingClientRect();
  const panel = state.panels[state.selectedPanel];
  panel.ox = Math.max(-0.6, Math.min(0.6, dragging.ox + (e.clientX - dragging.x) / box.width));
  panel.oy = Math.max(-0.6, Math.min(0.6, dragging.oy + (e.clientY - dragging.y) / box.height));
  redraw();
});
canvas.addEventListener('pointerup', () => { if (dragging) { dragging = null; commit(); } });
let wheelCommitTimer = null;
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selectedPanel];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  redraw();
  clearTimeout(wheelCommitTimer);
  wheelCommitTimer = setTimeout(commit, 400);
}, { passive: false });

// Test / screenshot hook: the same export path the button uses, as a data URL.
window.__exportCover = async function exportForShot(sizeKey) {
  const [w, h] = SIZES[sizeKey] ?? SIZES[state.exportSize];
  const blob = await exportCoverBlob(state, photos, w, h);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: reader.result, width: w, height: h });
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px "Bebas Neue"'),
      document.fonts.load('20px Pacifico'),
      document.fonts.ready,
    ]);
  } catch { /* fall back to system fonts for the preview */ }
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  await loadFonts();
  await runShot(shot, query, async (scene) => {
    photos = [];
    photoNames = [];
    for (const name of scene.samples) {
      photos.push(await loadImage(`samples/${name}.jpg`));
      photoNames.push(name);
    }
    state.title = scene.title;
    state.subtitle = scene.subtitle;
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.exportSize = scene.size;
    // Spread the samples across the panels: panel 0 gets the first photo,
    // the rest alternate, so one photo fills the poster and two fill it in turn.
    state.panels.forEach((panel, i) => { panel.photo = photos.length > 1 ? i % photos.length : 0; });
    if (shot === 'editor') state.layout = 'grid';
    redraw();
  });
} else {
  await loadFonts();
  redraw();
}
