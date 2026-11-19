// Renders a cover onto any 2D canvas at its own size: multi-panel layouts, a colour
// grade, grain / vignette / halftone finish, and bold caption lettering. Pure drawing —
// the same function paints the live preview and the exported PNG, so what you see is
// exactly what the file holds.

const GRADES = {
  sunset: { wash: ['rgba(255,94,98,0.20)', 'rgba(255,149,0,0.16)', 'rgba(123,47,247,0.22)'], filter: 'saturate(1.25) contrast(1.06)', glow: '#ff5e62' },
  neon: { wash: ['rgba(255,46,136,0.36)', 'rgba(25,227,214,0.28)', 'rgba(123,47,247,0.32)'], filter: 'saturate(1.5) contrast(1.12)', glow: '#ff2e88' },
  golden: { wash: ['rgba(255,176,46,0.26)', 'rgba(255,120,40,0.14)', 'rgba(255,220,120,0.10)'], filter: 'saturate(1.2) contrast(1.05)', glow: '#ffb02e' },
  noir: { wash: ['rgba(10,10,20,0.28)', 'rgba(120,140,180,0.10)', 'rgba(0,0,0,0.30)'], filter: 'grayscale(1) contrast(1.18) brightness(1.04)', glow: '#e8e8f0' },
};

const TITLE_COLORS = {
  white: ['#ffffff', '#ffffff'],
  sunset: ['#ffe259', '#ff2e88'],
  neon: ['#19e3d6', '#ff2e88'],
  gold: ['#fff3b0', '#ffb02e'],
  black: ['#14101c', '#14101c'],
};

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const t = document.createElement('canvas');
  t.width = 128; t.height = 128;
  const c = t.getContext('2d');
  const data = c.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 155);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
  }
  c.putImageData(data, 0, 0);
  noiseTile = t;
  return t;
}

/** Panel rectangles for a layout, in canvas pixels: [x, y, w, h, rotation]. */
export function layoutRects(layout, w, h) {
  const gap = Math.round(Math.min(w, h) * 0.018);
  const outer = Math.round(Math.min(w, h) * 0.022);
  const innerW = w - outer * 2;
  const innerH = h - outer * 2;
  if (layout === 'single') return [[outer, outer, innerW, innerH, 0]];
  if (layout === 'hero') {
    const heroH = Math.round(innerH * 0.60);
    const smallH = innerH - heroH - gap;
    const smallW = Math.round((innerW - gap * 2) / 3);
    return [
      [outer, outer, innerW, heroH, 0],
      [outer, outer + heroH + gap, smallW, smallH, 0],
      [outer + smallW + gap, outer + heroH + gap, smallW, smallH, 0],
      [outer + (smallW + gap) * 2, outer + heroH + gap, smallW, smallH, 0],
    ];
  }
  if (layout === 'collage') {
    const pw = Math.round(innerW * 0.46);
    const ph = Math.round(innerH * 0.46);
    return [
      [outer + innerW * 0.02, outer + innerH * 0.02, pw, ph, -0.05],
      [outer + innerW * 0.50, outer + innerH * 0.01, pw, ph, 0.045],
      [outer + innerW * 0.05, outer + innerH * 0.50, pw, ph, 0.04],
      [outer + innerW * 0.47, outer + innerH * 0.51, pw, ph, -0.035],
    ];
  }
  // grid: 2 x 2
  const cw = Math.round((innerW - gap) / 2);
  const ch = Math.round((innerH - gap) / 2);
  return [
    [outer, outer, cw, ch, 0],
    [outer + cw + gap, outer, cw, ch, 0],
    [outer, outer + ch + gap, cw, ch, 0],
    [outer + cw + gap, outer + ch + gap, cw, ch, 0],
  ];
}

/** Draws one photo into a rectangle, honouring the panel's zoom, pan and fit. */
function drawPanelPhoto(ctx, img, rect, panel, grade) {
  const [x, y, pw, ph, rot] = rect;
  ctx.save();
  ctx.translate(x + pw / 2, y + ph / 2);
  if (rot) ctx.rotate(rot);
  ctx.translate(-pw / 2, -ph / 2);
  ctx.beginPath();
  ctx.rect(0, 0, pw, ph);
  ctx.clip();
  if (panel.fit === 'fit') {
    const scale = Math.min(pw / img.naturalWidth, ph / img.naturalHeight) * panel.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.filter = grade.filter;
    ctx.drawImage(img, (pw - dw) / 2 + panel.ox * pw, (ph - dh) / 2 + panel.oy * ph, dw, dh);
  } else {
    // Fill: crop the overflow, anchoring toward the top third of the photo so
    // faces (usually in the upper half) survive wide panels; oy still pans.
    const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * panel.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.filter = grade.filter;
    ctx.drawImage(img, (pw - dw) / 2 + panel.ox * pw, (ph - dh) * 0.32 + panel.oy * ph, dw, dh);
  }
  ctx.filter = 'none';
  ctx.restore();
}

function drawHalftone(ctx, w, h, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const step = Math.max(14, Math.round(Math.min(w, h) / 64));
  ctx.fillStyle = '#000000';
  for (let yy = step / 2; yy < h; yy += step) {
    for (let xx = step / 2; xx < w; xx += step) {
      ctx.beginPath();
      ctx.arc(xx, yy, step * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCaption(ctx, state, w, h, grade) {
  const title = state.title.trim();
  const sub = state.showSubtitle ? state.subtitle.trim() : '';
  if (!title && !sub) return;
  const base = Math.min(w, h);
  const place = state.titlePlace;
  const bandH = h * (place === 'center' ? 0.5 : 0.34);
  const bandY = place === 'top' ? 0 : place === 'center' ? (h - bandH) / 2 : h - bandH;
  // A dark-to-clear wash behind the words so they read on any photo.
  const wash = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (place === 'top') { wash.addColorStop(0, 'rgba(10,5,25,0.72)'); wash.addColorStop(1, 'rgba(10,5,25,0)'); }
  else if (place === 'center') { wash.addColorStop(0, 'rgba(10,5,25,0)'); wash.addColorStop(0.5, 'rgba(10,5,25,0.55)'); wash.addColorStop(1, 'rgba(10,5,25,0)'); }
  else { wash.addColorStop(0, 'rgba(10,5,25,0)'); wash.addColorStop(1, 'rgba(10,5,25,0.78)'); }
  ctx.fillStyle = wash;
  ctx.fillRect(0, bandY, w, bandH);

  const cx = w / 2;
  let textY;
  if (place === 'top') textY = bandY + h * 0.16;
  else if (place === 'center') textY = h * 0.52;
  else textY = h - h * 0.075 - (sub ? base * 0.055 : 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (title) {
    let size = base * 0.115 * state.titleSize;
    const fontName = state.titleFont === 'Bebas Neue' ? "'Bebas Neue'" : "'Anton'";
    const words = title.toUpperCase();
    ctx.font = `${size}px ${fontName}, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(words).width > w * 0.92 && size > 14) {
      size -= 3;
      ctx.font = `${size}px ${fontName}, sans-serif`;
    }
    const [c1, c2] = TITLE_COLORS[state.titleColor] ?? TITLE_COLORS.white;
    const grad = ctx.createLinearGradient(0, textY - size, 0, textY + size * 0.2);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    if (state.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = size * 0.16; ctx.shadowOffsetY = size * 0.05; }
    if (state.outline) {
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeStyle = 'rgba(16,8,28,0.9)';
      ctx.lineJoin = 'round';
      ctx.strokeText(words, cx, textY);
    }
    ctx.fillText(words, cx, textY);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    if (sub) {
      const subSize = Math.max(16, base * 0.038);
      ctx.font = `${subSize}px 'Pacifico', cursive`;
      ctx.fillStyle = grade.glow;
      if (state.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = subSize * 0.3; }
      ctx.fillText(sub, cx, textY + subSize * 1.5);
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    }
  } else if (sub) {
    const subSize = Math.max(18, base * 0.05);
    ctx.font = `${subSize}px 'Pacifico', cursive`;
    ctx.fillStyle = grade.glow;
    ctx.fillText(sub, cx, textY);
  }
}

/** Paints the whole cover for `state` using `photos` (Image objects, indexed by panel.photo). */
export function renderCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  // Deep violet-pink dusk backdrop, so empty panels still look like a poster.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b0f4d');
  sky.addColorStop(0.55, '#7b1e6e');
  sky.addColorStop(1, '#ff7a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const rects = layoutRects(state.layout, w, h);
  const used = state.layout === 'single' ? [0] : [0, 1, 2, 3];
  for (const i of used) {
    const panel = state.panels[i];
    const img = photos[panel.photo];
    const rect = rects[i];
    if (state.layout === 'collage') {
      // White snapshot border around the tilted panel.
      ctx.save();
      ctx.translate(rect[0] + rect[2] / 2, rect[1] + rect[3] / 2);
      ctx.rotate(rect[4]);
      ctx.fillStyle = '#fdfbf6';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = Math.round(Math.min(w, h) * 0.02);
      const pad = Math.round(Math.min(w, h) * 0.012);
      ctx.fillRect(-rect[2] / 2 - pad, -rect[3] / 2 - pad, rect[2] + pad * 2, rect[3] + pad * 2);
      ctx.restore();
    }
    if (img) drawPanelPhoto(ctx, img, rect, panel, grade);
    else {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(rect[0], rect[1], rect[2], rect[3]);
      ctx.restore();
    }
  }

  // Colour grade: layered warm / neon washes over the whole poster.
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(0.5, grade.wash[1]);
  wash.addColorStop(1, grade.wash[2]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  if (state.halftone) drawHalftone(ctx, w, h, 0.10);
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    const pattern = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.vignette) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(8,2,18,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
  // Thin poster frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);

  drawCaption(ctx, state, w, h, grade);
  ctx.restore();
}

/** Renders the cover at an export size and resolves with a PNG blob — the Export path. */
export function exportCoverBlob(state, photos, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  renderCover(canvas, state, photos);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('export failed'))), 'image/png');
  });
}
