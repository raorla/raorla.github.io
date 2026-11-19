'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { field } from '@/lib/store';
import { faceShape, graphShape, shieldShape, routeShape, timelineShape, textShape, type Layout } from '@/lib/shapes';

const COLS = 10;
const FIRST = 33; // '!'
const LAST = 126; // '~'

const vertex = /* glsl */ `
attribute vec4 aP0; attribute vec4 aP1; attribute vec4 aP2; attribute vec4 aP3; attribute vec4 aP4; attribute vec4 aP5;
attribute float aGlyph; attribute float aRand;
uniform float uStage; uniform float uTime; uniform float uSize; uniform float uDpr; uniform float uBurst;
uniform vec2 uMouse; uniform float uMouseOn;
varying float vLum; varying float vAcc; varying float vGlyph; varying float vHover;
vec4 pick(float i) { return i < 0.5 ? aP0 : i < 1.5 ? aP1 : i < 2.5 ? aP2 : i < 3.5 ? aP3 : i < 4.5 ? aP4 : aP5; }
void decode(vec4 v, out float lum, out float acc) {
  acc = v.w >= 4.0 ? 2.0 : (v.w >= 2.0 ? 1.0 : 0.0);
  lum = v.w - acc * 2.0;
}
void main() {
  float fr = fract(uStage);
  float mid = 1.0 - abs(2.0 * fr - 1.0);
  float st = clamp(uStage + (aRand - 0.5) * 0.45 * mid, 0.0, 5.0);
  float i0 = floor(st);
  float i1 = min(i0 + 1.0, 5.0);
  float f = smoothstep(0.0, 1.0, st - i0);
  vec4 A = pick(i0); vec4 B = pick(i1);
  float lA, aA, lB, aB; decode(A, lA, aA); decode(B, lB, aB);
  vec3 p = mix(A.xyz, B.xyz, f);
  float lum = mix(lA, lB, f);
  float acc = f < 0.5 ? aA : aB;
  vec3 dir = normalize(vec3(sin(aRand * 91.7), cos(aRand * 57.3), sin(aRand * 13.1) + 0.25));
  p += dir * sin(f * 3.14159) * (0.6 + aRand * 1.8);
  float face = 1.0 - clamp(uStage, 0.0, 1.0);
  p += vec3(sin(uTime * 0.55 + aRand * 40.0), cos(uTime * 0.45 + aRand * 31.0), 0.0) * mix(0.018, 0.0015, face);
  p += dir * uBurst * (2.5 + aRand * 5.0);
  vec2 d = p.xy - uMouse;
  float m = uMouseOn * exp(-dot(d, d) / 0.3);
  p.xy += normalize(d + 1e-4) * m * 0.3;
  p.z += m * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uDpr * (0.92 + lum * 0.22 + m * 0.9) * (10.0 / -mv.z);
  vLum = lum; vAcc = acc; vGlyph = aGlyph; vHover = m;
}`;

const fragment = /* glsl */ `
uniform sampler2D uAtlas; uniform float uOpacity; uniform float uBurst;
varying float vLum; varying float vAcc; varying float vGlyph; varying float vHover;
void main() {
  vec2 cell = vec2(mod(vGlyph, ${COLS}.0), floor(vGlyph / ${COLS}.0));
  vec2 uv = vec2((cell.x + gl_PointCoord.x) / ${COLS}.0, 1.0 - (cell.y + gl_PointCoord.y) / ${COLS}.0);
  if (vGlyph < 0.0) discard;
  float g = texture2D(uAtlas, uv).a;
  vec3 dim = vec3(0.24, 0.27, 0.45);
  vec3 bone = vec3(0.93, 0.91, 0.86);
  vec3 col = mix(dim, bone, vLum);
  if (vAcc > 1.5) col = mix(col, vec3(0.91, 0.76, 0.48), 0.9);
  else if (vAcc > 0.5) col = mix(col, vec3(1.0, 0.36, 0.21), 0.9);
  col += vHover * vec3(0.25, 0.22, 0.18);
  float a = min(1.0, g * (0.08 + 1.25 * vLum + vHover * 0.6)) * uOpacity * (1.0 - uBurst * 0.5);
  if (a < 0.02) discard;
  gl_FragColor = vec4(col, a);
}`;

function makeAtlas(family: string): THREE.CanvasTexture {
  const cell = 64;
  const c = document.createElement('canvas');
  c.width = c.height = cell * COLS;
  const x = c.getContext('2d')!;
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = `600 ${cell * 0.72}px ${family}`;
  for (let code = FIRST; code <= LAST; code++) {
    const i = code - FIRST;
    x.fillText(String.fromCharCode(code), (i % COLS) * cell + cell / 2, Math.floor(i / COLS) * cell + cell / 2 + 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}

type Built = { geo: THREE.BufferGeometry; atlas: THREE.CanvasTexture; cell: number };

async function build(n: number, L: Layout, approvedWord: string): Promise<Built> {
  const css = getComputedStyle(document.documentElement);
  const mono = css.getPropertyValue('--font-mono').trim() || 'monospace';
  const display = css.getPropertyValue('--font-display').trim() || 'sans-serif';
  await document.fonts.ready;
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = '/assets/portrait.webp'; });
  let code = 'export const ALWAYS_DENIED_CAPABILITIES = ["merge_pull_request", "read_secret"];';
  try { const r = await fetch('/assets/code.txt'); if (r.ok) code = await r.text(); } catch { /* keep fallback */ }
  const glyphs = code.replace(/\s+/g, ' ').split('').map((ch) => (ch === ' ' ? -1 : ch.charCodeAt(0))).filter((c) => c === -1 || (c >= FIRST && c <= LAST));

  const face = faceShape(img, n, L);
  const shapes = [
    face.data,
    graphShape(n, L),
    shieldShape(n, L),
    routeShape(n, L),
    timelineShape(n, L),
    textShape(n, L, approvedWord, display),
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  shapes.forEach((s, i) => geo.setAttribute(`aP${i}`, new THREE.BufferAttribute(s, 4)));
  const aGlyph = new Float32Array(n), aRand = new Float32Array(n);
  for (let i = 0; i < n; i++) { const g = glyphs[i % glyphs.length]; aGlyph[i] = g < 0 ? (i < face.count ? -1 : (i * 7) % (LAST - FIRST)) : g - FIRST; aRand[i] = Math.random(); }
  geo.setAttribute('aGlyph', new THREE.BufferAttribute(aGlyph, 1));
  geo.setAttribute('aRand', new THREE.BufferAttribute(aRand, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
  return { geo, atlas: makeAtlas(mono), cell: face.cell };
}

function Field({ built, reduce }: { built: Built; reduce: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { camera, size, gl } = useThree();
  const uniforms = useMemo(() => ({
    uStage: { value: 0 }, uTime: { value: 0 }, uSize: { value: 11 }, uDpr: { value: gl.getPixelRatio() },
    uBurst: { value: 0 }, uMouse: { value: new THREE.Vector2(99, 99) }, uMouseOn: { value: 0 },
    uAtlas: { value: built.atlas }, uOpacity: { value: 1 },
  }), [built, gl]);
  const time = useRef(0);
  useFrame((_, dt) => {
    const u = uniforms;
    if (!reduce && !field.paused) time.current += Math.min(dt, 0.05);
    u.uTime.value = time.current;
    u.uStage.value = field.stage;
    u.uOpacity.value = field.opacity * (size.width < 760 && field.stage > 0.5 && field.stage < 4.95 ? 0.4 : 1);
    u.uBurst.value = field.burst;
    u.uDpr.value = gl.getPixelRatio();
    {
      const cam0 = camera as THREE.PerspectiveCamera;
      const vh = 2 * Math.tan((cam0.fov * Math.PI) / 360) * cam0.position.z;
      u.uSize.value = built.cell * (size.height / vh) * 1.42;
    }
    const cam = camera as THREE.PerspectiveCamera;
    const h = 2 * Math.tan((cam.fov * Math.PI) / 360) * cam.position.z;
    const w = h * cam.aspect;
    u.uMouse.value.set(field.mouse.x * w / 2, field.mouse.y * h / 2);
    u.uMouseOn.value += ((reduce ? 0 : field.mouse.active) - u.uMouseOn.value) * 0.08;
    if (ref.current && !reduce) {
      const tilt = Math.min(1, field.stage);
      ref.current.rotation.y += (field.mouse.x * (0.04 + 0.12 * tilt) - ref.current.rotation.y) * 0.04;
      ref.current.rotation.x += (-field.mouse.y * (0.02 + 0.06 * tilt) - ref.current.rotation.x) * 0.04;
    }
  });
  return (
    <points ref={ref} geometry={built.geo}>
      <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
}

export default function CodeField({ approvedWord }: { approvedWord: string }) {
  const [built, setBuilt] = useState<Built | null>(null);
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const mobile = innerWidth < 760;
    const L: Layout = { mobile, aspect: innerWidth / innerHeight };
    let alive = true;
    build(mobile ? 11000 : 26000, L, approvedWord).then((b) => { if (alive) setBuilt(b); }).catch(() => {});
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      field.mouse.x = (e.clientX / innerWidth) * 2 - 1;
      field.mouse.y = -((e.clientY / innerHeight) * 2 - 1);
      field.mouse.active = 1;
    };
    const leave = () => { field.mouse.active = 0; };
    addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => { alive = false; removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); };
  }, [approvedWord]);
  return (
    <div className="field" aria-hidden="true">
      {built && (
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 35 }} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}>
          <Field built={built} reduce={reduce} />
        </Canvas>
      )}
    </div>
  );
}
