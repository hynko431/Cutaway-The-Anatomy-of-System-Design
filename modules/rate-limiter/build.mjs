import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ANAT = "file:///C:/Users/hulkh/.gemini/config/skills/anatomy";
const k = await import(`${ANAT}/kit/iso-kit.mjs`);
const G = await import(`${ANAT}/kit/lathe.mjs`);
const A = await import(`${ANAT}/kit/audit.mjs`);
const { turning } = await import(`${ANAT}/kit/turn-build.mjs`);
const TA = await import(`${ANAT}/kit/turn-audit.mjs`);
const { turnScript, glScript } = await import(`${ANAT}/scripts/inline-kit.mjs`);
const { glCamera } = await import(`${ANAT}/kit/gl.mjs`);

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const theme = argv.includes("--light") ? "light" : "dark";

const WIDTH = 660;
const HEIGHT = 480;
const AZIMUTH = 40;
const ELEVATION = 31;

const BASE = { x: -84, y: -80, w: 178, d: 174, r: 8 };
const BASE_H = 12;
const FOOT_H = 5;
const PLATE = { x: -72, y: -68, w: 144, d: 136, r: 6 };
const PLATE_Z0 = 8;
const PLATE_Z1 = 10;
const DIAL_R = 50;
const SKIRT_TOP = 14.4;
const FACE_Z = 17.6;
const FACE_R = 46;
const HUB_R = 12;
const HUB_TOP = 19.4;
const PALM = { x: -18.5, y: -16.5, w: 30, d: 33, r: 3.2 };
const PALM_TOP = HUB_TOP + 8;
const COVER = { x: -15.5, y: -13.2, w: 26.6, d: 26.4, r: 2.6 };
const COVER_TOP = PALM_TOP + 1.2;
const INDEX_AT = ((AZIMUTH + 180) * Math.PI) / 180;

export const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [0, 0, 41]],
  WIDTH,
  HEIGHT,
  { pad: 20, azimuth: AZIMUTH, elevation: ELEVATION },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const VERT = (x, y) => G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

export const R = A.recorder(P);
const put = (item) =>
  R.put({
    ...item,
    shapes: item.shapes.map((shape, index) =>
      R.solid(Object.assign(shape, { name: shape.name ?? (index ? `${item.name}#${index + 1}` : item.name) })),
    ),
  });

function base() {
  for (const [x, y] of k.corners(BASE, 22)) {
    const svg =
      S(k.cylinder(x, y, 7, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }) +
      S(k.cylinder(x, y, 5.4, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" });
    put({
      name: `stand.foot.${x}.${y}`,
      layer: "back",
      at: [x, y, -BASE_H - FOOT_H],
      svg,
      shapes: [
        A.cylinder(x, y, 7, -BASE_H - FOOT_H, 1.6, { ground: true }),
        A.cylinder(x, y, 5.4, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6),
      ],
    });
  }
  const screws = k.corners(BASE, 7);
  const svg =
    S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), {
      tone: "mid",
      inner: L(k.sideSeam(BASE, -BASE_H + 4, P, 8), { tone: "faint" }),
    }) +
    L(k.planOutline(k.insetPlan(BASE, 4.5), 0, P, 8), { tone: "faint" }) +
    L(screws.map(([x, y]) => k.ring(x, y, 2.1, 0, P, 16)).join(""), { tone: "lo" }) +
    D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 });
  put({
    name: "stand.base",
    layer: "back",
    at: [0, 0, -BASE_H],
    bias: 4,
    svg,
    shapes: [A.slab(BASE, -BASE_H, BASE_H, { ground: true })],
  });

  // Front calibration ruler strip on the exposed +y bench apron (z <= 0.7 < LOCK_Z0)
  const RULER = { x: -58, y: 74, w: 80, d: 8, r: 1 };
  const rt = k.topTicks(RULER.x + 4, RULER.x + RULER.w - 4, 4, 5, RULER.y + 0.1, 0.7, [1.6, 2.9], P);
  const rulerSvg =
    S(k.slabOf(RULER, 0, 0.7, P, 3), { tone: "lo", crease: "none" }) +
    L(rt.minor, { tone: "lo" }) +
    L(rt.major, { tone: "mid" });
  put({
    name: "stand.ruler",
    layer: "back",
    at: [RULER.x + RULER.w / 2, RULER.y + RULER.d / 2, 0.35],
    bias: 8,
    svg: rulerSvg,
    shapes: [A.slab(RULER, 0, 0.7)],
  });

  // Front-right specification label plate with 3 engraved rule lines ({ free: true })
  const LPLATE = { x: 30, y: 73, w: 46, d: 12, r: 1.5 };
  const rules = [
    k.lineOnTop([LPLATE.x + 5, LPLATE.y + 3.6], [LPLATE.x + 31, LPLATE.y + 3.6], 0.8, P),
    k.lineOnTop([LPLATE.x + 5, LPLATE.y + 6.2], [LPLATE.x + 38, LPLATE.y + 6.2], 0.8, P),
    k.lineOnTop([LPLATE.x + 5, LPLATE.y + 8.8], [LPLATE.x + 24, LPLATE.y + 8.8], 0.8, P),
  ];
  const lplateSvg =
    S(k.slabOf(LPLATE, 0, 0.8, P, 4), { tone: "lo", crease: "none" }) +
    L(k.planOutline(k.insetPlan(LPLATE, 1.5), 0.8, P, 4), { tone: "faint" }) +
    L(rules.join(""), { tone: "lo", free: true }) +
    D(
      [
        at([LPLATE.x + 2.6, LPLATE.y + LPLATE.d / 2, 0.8]),
        at([LPLATE.x + LPLATE.w - 2.6, LPLATE.y + LPLATE.d / 2, 0.8]),
      ],
      { size: 0.45 },
    );
  put({
    name: "stand.label",
    layer: "back",
    at: [LPLATE.x + LPLATE.w / 2, LPLATE.y + LPLATE.d / 2, 0.4],
    bias: 8,
    svg: lplateSvg,
    shapes: [A.slab(LPLATE, 0, 0.8)],
  });

  // Right-apron datum calibration bosses & keyway bar (z <= 1.2 < LOCK_Z0, fills plain +x apron)
  for (const [id, dy] of [
    ["a", -28],
    ["b", 28],
  ]) {
    const bossSvg =
      S(k.cylinder(82.5, dy, 3.6, 0, 0.6, P, 24), { tone: "lo" }) +
      S(k.cylinder(82.5, dy, 2.3, 0.6, 0.6, P, 24), { tone: "mid" }) +
      D([at([82.5, dy, 1.2])], { size: 0.48 });
    put({
      name: `stand.datum.${id}`,
      layer: "back",
      at: [82.5, dy, 0.6],
      bias: 8,
      svg: bossSvg,
      shapes: [A.cylinder(82.5, dy, 3.6, 0, 0.6), A.cylinder(82.5, dy, 2.3, 0.6, 0.6)],
    });
  }
  const KEYBAR = { x: 78.5, y: -15, w: 8, d: 30, r: 1.2 };
  const keySvg =
    S(k.slabOf(KEYBAR, 0, 1.0, P, 4, 0.3), { tone: "lo", crease: "faint" }) +
    L(k.planOutline(k.insetPlan(KEYBAR, 1.6), 1.0, P, 3), { tone: "faint" }) +
    D(
      [
        at([KEYBAR.x + KEYBAR.w / 2, KEYBAR.y + 3.2, 1.0]),
        at([KEYBAR.x + KEYBAR.w / 2, KEYBAR.y + KEYBAR.d - 3.2, 1.0]),
      ],
      { size: 0.45 },
    );
  put({
    name: "stand.keybar",
    layer: "back",
    at: [KEYBAR.x + KEYBAR.w / 2, KEYBAR.y + KEYBAR.d / 2, 0.5],
    bias: 8,
    svg: keySvg,
    shapes: [A.slab(KEYBAR, 0, 1.0)],
  });
}

const WHEEL_AT = [40 * Math.cos((AZIMUTH * Math.PI) / 180), 40 * Math.sin((AZIMUTH * Math.PI) / 180)];
const WHEEL_R = 32;
const PINION_R = 8;
const LOCK_Z0 = 3.2;
const LOCK_Z1 = 7.2;
const WINDOW = { x: 42.4, y: 35.6, w: 12.6, d: 10.4, r: 2.2 };

function backPosts() {
  const V = [Math.cos((AZIMUTH * Math.PI) / 180), Math.sin((AZIMUTH * Math.PI) / 180)];
  for (const [x, y] of byDepth(k.corners(PLATE, 12))) {
    const front = x * V[0] + y * V[1] > 0;
    const svg = S(k.cylinder(x, y, 3.4, 0, PLATE_Z0, P, 28), { tone: "mid", crease: "none" });
    put({ name: `stand.post.${x}.${y}`, layer: front ? "mid" : "back", at: [x, y, 0], svg, shapes: [A.cylinder(x, y, 3.4, 0, PLATE_Z0)] });
  }
  for (const [name, [x, y], r] of [
    ["stand.washer.dial", [0, 0], 4.2],
    ["stand.washer.wheel", WHEEL_AT, 6.4],
  ]) {
    const svg = S(k.cylinder(x, y, r, 0, LOCK_Z0, P, 32), { tone: "lo" });
    put({ name, layer: "back", at: [x, y, 0], svg, shapes: [A.cylinder(x, y, r, 0, LOCK_Z0)] });
  }
}

function windowed() {
  const slab = k.slabOf(PLATE, PLATE_Z0, PLATE_Z1 - PLATE_Z0, P, 8, 1);
  const ring = k.roundedPlan(WINDOW, 4);
  const hole = k.onTop(ring, PLATE_Z1, P, true);
  const V = [Math.cos((AZIMUTH * Math.PI) / 180), Math.sin((AZIMUTH * Math.PI) / 180)];
  const lx = -Math.sin((AZIMUTH * Math.PI) / 180);
  const ly = Math.cos((AZIMUTH * Math.PI) / 180);
  const n = ring.length;
  const walls = [[], [], [], []];
  const bottoms = [];
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    if (nx * V[0] + ny * V[1] <= 1e-9) continue;
    const shade = Math.min(3, Math.max(0, Math.floor(((nx * lx + ny * ly + 1) / 2) * 4)));
    walls[shade].push(
      k.pathOf([at([a[0], a[1], PLATE_Z1]), at([b[0], b[1], PLATE_Z1]), at([b[0], b[1], PLATE_Z0]), at([a[0], a[1], PLATE_Z0])], true),
    );
    bottoms.push([a, b]);
  }
  const clip = `<clipPath id="rl-window"><path d="${hole}"/></clipPath>`;
  const wallSvg = walls.map((list, shade) => (list.length ? `<path class="iso-shade" data-shade="${shade}" d="${list.join("")}"/>` : "")).join("");
  const under = bottoms.map(([a, b]) => k.pathOf([at([a[0], a[1], PLATE_Z0]), at([b[0], b[1], PLATE_Z0])])).join("");
  const screws = byDepth(k.corners(PLATE, 12));
  const inner = [
    `<g clip-path="url(#rl-window)">${wallSvg}${L(under, { tone: "lo" })}</g>`,
    L(k.planOutline(k.insetPlan(PLATE, 4), PLATE_Z1, P), { tone: "faint" }),
    L(screws.map(([x, y]) => k.ring(x, y, 2.4, PLATE_Z1, P, 18)).join(""), { tone: "lo" }),
    L(k.planOutline(k.insetPlan(WINDOW, -1.4), PLATE_Z1, P, 4), { tone: "faint" }),
  ].join("");
  const body = `<defs>${clip}</defs><g class="iso-solid"><path class="iso-fill" fill-rule="evenodd" d="${slab.fill}${hole}"/>${slab.shades
    .map((d, shade) => (d ? `<path class="iso-shade" data-shade="${shade}" d="${d}"/>` : ""))
    .join("")}<path class="iso-top" fill-rule="evenodd" d="${slab.top}${hole}"/><path class="iso-line iso-crease" data-tone="faint" d="${slab.crease}"/><path class="iso-line iso-bevel" data-tone="faint" d="${slab.bevel}"/>${inner}<path class="iso-line iso-edge" data-tone="mid" d="${slab.outline}${hole}"/></g>`;
  const dots = D(screws.map(([x, y]) => at([x, y, PLATE_Z1])), { size: 0.5 });
  return `<path class="iso-halo" d="${k.haloOf(k.insetPlan(PLATE, 4), PLATE_Z0, 0.1, P)}" style="filter:blur(5px)"/>${body}${dots}`;
}

function midStatic() {
  const svg = windowed();
  put({
    name: "stand.plate",
    layer: "mid",
    at: [0, 0, PLATE_Z0],
    svg,
    shapes: [A.slab(PLATE, PLATE_Z0, PLATE_Z1 - PLATE_Z0)],
  });
  const c = Math.cos(INDEX_AT);
  const s = Math.sin(INDEX_AT);
  const wedge = [
    [DIAL_R + 1.2, -0.7],
    [DIAL_R + 1.2, 0.7],
    [DIAL_R + 7.4, 2.6],
    [DIAL_R + 7.4, -2.6],
  ].map(([r, t]) => [c * r - s * t, s * r + c * t]);
  const wedgeSvg = S(k.extrude(wedge, PLATE_Z1, 3, P, { bevel: 0.35 }), { tone: "hi", lit: true });
  put({
    name: "stand.index",
    layer: "mid",
    at: [c * 48, s * 48, PLATE_Z1],
    svg: `<g data-mat="brass">${wedgeSvg}</g>`,
    shapes: [A.extruded(wedge, PLATE_Z1, 3)],
  });
}

// ---- 3D Turning Engine Setup ----
export const T = turning(P, { recorder: R });
const dial = T.group("dial", { turn: { pivot: [0, 0] } });
const wheel = T.group("wheel", { turn: { pivot: WHEEL_AT } });
const PAWL_AT = [0, DIAL_R + 8.3];
const pawl = T.group("pawl", { hinge: { point: [PAWL_AT[0], PAWL_AT[1], 0], axis: [0, 0, 1], range: [-4, 4] } });
const lock = T.layer("lock");
const face = T.layer("dial");
const turret = T.layer("turret");
T.stack(["back", "lock", "mid", "dial", "turret", "front"]);

export const follow = (values) => ({
  ...values,
  wheel: -(values.dial ?? 0) / 4,
  pawl: 4 * Math.sin(((values.dial ?? 0) * Math.PI) / 18),
  "gate.mcp": -20 * (values.lift ?? 0),
  "gate.pip": -14 * (values.lift ?? 0),
});

export const tapAt = (time) => {
  const phase = ((time % 4) + 4) % 4;
  const up = Math.min(1, Math.max(0, (phase - 0.4) / 0.9));
  const down = Math.min(1, Math.max(0, (phase - 2.2) / 1.1));
  const ease = (x) => x * x * (3 - 2 * x);
  return ease(up) * (1 - ease(down));
};

export const breakAt = (time) => {
  if (!(time > 0)) return null;
  const flight = 0.79888;
  const c = 1.0;
  let phi = 0;
  let psi = 0;
  let y = 0;
  let z = 0;
  if (time < flight) {
    const s = time / flight;
    phi = 2 * Math.PI * s * s * (3 - 2 * s);
    y = 16 * time;
    z = 25 * time - 49 * time * time;
  } else {
    const kk = 1 - Math.exp(-(time - flight) / 0.25);
    phi = 2 * Math.PI;
    y = 16 * flight + 1.5 * kk;
    z = -11.3;
    psi = (40 * Math.PI * kk) / 180;
  }
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const cz = Math.cos(psi);
  const sz = Math.sin(psi);
  const Rm = [cz, -sz * cp, sz * sp, sz, cz * cp, -cz * sp, 0, sp, cp];
  return { R: Rm, t: [-Rm[2] * c, y - Rm[5] * c, z + c - Rm[8] * c] };
};
export const BREAK_END = 2.2;

export const poses = () => {
  const out = Array.from({ length: 1440 }, (_, deg) => follow({ dial: deg, lift: tapAt(deg / 30) }));
  for (let start = 0; start < 360; start += 45)
    for (let f = 0; f <= 66; f++) out.push(follow({ dial: start + f * 0.6, lift: tapAt(f / 30), pod: breakAt(f / 30) }));
  return out;
};

// ---- Main Knurled Metering Drum & Calibrated 0..9 Token Dial Face ----
const DIAL_F = VERT(0, 0);
const tick = (angle, from, to) =>
  `M${(Math.sin(angle) * from).toFixed(3)} ${(-Math.cos(angle) * from).toFixed(3)}L${(Math.sin(angle) * to).toFixed(3)} ${(-Math.cos(angle) * to).toFixed(3)}`;
const ringPath = (r, steps) =>
  Array.from({ length: steps }, (_, j) => `${j ? "L" : "M"}${(r * Math.cos((j / steps) * Math.PI * 2)).toFixed(3)} ${(r * Math.sin((j / steps) * Math.PI * 2)).toFixed(3)}`).join("") + "Z";

const faceMarkup = () => {
  const rim = FACE_R - 0.8;
  const minor = [];
  const major = [];
  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    (i % 10 ? minor : major).push(tick(angle, rim - (i % 10 ? 1.4 : 2.6), rim));
  }
  const numerals = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    const r = rim - 5.2;
    return `<text class="iso-face-text" data-tone="lo" font-size="3.4" text-anchor="middle" transform="translate(${(Math.sin(angle) * r).toFixed(3)} ${(-Math.cos(angle) * r).toFixed(3)}) rotate(${(i * 36).toFixed(1)}) translate(0 1.2)">${i}</text>`;
  }).join("");
  return `<path class="iso-line" data-tone="lo" d="${ringPath(rim, 160)}"/><path class="iso-line" data-tone="lo" d="${minor.join("")}"/><path class="iso-line" data-tone="mid" d="${major.join("")}"/>${numerals}<path class="iso-line" data-tone="faint" d="${ringPath(29.8, 120)}"/>`;
};

T.round({
  name: "rotor.body",
  group: dial,
  layer: face,
  F: DIAL_F,
  s0: PLATE_Z1,
  s1: SKIRT_TOP,
  r: DIAL_R,
  tone: "hi",
  crease: "lo",
  material: "steel",
  details: { ribs: { s0: PLATE_Z1 + 0.9, s1: SKIRT_TOP - 0.7, count: 150, fade: [0.08, 0.5], seams: true, tone: "lo" } },
});
const dialBevel = T.round({
  name: "rotor.bevel",
  group: dial,
  layer: face,
  F: DIAL_F,
  s0: SKIRT_TOP,
  s1: FACE_Z,
  r: [DIAL_R, FACE_R],
  tone: "hi",
  crease: "lo",
  material: "steel",
});
T.plane({ part: dialBevel, o: [0, 0, FACE_Z], u: [1, 0, 0], v: [0, 1, 0], svg: faceMarkup(), fade: [0.04, 0.3] });
T.round({
  name: "rotor.hub",
  group: dial,
  layer: turret,
  F: DIAL_F,
  s0: FACE_Z,
  s1: HUB_TOP,
  r: HUB_R,
  tone: "mid",
  material: "chrome",
  details: { seams: [FACE_Z + 0.9] },
});

// ---- Sub-Deck Geared Window-Reset Index Wheel ----
const wheelFace = () => {
  const minor = [];
  const major = [];
  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    (i % 10 ? minor : major).push(tick(angle, WHEEL_R - 3.2 - (i % 10 ? 1.2 : 2.4), WHEEL_R - 3.2));
  }
  const numerals = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    const r = WHEEL_R - 9.4;
    return `<text class="iso-face-text" data-tone="mid" font-size="4.2" text-anchor="middle" transform="translate(${(Math.sin(angle) * r).toFixed(3)} ${(-Math.cos(angle) * r).toFixed(3)}) rotate(${(i * 36).toFixed(1)}) translate(0 1.5)">${i}</text>`;
  }).join("");
  return `<path class="iso-line" data-tone="lo" d="${ringPath(WHEEL_R - 3.2, 180)}"/><path class="iso-line" data-tone="lo" d="${minor.join("")}"/><path class="iso-line" data-tone="mid" d="${major.join("")}"/>${numerals}`;
};
T.round({
  name: "lock.pinion",
  group: dial,
  layer: lock,
  F: VERT(0, 0),
  s0: LOCK_Z0,
  s1: LOCK_Z1,
  r: PINION_R,
  tone: "mid",
  material: "brass",
  details: { ribs: { s0: LOCK_Z0 + 0.5, s1: LOCK_Z1 - 0.5, count: 48, seams: true, tone: "lo" } },
});
const wheelDisc = T.round({
  name: "lock.wheel",
  group: wheel,
  layer: lock,
  F: VERT(WHEEL_AT[0], WHEEL_AT[1]),
  s0: LOCK_Z0,
  s1: LOCK_Z1,
  r: WHEEL_R,
  tone: "hi",
  crease: "lo",
  material: "brass",
  details: { ribs: { s0: LOCK_Z0 + 0.5, s1: LOCK_Z1 - 0.5, count: 192, seams: true, tone: "lo" } },
});
T.plane({ part: wheelDisc, o: [WHEEL_AT[0], WHEEL_AT[1], LOCK_Z1], u: [1, 0, 0], v: [0, 1, 0], svg: wheelFace() });
T.round({
  name: "lock.wheel.hub",
  group: wheel,
  layer: lock,
  F: VERT(WHEEL_AT[0], WHEEL_AT[1]),
  s0: LOCK_Z1,
  s1: LOCK_Z1 + 0.5,
  r: 6,
  tone: "mid",
  material: "steel",
  details: { bolts: [{ s: LOCK_Z1 + 0.5, r: 3.8, count: 4, size: 0.5, phase: 0.4 }] },
});

// ---- Hinged Chrome Rim Escapement Pawl ----
T.round({ name: "pawl.post", layer: face, F: VERT(PAWL_AT[0], PAWL_AT[1]), s0: PLATE_Z1, s1: PLATE_Z1 + 1, r: 2.4, tone: "mid", material: "gunmetal" });
const pawlRing = [];
for (let j = 0; j <= 10; j++) pawlRing.push([PAWL_AT[0] + 2.2 * Math.cos((j / 10) * Math.PI), PAWL_AT[1] + 2.2 * Math.sin((j / 10) * Math.PI)]);
pawlRing.push([PAWL_AT[0] - 0.6, DIAL_R + 0.4], [PAWL_AT[0], DIAL_R + 0.15], [PAWL_AT[0] + 0.6, DIAL_R + 0.4]);
T.prism({
  name: "pawl.arm",
  group: pawl,
  layer: face,
  F: { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  polygon: pawlRing,
  s0: PLATE_Z1 + 1,
  s1: PLATE_Z1 + 2.6,
  tone: "hi",
  crease: "lo",
  bevel: 0.3,
  material: "chrome",
});
T.round({
  name: "pawl.pin",
  group: pawl,
  layer: face,
  F: VERT(PAWL_AT[0], PAWL_AT[1]),
  s0: PLATE_Z1 + 2.6,
  s1: PLATE_Z1 + 3.3,
  r: 1.1,
  tone: "mid",
  material: "steel",
  details: { bolts: [{ s: PLATE_Z1 + 3.3, r: 0, count: 1, size: 0.45 }] },
});

// ---- 10-Chamber Token Carousel: 9 Brass Token Slugs + Station 0 Active Metering Anvil ----
const H = { group: dial, layer: turret };
const R_TOK = 35.0;
// Station 0 (+x): Recessed gunmetal/chrome metering anvil directly beneath the hinged striker arm
T.round({
  name: "tok.gate.seat",
  ...H,
  F: VERT(R_TOK, 0),
  s0: FACE_Z,
  s1: FACE_Z + 0.6,
  r: 3.1,
  tone: "mid",
  material: "gunmetal",
});
T.round({
  name: "tok.gate.anvil",
  ...H,
  F: VERT(R_TOK, 0),
  s0: FACE_Z + 0.6,
  s1: FACE_Z + 0.95,
  r: 2.0,
  tone: "hi",
  material: "chrome",
  details: { bolts: [{ s: FACE_Z + 0.95, r: 0, count: 1, size: 0.4 }] },
});
// Stations 1..9: 9 machined brass token slugs on gunmetal chamber collars (fixed vertical rounds: fast 0.5 weight!)
for (let i = 1; i <= 9; i++) {
  const th = (i * 36 * Math.PI) / 180;
  const tx = R_TOK * Math.cos(th);
  const ty = R_TOK * Math.sin(th);
  T.round({
    name: `tok.collar.${i}`,
    ...H,
    F: VERT(tx, ty),
    s0: FACE_Z,
    s1: FACE_Z + 0.9,
    r: 2.65,
    tone: "mid",
    material: "gunmetal",
  });
  T.round({
    name: `tok.slug.${i}`,
    ...H,
    F: VERT(tx, ty),
    s0: FACE_Z + 0.9,
    s1: FACE_Z + 5.1,
    r: 2.0,
    tone: "hi",
    crease: "lo",
    material: "brass",
    details: {
      seams: [FACE_Z + 3.0],
      bolts: [{ s: FACE_Z + 5.1, r: 0, count: 1, size: 0.42 }],
    },
  });
}

// ---- Central Gold Metering Manifold, Pneumatic Piston, Sense Harness & Relief Poppet ----
const plan = (name, rect, z, h, extra = {}) => T.prism({ name, ...H, plan: rect, z, h, steps: extra.steps ?? 2, tone: "mid", ...extra });
const along = (name, F, s0, s1, r, extra = {}) => T.round({ name, ...H, F, s0, s1, r, tone: "mid", ...extra });
const frameOf = (o, a, u) => {
  const axis = G.unit3(a);
  const uu = u ? G.unit3(G.sub3(u, G.mul3(axis, G.dot3(u, axis)))) : G.frameAlong(o, axis).u;
  return { o, a: axis, u: uu, v: G.cross3(axis, uu) };
};

const sideScrews = [];
for (const [y, ny] of [
  [PALM.y, -1],
  [PALM.y + PALM.d, 1],
])
  for (const x of [-11, 3]) sideScrews.push({ at: [HUB_TOP + 5.2, x, y], normal: [0, ny, 0], size: 0.45, tone: "mid" });
for (const y of [-7, 7]) sideScrews.push({ at: [HUB_TOP + 5.2, PALM.x, y], normal: [-1, 0, 0], size: 0.45, tone: "mid" });
T.prism({
  name: "valve.body",
  ...H,
  plan: PALM,
  z: HUB_TOP,
  h: PALM_TOP - HUB_TOP,
  steps: 4,
  bevel: 0.9,
  tone: "hi",
  crease: "lo",
  material: "gold",
  details: {
    seams: [HUB_TOP + 2.6],
    dots: sideScrews,
    rings: sideScrews.map((d) => ({ at: d.at, normal: d.normal, r: 0.95, tone: "lo" })),
  },
});

const coverScrews = [
  [-13.7, -11.4],
  [-13.7, 11.4],
  [9.3, -11.4],
  [9.3, 11.4],
].map(([x, y]) => ({ at: [COVER_TOP, x, y], normal: [0, 0, 1], size: 0.48, tone: "mid" }));
T.prism({
  name: "valve.cover",
  ...H,
  plan: COVER,
  z: PALM_TOP,
  h: COVER_TOP - PALM_TOP,
  steps: 3,
  bevel: 0.45,
  tone: "mid",
  material: "gold",
  details: {
    dots: coverScrews,
    rings: coverScrews.map((d) => ({ at: d.at, normal: [0, 0, 1], r: 1.1, tone: "lo" })),
  },
});

const CONN = { x: -15.1, y: -10.4, w: 4.4, d: 20.8, r: 0.9 };
plan("valve.connector", CONN, COVER_TOP, 5.2, { bevel: 0.35, material: "gunmetal", details: { seams: [COVER_TOP + 1.2] } });
const CABLE_Z = COVER_TOP + 1.9;
const PORT_X = CONN.x + CONN.w;
const PORTS = { red: -8.6, green: -5.4, blue: 8.6 };
const CLAMP_X = -2.3;
const CLAMP_R = 1.45;
const CLAMP_T = 1.1;

for (const [colour, y] of Object.entries(PORTS)) {
  along(`valve.port.${colour}`, frameOf([PORT_X, y, CABLE_Z], [1, 0, 0], [0, 0, 1]), 0, 0.7, 1.15, { owner: `cable.${colour}`, material: "brass" });
  along(`valve.clamp.${colour}`, frameOf([CLAMP_X, y, CABLE_Z], [1, 0, 0], [0, 0, 1]), -CLAMP_T / 2, CLAMP_T / 2, CLAMP_R, {
    owner: `cable.${colour}`,
    material: "brass",
  });
}
plan("valve.clamp.left", { x: CLAMP_X - 1.3, y: -10.4, w: 2.6, d: 6.6, r: 0.6 }, COVER_TOP, CABLE_Z - CLAMP_R - COVER_TOP, { material: "gunmetal" });
plan("valve.clamp.right", { x: CLAMP_X - 1.3, y: 6.9, w: 2.6, d: 3.4, r: 0.6 }, COVER_TOP, CABLE_Z - CLAMP_R - COVER_TOP, { material: "gunmetal" });

// Clean terminal blocks receiving all 3 flat horizontal sense cables (zero bends, zero crowding!)
const TERM_LEFT = { x: 3.2, y: -10.2, w: 2.6, d: 6.4, r: 0.5 };
plan("valve.term.left", TERM_LEFT, COVER_TOP, CABLE_Z + 1.8 - COVER_TOP, { bevel: 0.3, material: "gunmetal" });
const TERM_RIGHT = { x: 7.3, y: 7.0, w: 2.6, d: 3.2, r: 0.5 };
plan("valve.term.right", TERM_RIGHT, COVER_TOP, CABLE_Z + 1.8 - COVER_TOP, { bevel: 0.3, material: "gunmetal" });

for (const [colour, termX] of [
  ["red", TERM_LEFT.x],
  ["green", TERM_LEFT.x],
  ["blue", TERM_RIGHT.x],
]) {
  const y = PORTS[colour];
  const p0 = [PORT_X, y, CABLE_Z];
  const p1 = [termX, y, CABLE_Z];
  const hit = CLAMP_X - PORT_X;
  T.tube({
    name: `cable.${colour}`,
    ...H,
    route: [p0, p1],
    r: 0.7,
    chunk: 6,
    gaps: [
      [0, 0.7],
      [hit - CLAMP_T / 2, hit + CLAMP_T / 2],
    ],
    hue: colour,
    tone: "hi",
    material: "rubber",
  });
}

// Pneumatic Metering Piston Assembly
const PIST_Y = 0;
const BODY_R = 2.4;
const SADDLE_H = 0.9;
const PIST_Z = COVER_TOP + SADDLE_H + BODY_R;
const PIST_F = frameOf([0, PIST_Y, PIST_Z], [1, 0, 0], [0, 0, 1]);
const BODY = [-6.1, 2.9];
for (const [index, x] of [-5.1, 0.1].entries()) {
  plan(`valve.saddle.${index}`, { x, y: PIST_Y - 1.9, w: 2.4, d: 3.8, r: 0.5 }, COVER_TOP, SADDLE_H, { material: "gunmetal" });
}
along("valve.piston.body", PIST_F, BODY[0], BODY[1], BODY_R, {
  tone: "hi",
  crease: "lo",
  material: "gunmetal",
  details: { seams: [BODY[0] + 1.6, BODY[1] - 1.6] },
});
const GLAND = [BODY[1], BODY[1] + 1.4];
const glandRadius = (sv) => 2.3 + 0.55 * Math.sqrt(Math.max(0, 1 - ((sv - GLAND[0]) / (GLAND[1] - GLAND[0])) ** 2));
const glandSlope = (sv) => {
  const x = Math.min(0.999, (sv - GLAND[0]) / (GLAND[1] - GLAND[0]));
  return (-0.55 * x) / ((GLAND[1] - GLAND[0]) * Math.sqrt(1 - x * x));
};
T.lathe({
  name: "valve.piston.gland",
  ...H,
  F: PIST_F,
  profile: [
    [GLAND[0], glandRadius(GLAND[0])],
    [GLAND[1], glandRadius(GLAND[1])],
  ],
  radius: glandRadius,
  slope: glandSlope,
  tone: "mid",
  material: "brass",
  details: { bolts: [{ s: GLAND[1], r: 1.75, count: 6, phase: 0.3, size: 0.34, tone: "mid" }] },
});
const ROD_END = 8.9;
along("valve.piston.rod", PIST_F, GLAND[1], ROD_END, 0.95, { tone: "hi", material: "chrome" });
plan("valve.clevis", { x: ROD_END, y: PIST_Y - 1.9, w: 2.4, d: 3.8, r: 0.5 }, COVER_TOP, PIST_Z + 2.4 - COVER_TOP, {
  bevel: 0.3,
  material: "steel",
  details: { dots: [-1, 1].map((side) => ({ at: [PIST_Z, ROD_END + 1.2, PIST_Y + side * 1.9], normal: [0, side, 0], size: 0.42 })) },
});
const BALL_R = 2.2;
const BALL = [BODY[0] - BALL_R, PIST_Y, PIST_Z];
T.ball({ name: "valve.ball", ...H, c: BALL, r: BALL_R, tone: "hi", material: "chrome" });
along("valve.ball.post", VERT(BALL[0], BALL[1]), COVER_TOP, BALL[2] - BALL_R, 1.3, { material: "steel" });

// Braided Steel Impulse Hose + Relief Manifold Block
const HOSE_R = 0.9;
const HOSE_Y = 4.6;
const HOSE_Z = COVER_TOP + 3.3;
const RELIEF = { x: 3.4, y: HOSE_Y - 1.8, w: 3.4, d: 3.6, r: 0.6 };
plan("valve.relief", RELIEF, COVER_TOP, HOSE_Z + 1.9 - COVER_TOP, {
  bevel: 0.3,
  material: "gunmetal",
  details: {
    seams: [COVER_TOP + 1.2],
    dots: [
      [RELIEF.x + 0.8, RELIEF.y + 0.8],
      [RELIEF.x + RELIEF.w - 0.8, RELIEF.y + RELIEF.d - 0.8],
    ].map(([x, y]) => ({ at: [HOSE_Z + 1.9, x, y], normal: [0, 0, 1], size: 0.4 })),
  },
});
const FERRULE = 1.3;
const hoseFrom = [PORT_X, HOSE_Y, HOSE_Z];
const hoseTo = [RELIEF.x, HOSE_Y, HOSE_Z];
along("valve.hose.ferrule.0", frameOf(hoseFrom, [1, 0, 0], [0, 0, 1]), 0, FERRULE, 1.25, {
  owner: "valve.hose",
  material: "brass",
  details: { seams: [0.45] },
});
along("valve.hose.ferrule.1", frameOf(hoseTo, [-1, 0, 0], [0, 0, 1]), 0, FERRULE, 1.25, {
  owner: "valve.hose",
  material: "brass",
  details: { seams: [0.45] },
});
const hoseLength = G.len3(G.sub3(hoseTo, hoseFrom));
T.tube({
  name: "valve.hose",
  ...H,
  route: [hoseFrom, hoseTo],
  r: HOSE_R,
  chunk: 6,
  gaps: [
    [0, FERRULE],
    [hoseLength - FERRULE, hoseLength],
  ],
  rings: { pitch: 1.5, twist: 1.6, cross: true, fade: [0.1, 0.55], tone: "lo" },
  tone: "hi",
  material: "steel",
});

// ---- Hinged 2-Link Gold/Chrome Admission Escapement Arm (Over Station 0 Anvil) ----
const D2R = Math.PI / 180;
const FZ = HUB_TOP + 4.0;
const RL = 2.25;
const DISC_T = 1.15;
const GAP = 0.6;
const L1 = 9.0;
const L2 = 5.4;
const B = [PALM.x + PALM.w, 0, FZ];
const R0 = 3.6;
const d1 = [1, 0, 0];
const wAxis = [0, 1, 0];
const C1 = G.add3(B, G.mul3(d1, R0));
const E1 = G.add3(C1, G.mul3(d1, L1));

const tipOf = (a2) => {
  const d2 = [Math.cos(a2), 0, -Math.sin(a2)];
  const C2 = G.add3(E1, G.mul3(G.unit3(G.add3(d1, d2)), 2 * RL + GAP));
  return { d2, C2, E2: G.add3(C2, G.mul3(d2, L2)), J1: G.mul3(G.add3(E1, C2), 0.5) };
};
let lo = 0;
let hi = 70 * D2R;
for (let it = 0; it < 60; it++) {
  const mid = (lo + hi) / 2;
  if (tipOf(mid).E2[2] - RL > FACE_Z + 1.35) lo = mid;
  else hi = mid;
}
const { d2, C2, E2, J1 } = tipOf(hi);

const g1 = T.group("gate.mcp", { parent: dial, hinge: { point: C1, axis: wAxis, range: [-20, 0] } });
const g2 = T.group("gate.pip", { parent: g1, hinge: { point: J1, axis: wAxis, range: [-14, 0] } });

T.round({
  name: "gate.p1",
  group: g1,
  layer: turret,
  F: frameOf(C1, G.sub3(E1, C1), [0, 0, 1]),
  s0: 0,
  s1: L1,
  r: RL,
  ends: ["dome", "dome"],
  tone: "hi",
  crease: "lo",
  material: "gold",
  details: { seams: [1.3, L1 - 1.3] },
});
const tipLink = T.round({
  name: "gate.p2",
  group: g2,
  layer: turret,
  F: frameOf(C2, G.sub3(E2, C2), [0, 0, 1]),
  s0: 0,
  s1: L2,
  r: RL,
  ends: ["dome", "dome"],
  tone: "hi",
  crease: "lo",
  material: "gold",
  details: { seams: [1.1] },
});

const upN = G.unit3(G.cross3(d2, wAxis));
const up2 = upN[2] > 0 ? upN : G.mul3(upN, -1);
T.prism({
  name: "gate.guide",
  group: g2,
  layer: turret,
  F: { o: C2, a: d2, u: wAxis, v: up2 },
  polygon: [
    [-1.4, RL],
    [1.4, RL],
    [1.05, RL + 0.85],
    [-1.05, RL + 0.85],
  ],
  s0: 1.0,
  s1: L2 - 1.0,
  tone: "mid",
  bevel: 0.25,
  material: "gunmetal",
});

for (const [name, J, rDisc, grp] of [
  ["gate.k0", C1, R0, dial],
  ["gate.k1", J1, 3.3, g1],
]) {
  for (const side of [-1, 1]) {
    const centre = G.add3(J, G.mul3(wAxis, side * (RL + DISC_T / 2)));
    const F = frameOf(centre, G.mul3(wAxis, side), [0, 0, 1]);
    T.round({
      name: `${name}${side > 0 ? "+" : "-"}`,
      group: grp,
      layer: turret,
      F,
      s0: -DISC_T / 2,
      s1: DISC_T / 2,
      r: rDisc,
      tone: "mid",
      material: "chrome",
      details: {
        dots: [{ at: [DISC_T / 2, 0, 0], normal: G.mul3(wAxis, side), size: 0.42 }],
        rings: [{ at: [DISC_T / 2, 0, 0], normal: G.mul3(wAxis, side), r: 0.85, tone: "lo" }],
      },
    });
  }
}

const ledPos = G.add3(E2, G.mul3(d2, RL));
const LED_INFO = { at: ledPos, normal: d2, part: tipLink.name, group: g2.name };
T.billboard({
  part: tipLink,
  at: ledPos,
  normal: d2,
  fade: [0.02, 0.3],
  svg: `<g class="rl-led"><circle r="1.2" class="rl-led-halo"/><circle r="0.65" class="rl-led-body"/><circle r="0.28" class="rl-led-core"/></g>`,
});

// ---- 3D Breakaway Pressure-Relief Poppet Cap (Blows on HTTP 429 Burst / Attack) ----
const POD = [-7, 11.4];
const POD_Z = COVER_TOP + 0.3;
T.round({ name: "valve.poppet.socket", ...H, F: VERT(POD[0], POD[1]), s0: COVER_TOP, s1: POD_Z, r: 1.7, tone: "mid", material: "gunmetal" });
const podGroup = T.group("pod", { parent: dial, free: { origin: [POD[0], POD[1], POD_Z] } });
const hex = Array.from({ length: 6 }, (_, j) => [1.35 * Math.cos(((2 * j + 1) * Math.PI) / 6), 1.35 * Math.sin(((2 * j + 1) * Math.PI) / 6)]);
T.prism({
  name: "valve.poppet.nut",
  group: podGroup,
  layer: turret,
  F: { o: [POD[0], POD[1], 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  polygon: hex,
  s0: POD_Z,
  s1: POD_Z + 1.4,
  tone: "hi",
  crease: "lo",
  bevel: 0.2,
  material: "brass",
});
T.round({
  name: "valve.poppet.cap",
  group: podGroup,
  layer: turret,
  F: VERT(POD[0], POD[1]),
  s0: POD_Z + 1.4,
  s1: POD_Z + 2.0,
  r: 0.9,
  tone: "mid",
  material: "chrome",
  details: { bolts: [{ s: POD_Z + 2.0, r: 0, count: 1, size: 0.4 }] },
});
export const POD_AT = [POD[0], POD[1], POD_Z];

// ---- Build Static Art, Settle Keys & Run Audits ----
base();
backPosts();
midStatic();

const verify = argv.includes("--verify");
const out = T.build({ statics: R.items, poses, verify });
A.settle(R, P);

const layerOf = (name) => R.items.filter((item) => item.layer === name).sort((a, b) => a.key - b.key).map((item) => item.svg);
const BACK = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`, ...layerOf("back")];
const MID = layerOf("mid");
const FRONT = layerOf("front");

if (argv.includes("--audit")) {
  A.auditOrExit(R, P);
  TA.orbitOrExit(T, R, P, {
    sweep: { at: (x) => follow({ dial: x }), from: 0, to: 1440, frame: 0.3 },
    clips: [
      { name: "admit", at: (t) => follow({ dial: 40 + 12 * t, lift: tapAt(t) }), from: 0, to: 4, frame: 1 / 60 },
      { name: "relief", at: (t) => follow({ dial: 100 + 12 * t, lift: 0.3, pod: breakAt(t) }), from: 0, to: BREAK_END, frame: 1 / 60 },
    ],
    quick: argv.includes("--quick"),
    only: argv.find((a) => a.startsWith("--only="))?.slice(7).split(",") ?? null,
    log: argv.includes("--verbose") ? (text) => console.log(`  … ${text}`) : null,
  });
}

// ---- Assemble Pure Anatomy Plate + 4-Layer System Design Workbench ----
const evidence = JSON.parse(readFileSync(join(HERE, "evidence-bundle.json"), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const LABEL =
  "A 3D token-bucket rotary metering valve on a machined instrument bench. A knurled steel carousel drum carries nine brass token slugs and one active chrome metering anvil under a hinged gold escapement arm with an optical status lens, a sub-deck brass window gear visible through a deck cutout, three color-coded telemetry cables, a braided steel impulse hose, and a breakaway brass pressure-relief poppet.";
const backSvg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: LABEL, body: BACK });
const staticSvg = (list) => `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg iso-layer" viewBox="0 0 ${WIDTH} ${HEIGHT}" aria-hidden="true">${list.join("")}</svg>`;
const frontSvg = staticSvg(FRONT);
const canvas = (name) => `<canvas class="iso-layer rl-gl" data-canvas="${name}" aria-hidden="true"></canvas>`;

const stage = `<div class="iso-stage iso-turn rl-stage" tabindex="0" role="slider" aria-label="Token-bucket metering valve: drag the 3D drum, use arrow keys, press Space to send a request, B to blow the relief poppet, or X to trigger Security X-Ray credential stuffing" aria-valuemin="0" aria-valuemax="10" aria-valuenow="10" aria-valuetext="Token Bucket: 10.0 of 10 tokens, last status HTTP 200">${backSvg}${out.layerSvg("lock", { width: WIDTH, height: HEIGHT })}${staticSvg(MID)}${out.layerSvg("dial", { width: WIDTH, height: HEIGHT })}${canvas("back")}${out.layerSvg("turret", { width: WIDTH, height: HEIGHT })}${canvas("front")}${frontSvg}</div>`;

const plate = k.plateHtml({
  fig: "Fig 01 · 3D",
  title: "Token-bucket metering valve",
  hint: "Drag drum · Space request · X attack · B relief",
  readout: "tokens 10.0/10 · 200 OK · 2.0/s",
  keys: [
    { mark: "raised", label: "3D carousel drum & 9 brass token slugs (B = 10)" },
    { mark: "lit", label: "Lit brass index pointer & hinged escapement gate" },
    { mark: "green", label: "200 OK admit sense" },
    { mark: "red", label: "429 throttle / threat sense" },
    { mark: "blue", label: "Refill rate clock (r)" },
  ],
  caption:
    "Every part on the rotary drum is re-projected and re-shaded in true 3D each frame from separating planes. Each 36° step meters one token past the index; exhausting the bucket locks the hinged escapement high, shifts the optical indicator to crimson, and blows the breakaway brass pressure-relief poppet on HTTP 429.",
  body: stage,
});

const otherThemeHref = theme === "light" ? "rate-limiter.html" : "rate-limiter-light.html";
const otherThemeLabel = theme === "light" ? "Switch to Dark Theme" : "Switch to Light Paper Theme";

const reaRowsHtml = evidence.records
  .map(
    (r) =>
      `<tr><td>#${r.ordinal}</td><td>+${r.offset_ms}ms</td><td>${esc(r.path)}</td><td>${esc(r.wave)}</td><td>${r.status}</td><td>${esc(r.headers["x-ratelimit-remaining"])}/${esc(r.headers["x-ratelimit-limit"])}</td><td>${esc(r.headers["retry-after"] ?? "—")}</td><td>${esc(r.headers["x-threat-level"])}</td></tr>`,
  )
  .join("");

const workbenchHtml = `
<div class="sr-only" aria-live="polite" data-live-status></div>
<section class="wb" aria-label="4-Layer System Design Dissection Workbench">
  <div class="wb-card">
    <div class="wb-head">
      <span class="wb-eyebrow">Interactive 3D Control Bench · Pure O(1) Model</span>
      <a class="wb-theme-link" href="${otherThemeHref}">${otherThemeLabel}</a>
    </div>
    <div class="wb-controls">
      <div class="wb-row">
        <div class="wb-seg" role="group" aria-label="Rate limiting algorithm">
          <button type="button" class="wb-btn" data-algo="token-bucket" data-active="true">Token Bucket</button>
          <button type="button" class="wb-btn" data-algo="fixed-window" data-active="false">Fixed Window (2× Trap)</button>
          <button type="button" class="wb-btn" data-algo="gcra" data-active="false">GCRA (Sliding O(1))</button>
        </div>
        <button type="button" class="wb-btn" data-act-send>Send Request</button>
        <button type="button" class="wb-btn" data-act-burst>Burst ×6</button>
        <button type="button" class="wb-btn" data-act-xray data-active="false">Security X-Ray</button>
        <button type="button" class="wb-btn" data-act-attack data-danger="true" data-active="false">Simulate Attack (11 req/s)</button>
        <button type="button" class="wb-btn" data-act-reset>Reset</button>
      </div>
      <div class="wb-sliders">
        <label class="wb-slider">
          <span class="wb-slider-label"><span>Refill Rate (r)</span><strong data-val-refill>2.0 tok/s</strong></span>
          <input type="range" min="0.5" max="6.0" step="0.5" value="2.0" data-slider-refill />
        </label>
        <label class="wb-slider">
          <span class="wb-slider-label"><span>Background Load (λ)</span><strong data-val-load>1.6 req/s</strong></span>
          <input type="range" min="0.0" max="8.0" step="0.4" value="1.6" data-slider-load />
        </label>
      </div>
      <div class="wb-stats">
        <div class="wb-stat"><span class="wb-stat-k">Bucket Tokens</span><span class="wb-stat-v" data-wb-tokens>10.0 / 10</span></div>
        <div class="wb-stat"><span class="wb-stat-k">Last Decision</span><span class="wb-stat-v" data-wb-status data-status="ok">200 OK</span></div>
        <div class="wb-stat"><span class="wb-stat-k">Admitted (200)</span><span class="wb-stat-v" data-wb-admit>0</span></div>
        <div class="wb-stat"><span class="wb-stat-k">Throttled (429)</span><span class="wb-stat-v" data-wb-reject>0</span></div>
        <div class="wb-stat"><span class="wb-stat-k">Adaptive Threat</span><span class="wb-stat-v" data-wb-threat data-status="ok">Off</span></div>
      </div>
      <div class="wb-log" data-wb-log aria-label="Live gateway HTTP trace">
        <div class="wb-log-row"><span>Gateway live · drag the 3D carousel or fire requests above</span><span>READY</span></div>
      </div>
    </div>
  </div>

  <div class="wb-card">
    <div class="wb-tabs" role="tablist" aria-label="Dissection Layers">
      <button type="button" class="wb-tab" role="tab" aria-selected="true" data-wb-tab="pgc">1 · Production Blueprint</button>
      <button type="button" class="wb-tab" role="tab" aria-selected="false" data-wb-tab="rea">2 · Under the Microscope (REA Lab)</button>
      <button type="button" class="wb-tab" role="tab" aria-selected="false" data-wb-tab="sec">3 · Security X-Ray &amp; Playbooks</button>
      <button type="button" class="wb-tab" role="tab" aria-selected="false" data-wb-tab="epm">4 · Product, Scale &amp; Edge Cases</button>
    </div>

    <div class="wb-pane" data-wb-pane="pgc" data-open="true">
      <h3>Production-Grade Coder · Atomic Redis Lua + Complexity</h3>
      <p><strong>Complexity:</strong> Time <code>O(1)</code>, Space <code>O(1)</code> (~96 bytes per active client key in Redis hash → 1M concurrent keys ≈ 96 MB RAM). <strong>Rejected Alternatives:</strong> Naive <code>GET</code> → <code>INCR</code> (race condition under concurrent bursts); Sliding Window Log (<code>O(N)</code> memory per key, blows up under high-QPS tenants).</p>
      <pre class="wb-pre">-- Atomic Redis Lua Token Bucket (single-threaded execution eliminates TOCTOU races)
local key        = KEYS[1]
local cap        = tonumber(ARGV[1])
local rate       = tonumber(ARGV[2])
local now        = tonumber(ARGV[3])
local cost       = tonumber(ARGV[4])
local b          = redis.call('HMGET', key, 'tokens', 'ts')
local tokens     = tonumber(b[1]) or cap
local ts         = tonumber(b[2]) or now
tokens           = math.min(cap, tokens + math.max(0, now - ts) * rate)
local allowed    = 0
if tokens >= cost then tokens = tokens - cost; allowed = 1 end
redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', key, math.ceil((cap / rate) * 2))
local retry      = allowed == 1 and 0 or math.ceil((cost - tokens) / rate)
return {allowed, math.floor(tokens), retry}</pre>
      <div class="wb-grid2">
        <div class="wb-box">
          <span class="wb-badge">Concurrency &amp; Failure</span>
          <p>Choose explicit <strong>fail-open</strong> (public read APIs) vs <strong>fail-closed</strong> (<code>/v1/auth/login</code>, payment endpoints) if Redis times out (&gt;15 ms). Use local edge token-leasing batches for &gt;100k QPS global POPs.</p>
        </div>
        <div class="wb-box">
          <span class="wb-badge">Observability &amp; Supply Chain</span>
          <p>Emit structured OTel metrics (<code>ratelimit.decisions{route,status,threat}</code>) without logging raw IP/API-key secrets; alert on sudden <code>429</code> ratio spikes (&gt;5% over 5m).</p>
        </div>
      </div>
    </div>

    <div class="wb-pane" data-wb-pane="rea" data-open="false">
      <h3>REA Forensic Lab · ${esc(evidence.evidence_id)}</h3>
      <p>Captured passively from our authorized local loopback HTTP/1.1 lab (<code>${esc(evidence.authorization.target)}</code>) · SHA-256 <code>${esc(evidence.source_sha256.slice(0, 24))}…</code> · Redaction verified: <code>${evidence.authorization.redaction_verified}</code>.</p>
      <div class="wb-grid2">
        <div class="wb-box">
          <span class="wb-badge" data-kind="obs">Observed Facts</span>
          <ul class="wb-list">${evidence.observations.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
        </div>
        <div class="wb-box">
          <span class="wb-badge" data-kind="inf">Inferences</span>
          <ul class="wb-list">${evidence.inferences.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
          <span class="wb-badge" data-kind="unk">Unknowns &amp; Limits</span>
          <ul class="wb-list">${evidence.unknowns_and_limits.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
        </div>
      </div>
      <div class="wb-table-wrap">
        <table class="wb-table">
          <thead><tr><th>#</th><th>Offset</th><th>Path</th><th>Wave</th><th>Status</th><th>Rem/Lim</th><th>Retry-After</th><th>Threat</th></tr></thead>
          <tbody>${reaRowsHtml}</tbody>
        </table>
      </div>
    </div>

    <div class="wb-pane" data-wb-pane="sec" data-open="false">
      <h3>Cybersecurity Engineer + Verified Playbooks (6-Framework Mapped)</h3>
      <div class="wb-grid2">
        <div class="wb-box">
          <span class="wb-badge" data-kind="unk">STRIDE &amp; Attack Surface</span>
          <ul class="wb-list">
            <li><strong>Header Spoofing (Spoofing):</strong> Never trust client-supplied <code>X-Forwarded-For</code>; key by verified edge socket IP + authenticated <code>tenant_id</code>/<code>sub</code>.</li>
            <li><strong>Distributed Credential Stuffing (DoS/Brute Force):</strong> Static per-IP buckets fail against rotating botnets; layer per-account + per-ASN + adaptive scoring.</li>
            <li><strong>Redis Outage Bypass (Elevation):</strong> Auth endpoints must fail closed or fall back to local edge GCRA memory table.</li>
          </ul>
        </div>
        <div class="wb-box">
          <span class="wb-badge" data-kind="obs">Verified Cybersec-Playbooks</span>
          <ul class="wb-list">
            <li><code>implementing-api-abuse-detection-with-rate-limiting</code> (adaptive threat tiers + Redis Lua)</li>
            <li><code>implementing-api-rate-limiting-and-throttling</code> (<code>HTTP 429</code> + <code>Retry-After</code>)</li>
            <li><code>analyzing-api-gateway-access-logs</code> (SOC BOLA &amp; burst hunting)</li>
            <li><strong>Frameworks:</strong> OWASP <code>API4:2023</code> · MITRE ATT&amp;CK <code>T1110, T1190</code> · NIST CSF 2.0 <code>PR.PS-01, PR.DS-10, DE.CM-01</code> · NIST 800-53 <code>SC-5</code></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="wb-pane" data-wb-pane="epm" data-open="false">
      <h3>Enterprise Product Manager · Trade-Offs, Multi-Tenancy &amp; FinOps</h3>
      <div class="wb-grid2">
        <div class="wb-box">
          <span class="wb-badge">Critical Edge Cases</span>
          <ul class="wb-list">
            <li><strong>Retry Storm (Metastable Failure):</strong> Without <code>Retry-After</code> + full client jitter, 10k throttled SDKs retry in lockstep and collapse origin gateways.</li>
            <li><strong>Noisy Neighbor Tenant:</strong> Combine global gateway cap + per-tenant tier quota + shuffle-sharded Redis shards so one enterprise whale cannot starve free users.</li>
            <li><strong>Clock Skew:</strong> Use Redis server <code>TIME</code> (not gateway wall clocks) inside Lua scripts.</li>
          </ul>
        </div>
        <div class="wb-box">
          <span class="wb-badge">Unit Economics (Base vs 10x) [Illustrative]</span>
          <ul class="wb-list">
            <li><strong>10k req/s:</strong> Single Redis primary + replica (~$60–$120/mo) handles &gt;80k Lua ops/sec.</li>
            <li><strong>100k+ req/s (10x):</strong> Cloudflare Durable Objects / Edge local quota leasing drops central Redis RPCs by 90%, keeping cost sub-linear.</li>
          </ul>
        </div>
      </div>
      <p class="wb-disclaimer">Engineering guidance, not legal, medical or financial advice; confirm compliance decisions with qualified counsel.</p>
    </div>
  </div>
</section>`;

const DATA = {
  turn: out.data,
  index: INDEX_AT,
  pod: POD_AT,
  breakEnd: BREAK_END,
  gl: {
    W: WIDTH,
    H: HEIGHT,
    camera: glCamera(P),
    led: LED_INFO,
    faceZ: FACE_Z,
    faceR: FACE_R,
    hubR: HUB_R,
    socket: [POD_AT[0], POD_AT[1], POD_AT[2]],
  },
};

const FOLLOW = `const follow = ${follow.toString()};\nconst tapAt = ${tapAt.toString()};\nconst breakAt = ${breakAt.toString()};`;
const CSS = out.css + "\n" + readFileSync(join(HERE, "bench.css"), "utf8");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8")
  .replace("__DATA__", JSON.stringify(DATA))
  .replace("const follow = null;", FOLLOW);

const pageBody = `<style>${CSS}</style>${plate}${workbenchHtml}`;
const page = k.pageHtml({
  title: "Anatomy of System Design · Token-Bucket Metering Valve (3D)",
  theme,
  body: pageBody,
  script: turnScript() + glScript() + (verify ? `window.__isoVerify = ${JSON.stringify(out.verify)};\n` : "") + LIVE,
  width: 720,
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const name = `rate-limiter${verify ? "-verify" : ""}${theme === "light" ? "-light" : ""}.html`;
  writeFileSync(join(HERE, name), page);
  console.log(
    `wrote ${name} · ${(page.length / 1024).toFixed(0)} KB · ${out.report.parts} live 3D parts · ${R.items.length} static items · ${out.report.layers
      .map((l) => `${l.name}: ${l.planar} planes, ${l.dynamic} dynamic`)
      .join(" · ")} · build ${out.report.seconds.toFixed(1)} s`,
  );
}

export { out };
