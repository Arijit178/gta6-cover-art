// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos
// loaded; ?shot=cover shows the cover alone, filling the window. `photo` picks the
// first sample, `photo2` a second one, `caption` the title, `layout` and `grade`
// the look, `size` the export dimensions. window.__shotReady is set once painted.
export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'pier';
  const photo2 = query.get('photo2');
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Vice City nights';
  const layout = query.get('layout') ?? 'grid';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? '1080x1080';
  await setup({
    samples: photo2 ? [photo, photo2] : [photo],
    title: caption,
    subtitle,
    layout,
    grade,
    size,
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
