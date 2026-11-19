// Target point clouds for the living code field.
// Each shape returns Float32Array(n * 4): x, y, z, w where w = brightness (0..1),
// or brightness + 2 for a laterite accent, or brightness + 4 for a vanilla accent.

export type Layout = { mobile: boolean; aspect: number };
type Pt = [number, number, number, number];

const RED = 2;
const GOLD = 4;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function pack(points: Pt[], n: number, rand: () => number): Float32Array {
  const out = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const p = points.length ? points[(rand() * points.length) | 0] : [0, 0, 0, 0];
    out.set(p as number[], i * 4);
  }
  return out;
}

/* ---------- 0 · face: a monospace text grid in reading order ---------- */
// Returns positions for the first `count` particles (one per grid cell, row by row),
// so particle i shows glyph i of the code and the portrait reads as lines of code.
export function faceShape(img: HTMLImageElement, n: number, L: Layout): { data: Float32Array; count: number; cell: number } {
  const height = L.mobile ? 3.4 : 5.9;
  const rows = L.mobile ? 78 : 104;
  const lh = height / rows, cw = lh * 0.6;
  const crop = 0.72;
  const W = Math.round((img.width / (img.height * crop)) * rows / 0.6);
  const c = document.createElement('canvas');
  c.width = W; c.height = rows;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(img, 0, 0, img.width, img.height * crop, 0, 0, W, rows);
  const d = x.getImageData(0, 0, W, rows).data;
  const hist = new Float32Array(256);
  let tot = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++; tot++; }
  for (let i = 1; i < 256; i++) hist[i] += hist[i - 1];
  const ox = L.mobile ? 0 : Math.min(3.3, 1.5 * L.aspect);
  const oy = L.mobile ? 0.95 : -0.1;
  const out = new Float32Array(n * 4);
  let k = 0;
  for (let r = 0; r < rows && k < n; r++) for (let col = 0; col < W && k < n; col++) {
    const i = (r * W + col) * 4;
    const a = d[i + 3] / 255;
    const lum = a > 0.45 ? hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])] / (tot || 1) : 0;
    const e = lum < 0.18 ? 0 : Math.pow((lum - 0.18) / 0.82, 0.8);
    out.set([ox + (col - W / 2) * cw, oy + (rows / 2 - r) * lh, 0, e], k * 4);
    k++;
  }
  // particles beyond the grid park far behind the camera's view
  for (let j = k; j < n; j++) out.set([0, 0, -400, 0], j * 4);
  return { data: out, count: k, cell: lh };
}

/* ---------- 1 · agent graph: issue → spec → tests → gates → review → PR ✕ merge ---------- */
export function graphShape(n: number, L: Layout): Float32Array {
  const rand = rng(22);
  const span = L.mobile ? 3.2 : Math.min(9.5, 3.1 * L.aspect);
  const nodes = 7;
  const pos = Array.from({ length: nodes }, (_, i) => {
    const t = i / (nodes - 1);
    return [-span / 2 + t * span, Math.sin(t * Math.PI * 1.2) * (L.mobile ? 0.5 : 0.9) - 0.2] as [number, number];
  });
  const pts: Pt[] = [];
  pos.forEach(([cx, cy], i) => {
    const last = i === nodes - 1;
    const r = last ? 0.42 : 0.34;
    for (let k = 0; k < 900; k++) {
      const a = rand() * Math.PI * 2, rr = r * (0.82 + rand() * 0.18);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, (rand() - 0.5) * 0.2, last ? 1 + RED : 0.95]);
    }
    for (let k = 0; k < 250; k++) {
      const a = rand() * Math.PI * 2, rr = r * Math.sqrt(rand()) * 0.55;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, (rand() - 0.5) * 0.3, last ? 0.8 + RED : 0.55]);
    }
    if (last) { // ✕ inside the refused merge node
      for (let k = 0; k < 500; k++) {
        const t = rand() * 2 - 1, s = r * 0.5;
        const diag = rand() < 0.5 ? 1 : -1;
        pts.push([cx + t * s, cy + diag * t * s, 0.1, 1 + RED]);
      }
    }
  });
  for (let i = 0; i < nodes - 1; i++) {
    const [ax, ay] = pos[i], [bx, by] = pos[i + 1];
    const dashed = i === nodes - 2;
    for (let k = 0; k < 900; k++) {
      const t = rand();
      if (dashed && Math.floor(t * 14) % 2) continue;
      pts.push([ax + (bx - ax) * t, ay + (by - ay) * t + (rand() - 0.5) * 0.05, (rand() - 0.5) * 0.15, dashed ? 0.6 + RED : 0.5]);
    }
  }
  // ambient orbit of tokens around the pipeline
  for (let k = 0; k < 1800; k++) {
    const t = rand();
    pts.push([-span / 2 + t * span, (rand() - 0.5) * (L.mobile ? 3 : 3.6), (rand() - 0.5) * 2, 0.12 + rand() * 0.15]);
  }
  return pack(pts, n, rand);
}

/* ---------- 2 · shield with a check: rules live in code ---------- */
function inPoly(x: number, y: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function shieldShape(n: number, L: Layout): Float32Array {
  const rand = rng(33);
  const s = L.mobile ? 1.35 : 1.7;
  const ox = L.mobile ? 0 : Math.min(3.8, 1.85 * L.aspect);
  // shield outline: curved top, right flank down to the tip, mirrored left flank back up
  const poly: [number, number][] = [];
  for (let i = 0; i <= 30; i++) { const t = i / 30; poly.push([-1 + 2 * t, 1.05 + Math.sin(t * Math.PI) * 0.12]); }
  for (let i = 1; i <= 30; i++) { const t = i / 30; poly.push([1 - t * t, 1.05 - t * 2.2]); }
  for (let i = 29; i >= 1; i--) { const t = i / 30; poly.push([-(1 - t * t), 1.05 - t * 2.2]); }
  const pts: Pt[] = [];
  // edge
  for (let k = 0; k < 3500; k++) {
    const i = (rand() * poly.length) | 0, j = (i + 1) % poly.length, u = rand();
    const ex = poly[i][0] + (poly[j][0] - poly[i][0]) * u, ey = poly[i][1] + (poly[j][1] - poly[i][1]) * u;
    pts.push([ox + ex * s + (rand() - 0.5) * 0.04, ey * s + (rand() - 0.5) * 0.04, 0.2, 1]);
  }
  // fill
  let guard = 0;
  while (pts.length < 9000 && guard++ < 80000) {
    const x = rand() * 2 - 1, y = rand() * 2.4 - 1.2;
    if (!inPoly(x, y, poly)) continue;
    const r = Math.hypot(x, y * 0.8);
    pts.push([ox + x * s, y * s, (1 - r) * 0.5, 0.18 + (1 - Math.min(1, r)) * 0.35]);
  }
  // check mark in vanilla gold
  const ck: [number, number][] = [[-0.45, 0.0], [-0.12, -0.38], [0.5, 0.42]];
  for (let k = 0; k < 2600; k++) {
    const seg = rand() < 0.35 ? 0 : 1, t = rand();
    const [ax, ay] = ck[seg], [bx, by] = ck[seg + 1];
    pts.push([ox + (ax + (bx - ax) * t) * s + (rand() - 0.5) * 0.06, (ay + (by - ay) * t) * s + (rand() - 0.5) * 0.06, 0.45, 1 + GOLD]);
  }
  return pack(pts, n, rand);
}

/* ---------- 3 · route Lyon → Antananarivo ---------- */
const FRANCE: [number, number][] = [[-4.6, 48.4], [-1.2, 46.2], [-1.5, 43.4], [3.0, 42.4], [7.5, 43.7], [6.8, 47.4], [8.2, 49.0], [2.5, 51.0], [-1.6, 49.6]];
const MADA: [number, number][] = [[49.3, -12.0], [50.2, -13.5], [50.5, -15.3], [49.9, -15.9], [49.6, -17.0], [49.3, -18.5], [48.6, -20.5], [47.9, -22.5], [47.2, -24.6], [46.5, -25.2], [45.2, -25.6], [44.1, -25.0], [43.6, -23.5], [43.3, -22.0], [43.9, -20.5], [44.3, -19.2], [44.0, -17.4], [44.5, -16.2], [46.0, -15.7], [47.3, -14.5], [48.2, -13.4], [48.9, -12.3]];
function project(poly: [number, number][], cx: number, cy: number, k: number, lon0: number, lat0: number) {
  return poly.map(([lo, la]) => [cx + (lo - lon0) * k * Math.cos((la * Math.PI) / 180), cy + (la - lat0) * k] as [number, number]);
}
export function routeShape(n: number, L: Layout): Float32Array {
  const rand = rng(44);
  const w = L.mobile ? 1.6 : Math.min(4.6, 1.55 * L.aspect);
  const half = Math.min(5.6, 1.75 * L.aspect);
  const frX = L.mobile ? -w : half * 0.18, mdX = L.mobile ? w : half * 0.82;
  const frY = L.mobile ? 1.5 : 1.75, mdY = L.mobile ? -1.3 : 0.15;
  const frK = L.mobile ? 0.11 : 0.12, mdK = L.mobile ? 0.13 : 0.17;
  const fr = project(FRANCE, frX, frY, frK, 2.0, 46.5);
  const md = project(MADA, mdX, mdY, mdK, 46.8, -19.0);
  const lyon = project([[4.85, 45.76]], frX, frY, frK, 2.0, 46.5)[0];
  const tana = project([[47.52, -18.88]], mdX, mdY, mdK, 46.8, -19.0)[0];
  const pts: Pt[] = [];
  const fill = (poly: [number, number][], count: number, b: number) => {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    let made = 0, guard = 0;
    while (made < count && guard++ < count * 30) {
      const x = x0 + rand() * (x1 - x0), y = y0 + rand() * (y1 - y0);
      if (!inPoly(x, y, poly)) continue;
      pts.push([x, y, (rand() - 0.5) * 0.2, b * (0.5 + rand() * 0.5)]); made++;
    }
    for (let k = 0; k < count * 0.5; k++) {
      const i = (rand() * poly.length) | 0, j = (i + 1) % poly.length, t = rand();
      pts.push([poly[i][0] + (poly[j][0] - poly[i][0]) * t, poly[i][1] + (poly[j][1] - poly[i][1]) * t, 0.1, 0.95]);
    }
  };
  fill(fr, 2600, 0.55);
  fill(md, 4200, 0.75);
  // great arc
  const mx = (lyon[0] + tana[0]) / 2, my = Math.max(lyon[1], tana[1]) + (L.mobile ? 0.6 : 1.1);
  for (let k = 0; k < 5200; k++) {
    const t = rand();
    const x = (1 - t) * (1 - t) * lyon[0] + 2 * (1 - t) * t * mx + t * t * tana[0];
    const y = (1 - t) * (1 - t) * lyon[1] + 2 * (1 - t) * t * my + t * t * tana[1];
    pts.push([x + (rand() - 0.5) * 0.03, y + (rand() - 0.5) * 0.03, Math.sin(t * Math.PI) * 0.6, 1 + GOLD]);
  }
  for (const c of [lyon, tana]) for (let k = 0; k < 700; k++) {
    const a = rand() * Math.PI * 2, r = 0.12 * Math.sqrt(rand());
    pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, 0.4, 1 + RED]);
  }
  return pack(pts, n, rand);
}

/* ---------- 4 · timeline 2013 → now ---------- */
export function timelineShape(n: number, L: Layout): Float32Array {
  const rand = rng(55);
  const span = L.mobile ? 3.2 : Math.min(5.2, 1.6 * L.aspect);
  const cx = L.mobile ? 0 : Math.min(3.0, 1.45 * L.aspect);
  const years = [2013, 2015, 2017, 2020, 2022, 2024, 2026.9];
  const weight = [0.5, 0.7, 1.1, 0.9, 1.2, 1.6, 1.0];
  const y0 = L.mobile ? -1.2 : -1.4;
  const pts: Pt[] = [];
  for (let k = 0; k < 4200; k++) { const t = rand(); pts.push([cx - span / 2 + t * span, y0 + (rand() - 0.5) * 0.04, 0, 0.55 + t * 0.4]); }
  years.forEach((yr, i) => {
    const x = cx - span / 2 + ((yr - 2013) / 13.9) * span, h = weight[i] * (L.mobile ? 1.4 : 2.2);
    const now = i === years.length - 1;
    for (let k = 0; k < 1300; k++) {
      const t = Math.pow(rand(), 0.8);
      pts.push([x + (rand() - 0.5) * 0.18, y0 + t * h, (rand() - 0.5) * 0.2, now ? 0.9 + GOLD : 0.4 + t * 0.6]);
    }
    for (let k = 0; k < 350; k++) { const a = rand() * Math.PI * 2, r = 0.13 * Math.sqrt(rand()); pts.push([x + Math.cos(a) * r, y0 + Math.sin(a) * r, 0.2, now ? 1 + RED : 1]); }
  });
  return pack(pts, n, rand);
}

/* ---------- 5 · approved text ---------- */
export function textShape(n: number, L: Layout, word: string, family: string): Float32Array {
  const rand = rng(66);
  const c = document.createElement('canvas');
  c.width = 1400; c.height = 420;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.fillStyle = '#fff';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = 300;
  x.font = `800 ${size}px ${family}`;
  while (x.measureText(word).width > 1320 && size > 60) { size -= 10; x.font = `800 ${size}px ${family}`; }
  x.fillText(word, 700, 215);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  const width = L.mobile ? 3.3 : Math.min(6.2, 1.9 * L.aspect);
  const k = width / 1400;
  const ox = L.mobile ? 0 : Math.min(3.1, 1.45 * L.aspect);
  const pts: Pt[] = [];
  for (let y = 0; y < c.height; y += 3) for (let xx = 0; xx < c.width; xx += 3) {
    if (d[(y * c.width + xx) * 4 + 3] < 128) continue;
    pts.push([ox + (xx - 700) * k, (210 - y) * k + (L.mobile ? 0.4 : 0.5), (rand() - 0.5) * 0.3, 0.75 + rand() * 0.25 + (rand() < 0.08 ? GOLD : 0)]);
  }
  return pack(pts, n, rand);
}
