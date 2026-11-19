// Cover state: everything the renderer needs, kept apart from the loaded Image objects
// so a whole cover can be snapshotted for undo/redo and rebuilt from JSON.
export const LAYOUTS = ['grid', 'hero', 'single', 'collage'];
export const GRADES = ['sunset', 'neon', 'golden', 'noir'];
export const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };

export const PRESETS = [
  { title: 'Sunset Heist', subtitle: 'Vice City nights', grade: 'sunset', layout: 'grid' },
  { title: 'Boulevard Queen', subtitle: 'Crown the strip', grade: 'golden', layout: 'hero' },
  { title: 'Neon Shore', subtitle: 'After midnight, the city glows', grade: 'neon', layout: 'collage' },
  { title: 'Pier Pressure', subtitle: 'High tide, higher stakes', grade: 'sunset', layout: 'single' },
];

function blankPanel(photo) {
  return { photo, zoom: 1, ox: 0, oy: 0, fit: 'fill' };
}

/** A fresh cover: four panels sharing the first photo, sunset grade, bold bottom title. */
export function freshState() {
  return {
    layout: 'grid',
    grade: 'sunset',
    grain: true,
    vignette: true,
    halftone: false,
    title: 'Sunset Heist',
    subtitle: 'Vice City nights',
    titleFont: 'Anton',
    titleSize: 1,
    titleColor: 'white',
    titlePlace: 'bottom',
    outline: true,
    shadow: true,
    showSubtitle: true,
    exportSize: '1080x1080',
    selectedPanel: 0,
    panels: [blankPanel(0), blankPanel(0), blankPanel(0), blankPanel(0)],
  };
}

/** Deep copy of the serialisable part of a state (photos live outside it). */
export function snapshotState(state) {
  return JSON.parse(JSON.stringify(state));
}

/** A small undo/redo stack over state snapshots. */
export function makeHistory(initial) {
  let past = [];
  let future = [];
  let current = snapshotState(initial);
  return {
    get current() { return current; },
    push(next) {
      past.push(current);
      if (past.length > 60) past.shift();
      future = [];
      current = snapshotState(next);
    },
    undo() {
      if (!past.length) return null;
      future.push(current);
      current = past.pop();
      return snapshotState(current);
    },
    redo() {
      if (!future.length) return null;
      past.push(current);
      current = future.pop();
      return snapshotState(current);
    },
    canUndo() { return past.length > 0; },
    canRedo() { return future.length > 0; },
  };
}
