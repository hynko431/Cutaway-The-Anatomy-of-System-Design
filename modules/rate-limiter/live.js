const DATA = __DATA__;
const follow = null;
const stage = document.querySelector(".rl-stage");
const readout = document.querySelector("[data-readout]");
const liveRegion = document.querySelector("[data-live-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const INDEX = (DATA.index * 180) / Math.PI;

// ---- Rate-Limiter Pure Model (mirrors model.mjs O(1) math) ----
const ALGOS = {
  "token-bucket": "Token Bucket",
  "fixed-window": "Fixed Window",
  gcra: "GCRA (Sliding)",
};
const THREATS = {
  NORMAL: { id: "NORMAL", label: "Normal", rateScale: 1.0, burstScale: 1.0, blockSec: 0 },
  ELEVATED: { id: "ELEVATED", label: "Elevated", rateScale: 0.65, burstScale: 0.8, blockSec: 0 },
  HIGH: { id: "HIGH", label: "High", rateScale: 0.35, burstScale: 0.5, blockSec: 4 },
  CRITICAL: { id: "CRITICAL", label: "Critical", rateScale: 0.15, burstScale: 0.3, blockSec: 8 },
};

const sim = {
  algorithm: "token-bucket",
  capacity: 10,
  refillRate: 2.0,
  arrivalRate: 1.6,
  windowSec: 5.0,
  nowSec: 0,
  tokens: 10,
  windowIndex: 0,
  windowCount: 0,
  tatSec: 0,
  total: 0,
  ok: 0,
  rej: 0,
  consecRej: 0,
  recentReq: 0,
  recentAuthFails: 0,
  recentPaths: 1,
  securityXRay: false,
  attackActive: false,
  threat: THREATS.NORMAL,
  blockedUntil: 0,
  lastStatus: 200,
  lastRetry: 0,
  boundarySpike: false,
  reqAccum: 0,
};

const effParams = () => {
  const cap = Math.max(2, Math.round(sim.capacity * sim.threat.burstScale));
  const rate = Math.max(0.25, Number((sim.refillRate * sim.threat.rateScale).toFixed(2)));
  return { cap, rate };
};

const assessThreat = () => {
  if (!sim.securityXRay) return THREATS.NORMAL;
  let score = 0;
  const errRate = sim.total > 0 ? sim.rej / sim.total : 0;
  if (sim.recentAuthFails > 8 || sim.attackActive) score += 3;
  else if (sim.recentAuthFails > 3) score += 2;
  if (errRate > 0.6) score += 3;
  else if (errRate > 0.3) score += 2;
  if (sim.recentReq > 16) score += 2;
  else if (sim.recentReq > 9) score += 1;
  if (sim.recentPaths > 10) score += 2;
  if (score >= 7) return THREATS.CRITICAL;
  if (score >= 5) return THREATS.HIGH;
  if (score >= 3) return THREATS.ELEVATED;
  return THREATS.NORMAL;
};

// ---- 3D Mechanical State ----
let angle = 0;
let target = 0;
let frame = 0;
let last = 0;
let visible = false;
let touring = !still.matches;
let manualHold = false;
let idle = 0;
let drawn = null;
let clock = 0;
let lift = 0;
let liftTarget = 0;
let broken = 0;
let breaking = null;
let poppetHook;
let alertState = { x: 0, v: 0 };
let alertTarget = 0; // 0 = emerald (200 OK), 0.5 = amber (warn/spike), 1 = crimson (429/crit)
let lastPhaseAnnounced = "";
const SPEED = 14;

const tokenSlotOf = (turn) => {
  const raw = ((((INDEX + 90 - turn) / 36) % 10) + 10) % 10;
  return raw;
};

const announcePhase = (text) => {
  if (!liveRegion || text === lastPhaseAnnounced) return;
  lastPhaseAnnounced = text;
  liveRegion.textContent = text;
};

const describe = () => {
  const { cap } = effParams();
  const tok = Math.max(0, Math.min(cap, sim.tokens)).toFixed(1);
  stage.setAttribute("aria-valuenow", String(Math.round(sim.tokens)));
  stage.setAttribute(
    "aria-valuetext",
    `${ALGOS[sim.algorithm]}: ${tok} of ${cap} tokens, last status HTTP ${sim.lastStatus}${broken ? ", relief poppet blown" : ""}`,
  );
};

const hold = () => {
  touring = false;
  manualHold = true;
  clearTimeout(idle);
  idle = setTimeout(() => {
    manualHold = false;
    touring = !still.matches;
    run();
  }, 4200);
};

let own = false;
const show = (value) => {
  const { cap, rate } = effParams();
  const tokStr = Math.max(0, Math.min(cap, sim.tokens)).toFixed(1);
  const statusTag = sim.lastStatus === 429 ? `429 · retry ${sim.lastRetry}s` : sim.boundarySpike ? "200 · 2× edge spike" : "200 OK";
  const text = `tokens ${tokStr}/${cap} · ${statusTag} · ${rate.toFixed(1)}/s${broken ? " · relief blown" : ""}`;
  if (readout && readout.textContent !== text) readout.textContent = text;
  // Sync visual alert attribute on stage for SVG fallback tint
  const level = sim.lastStatus === 429 || sim.threat.id === "CRITICAL" ? "crit" : sim.boundarySpike || sim.threat.id !== "NORMAL" ? "warn" : "ok";
  if (stage.getAttribute("data-alert") !== level) stage.setAttribute("data-alert", level);
  void value;
};

const poppetAt = () => {
  if (!breaking && poppetHook !== undefined) return poppetHook;
  if (!breaking) return broken ? breakAt(DATA.breakEnd) : null;
  const t = Math.min(DATA.breakEnd, breaking.time);
  return breakAt(breaking.reverse ? DATA.breakEnd - t : t);
};

let paint = () => {};
const controller = TURN.mount(stage, DATA.turn, {
  follow,
  onHold: () => {
    touring = false;
    manualHold = true;
    clearTimeout(idle);
  },
  onFrame: (turned) => {
    const value = turned.values.dial;
    if (!own) {
      angle = target = drawn = value;
      lift = turned.values.lift ?? lift;
      if ("pod" in turned.values) poppetHook = turned.values.pod;
      describe();
    }
    show(value);
    paint();
  },
});

// ---- WebGL Optical Indicator Pool & 429 Relief Sparks (Light & Dark Paper Parity) ----
const GLD = DATA.gl;
const LIGHT = (stage.closest("[data-theme]")?.getAttribute("data-theme") ?? "dark") !== "dark" ? 1 : 0;
const INK = `
uniform float uLight;
vec4 over(vec4 top,vec4 under){return top+under*(1.-top.a);}
vec4 inkFor(vec3 seen,float cover){vec3 absorbed=1.-seen;float a=max(max(absorbed.r,max(absorbed.g,absorbed.b)),cover);return vec4(vec3(a)-absorbed,a);}
vec4 finish(vec4 ink,vec2 frag){ink.rgb=min(ink.rgb,vec3(ink.a));float n=(hash12(frag)-.5)/255.*smoothstep(0.,1.5/255.,ink.a);return clamp(ink+vec4(n),0.,1.);}
`;

const BACK = `${glslPose("Dial")}${INK}
uniform vec3 uLed;
uniform vec3 uLedDir;
uniform float uOn;
uniform float uAlert;
const float FACE_Z=${GLD.faceZ.toFixed(3)};
const float FACE_R=${GLD.faceR.toFixed(3)};
const float HUB_R=${GLD.hubR.toFixed(3)};
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 p=onFloor(vb,FACE_Z);
  vec3 q=toDial(p);
  float r=length(q.xy);
  float face=(1.-smoothstep(FACE_R-3.,FACE_R-1.,r))*smoothstep(HUB_R+.2,HUB_R+1.6,r);
  vec3 v=p-uLed;
  float d2=dot(v,v);
  float d=sqrt(d2);
  float lens=.3+.7*pow(max(0.,dot(v/d,uLedDir)),1.5);
  float lambert=max(0.,(uLed.z-FACE_Z+.6)/d);
  float grain=.84+.16*noise2(vec2(atan(q.y,q.x)*180.,r*.6));
  float e=420.*lens*lambert/(d2+10.)*grain*face;
  float lit=1.-exp(-e);
  vec3 okTint=vec3(.38,.82,.58);
  vec3 warnTint=vec3(.92,.64,.24);
  vec3 critTint=vec3(.88,.30,.36);
  vec3 tint=uAlert<.5?mix(okTint,warnTint,uAlert*2.):mix(warnTint,critTint,(uAlert-.5)*2.);
  vec4 light=inkFor(mix(vec3(1.),tint,.72*lit),0.);
  vec3 okGlow=vec3(.25,1.,.58);
  vec3 warnGlow=vec3(1.,.72,.22);
  vec3 critGlow=vec3(1.,.30,.36);
  vec3 glowCol=uAlert<.5?mix(okGlow,warnGlow,uAlert*2.):mix(warnGlow,critGlow,(uAlert-.5)*2.);
  vec3 glow=glowCol*lit*.55;
  vec4 dark=vec4(glow,max(glow.r,max(glow.g,glow.b)));
  gl_FragColor=finish(mix(dark,light,uLight)*uOn,gl_FragCoord.xy);
}`;

const FRONT = `${GLSL_TURN}${INK}
uniform vec2 uLedVb;
uniform float uLedR;
uniform float uLedFace;
uniform float uOn;
uniform float uAlert;
uniform vec4 uSpark[24];
uniform float uSparkHeat[24];
vec4 sparkInk(float heat,float along,float young){
  vec3 tail=mix(vec3(.78,.2,.04),vec3(1.,.55,.08),smoothstep(.35,.8,heat));
  vec3 head=mix(tail,vec3(1.,.74,.2),smoothstep(.55,.9,heat)*smoothstep(.5,1.,along));
  vec3 seen=mix(head,vec3(1.,.95,.82),young*smoothstep(.8,1.,along));
  float a=.88*smoothstep(0.,.3,along)*smoothstep(.12,.45,heat);
  vec4 light=vec4(seen*a,a);
  vec3 hot=mix(vec3(1.,.35,.05),vec3(1.,.9,.6),young*along)*(.4+.6*heat);
  vec4 dark=vec4(hot*a,a);
  return mix(dark,light,uLight);
}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  float px=uView.x/uCanvas.x;
  float soft=.7*px;
  float d=length(vb-uLedVb);
  float body=1.-smoothstep(uLedR-.6*px,uLedR+.6*px,d);
  float core=1.-smoothstep(uLedR*.32,uLedR*.55+.5*px,d);
  float rim=smoothstep(uLedR*.55,uLedR,d);
  vec3 okL=vec3(.18,.70,.43);
  vec3 warnL=vec3(.84,.48,.12);
  vec3 critL=vec3(.82,.20,.26);
  vec3 baseL=uAlert<.5?mix(okL,warnL,uAlert*2.):mix(warnL,critL,(uAlert-.5)*2.);
  vec3 rimL=baseL*.72;
  vec3 seen=mix(mix(baseL,rimL,rim),vec3(.96,.98,.95),core);
  vec4 lightLed=inkFor(seen,.92)*body;
  vec3 okD=vec3(.2,1.,.55);
  vec3 warnD=vec3(1.,.72,.22);
  vec3 critD=vec3(1.,.28,.34);
  vec3 baseD=uAlert<.5?mix(okD,warnD,uAlert*2.):mix(warnD,critD,(uAlert-.5)*2.);
  vec3 hot=mix(baseD,vec3(.95,.98,.96),core)*body;
  vec4 darkLed=vec4(hot,body);
  vec4 led=mix(darkLed,lightLed,uLight)*smoothstep(.02,.3,uLedFace)*uOn;
  vec4 sparks=vec4(0.);
  float w=max(.35+.6*px,1.25*px);
  for(int i=0;i<24;i++){
    float heat=uSparkHeat[i];
    if(heat<=0.)continue;
    vec4 s=uSpark[i];
    vec2 a=s.zw;
    vec2 b=s.xy;
    vec2 ab=b-a;
    float l2=max(dot(ab,ab),1e-6);
    float t=clamp(dot(vb-a,ab)/l2,0.,1.);
    float dist=length(vb-a-ab*t);
    float cover=1.-smoothstep(w*.5-.5*px,w*.5+.5*px,dist);
    if(cover<=0.)continue;
    sparks=over(sparkInk(heat,t,step(.65,heat))*cover,sparks);
  }
  vec4 ink=over(sparks,led)*(1.-coverOf(vb,soft));
  gl_FragColor=finish(ink,gl_FragCoord.xy);
}`;

const canvasOf = (name) => stage.querySelector(`[data-canvas="${name}"]`);
const view = [GLD.W, GLD.H];
const backLayer = glLayer({
  canvas: canvasOf("back"),
  fragment: BACK,
  view,
  camera: GLD.camera,
  uniforms: ["uLed", "uLedDir", "uOn", "uAlert", "uDialX", "uDialY", "uDialZ", "uDialT"],
  fixed: { uLight: LIGHT },
});
const frontLayer = backLayer
  ? glLayer({
      canvas: canvasOf("front"),
      fragment: FRONT,
      view,
      camera: GLD.camera,
      uniforms: ["uLedVb", "uLedR", "uLedFace", "uOn", "uAlert", "uSpark", "uSparkHeat", "uCoverEdge", "uCoverCount"],
      fixed: { uLight: LIGHT },
    })
  : null;
const roomy = frontLayer ? frontLayer.gl.getParameter(frontLayer.gl.MAX_FRAGMENT_UNIFORM_VECTORS) >= 128 : false;
if (backLayer && frontLayer && roomy) stage.setAttribute("data-gl", "");

const SPARKS = 24;
const sparkData = new Float32Array(SPARKS * 4);
const sparkHeat = new Float32Array(SPARKS);
const sparks = [];
let first = { x: 0, v: 0 };
let glClock = 0;
let seed = 17;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const ignite = () => {
  const at = controller.anchor("dial", GLD.socket).world;
  for (let i = 0; i < SPARKS; i++) {
    const a = random() * Math.PI * 2;
    const tilt = 0.35 + random() * 0.9;
    const speed = 16 + random() * 22;
    sparks[i] = {
      p: at.slice(),
      v: [Math.cos(a) * Math.sin(tilt) * speed, Math.sin(a) * Math.sin(tilt) * speed, Math.cos(tilt) * speed],
      age: -random() * 0.08,
      life: 0.3 + random() * 0.45,
    };
  }
};

const stepSparks = (dt) => {
  let live = false;
  for (let i = 0; i < SPARKS; i++) {
    const s = sparks[i];
    sparkHeat[i] = 0;
    if (!s) continue;
    s.age += dt;
    if (s.age < 0) {
      live = true;
      continue;
    }
    if (s.age > s.life) {
      sparks[i] = null;
      continue;
    }
    s.v[2] -= 98 * dt;
    for (let c = 0; c < 3; c++) s.p[c] += s.v[c] * dt;
    if (s.p[2] < GLD.faceZ) {
      sparks[i] = null;
      continue;
    }
    live = true;
  }
  return live;
};

const writeSparks = () => {
  const w = controller.cams().world;
  const project = (p) => [
    w.ox + w.m[0] * p[0] + w.m[1] * p[1] + w.m[2] * p[2],
    w.oy + w.m[3] * p[0] + w.m[4] * p[1] + w.m[5] * p[2],
  ];
  for (let i = 0; i < SPARKS; i++) {
    const s = sparks[i];
    if (!s || s.age < 0) {
      sparkHeat[i] = 0;
      continue;
    }
    const head = project(s.p);
    const tail = project([s.p[0] - s.v[0] * 0.05, s.p[1] - s.v[1] * 0.05, s.p[2] - s.v[2] * 0.05]);
    sparkData.set([head[0], head[1], tail[0], tail[1]], 4 * i);
    sparkHeat[i] = 1 - s.age / s.life;
  }
};

paint = () => {
  if (!stage.hasAttribute("data-gl")) return;
  const led = controller.anchor(GLD.led.group, GLD.led.at, GLD.led.normal);
  const world = controller.cams().world;
  const facing = led.direction[0] * world.V[0] + led.direction[1] * world.V[1] + led.direction[2] * world.V[2];
  const on = first.x;
  const al = alertState.x;
  backLayer.draw(
    { uLed: led.world, uLedDir: led.direction, uOn: on, uAlert: al, ...TURN.poseUniforms(controller, "dial", "uDial") },
    glClock,
  );
  writeSparks();
  const live = sparks.some(Boolean);
  const cover = TURN.cover(controller, live ? [[GLD.led.part], ["valve.poppet.socket"]] : [GLD.led.part]);
  frontLayer.draw(
    {
      uLedVb: led.screen,
      uLedR: 0.56 * world.k,
      uLedFace: facing,
      uOn: on,
      uAlert: al,
      uSpark: sparkData,
      uSparkHeat: sparkHeat,
      uCoverEdge: cover.uCoverEdge,
      uCoverCount: cover.uCoverCount,
    },
    glClock,
  );
  const u = on;
  const alpha = 0.92;
  stage.style.setProperty("--rl-fallback", String(Math.max(0, (1 - u) / (1 - u * alpha + 1e-6))));
};

// ---- Workbench DOM Wiring ----
const elTokens = document.querySelector("[data-wb-tokens]");
const elStatus = document.querySelector("[data-wb-status]");
const elAdmit = document.querySelector("[data-wb-admit]");
const elReject = document.querySelector("[data-wb-reject]");
const elThreat = document.querySelector("[data-wb-threat]");
const elLog = document.querySelector("[data-wb-log]");
const logEntries = [];

const appendLog = (code, path, rem, retry, note) => {
  if (!elLog) return;
  const stamp = sim.nowSec.toFixed(1).padStart(5, " ");
  logEntries.unshift({ code, path, rem, retry, note, stamp });
  if (logEntries.length > 18) logEntries.length = 18;
  elLog.innerHTML = logEntries
    .map(
      (r) =>
        `<div class="wb-log-row" data-code="${r.code}"><span>t=${r.stamp}s · ${r.path}</span><span class="wb-code">HTTP ${r.code} · rem=${r.rem}${r.retry ? ` · Retry-After=${r.retry}s` : ""}${r.note ? ` · ${r.note}` : ""}</span></div>`,
    )
    .join("");
};

const syncWorkbenchStats = () => {
  const { cap } = effParams();
  if (elTokens) elTokens.textContent = `${Math.max(0, Math.min(cap, sim.tokens)).toFixed(1)} / ${cap}`;
  if (elStatus) {
    elStatus.textContent = sim.lastStatus === 429 ? `429 (Retry ${sim.lastRetry}s)` : sim.boundarySpike ? "200 (2× Spike!)" : "200 OK";
    elStatus.setAttribute("data-status", sim.lastStatus === 429 ? "crit" : sim.boundarySpike ? "warn" : "ok");
  }
  if (elAdmit) elAdmit.textContent = String(sim.ok);
  if (elReject) elReject.textContent = String(sim.rej);
  if (elThreat) {
    elThreat.textContent = sim.securityXRay ? sim.threat.label : "Off";
    elThreat.setAttribute(
      "data-status",
      !sim.securityXRay || sim.threat.id === "NORMAL" ? "ok" : sim.threat.id === "CRITICAL" ? "crit" : "warn",
    );
  }
};

const triggerPoppet = (blow) => {
  poppetHook = undefined;
  if (blow && !broken && !breaking) {
    breaking = { reverse: false, time: 0 };
    announcePhase("Pressure relief poppet blown on HTTP 429 burst");
  } else if (!blow && (broken || (breaking && !breaking.reverse))) {
    breaking = { reverse: true, time: breaking ? DATA.breakEnd - breaking.time : 0 };
    announcePhase("Pressure relief poppet reset");
  }
};

const fireRequest = ({ path = "/v1/orders", isAuthFailure = false } = {}) => {
  sim.total += 1;
  sim.recentReq += 1;
  if (isAuthFailure) sim.recentAuthFails += 1;
  if (sim.attackActive) sim.recentPaths = Math.min(64, sim.recentPaths + 1.4);
  sim.threat = assessThreat();
  const { cap, rate } = effParams();

  let allowed = false;
  let retry = 0;
  let note = "";
  sim.boundarySpike = false;

  if (sim.securityXRay && sim.nowSec < sim.blockedUntil) {
    allowed = false;
    retry = Math.max(1, Math.ceil(sim.blockedUntil - sim.nowSec));
    note = "ADAPTIVE BLOCK";
  } else if (sim.algorithm === "token-bucket") {
    if (sim.tokens >= 1) {
      sim.tokens -= 1;
      allowed = true;
    } else {
      retry = Math.max(1, Math.ceil((1 - sim.tokens) / rate));
    }
  } else if (sim.algorithm === "fixed-window") {
    const idx = Math.floor(sim.nowSec / sim.windowSec);
    if (idx !== sim.windowIndex) {
      sim.windowIndex = idx;
      sim.windowCount = 0;
    }
    const elapsed = sim.nowSec - sim.windowIndex * sim.windowSec;
    if (sim.windowCount + 1 <= cap) {
      sim.windowCount += 1;
      sim.tokens = Math.max(0, cap - sim.windowCount);
      allowed = true;
      if ((elapsed > sim.windowSec * 0.78 || elapsed < sim.windowSec * 0.22) && sim.recentReq > cap * 1.1) {
        sim.boundarySpike = true;
        note = "2x EDGE SPIKE";
      }
    } else {
      sim.tokens = 0;
      retry = Math.max(1, Math.ceil(sim.windowSec - elapsed));
    }
  } else {
    // GCRA O(1)
    const T = 1 / rate;
    const tau = (cap - 1) * T;
    const tat = Math.max(sim.nowSec, sim.tatSec);
    const allowAt = tat - tau;
    if (sim.nowSec >= allowAt) {
      sim.tatSec = tat + T;
      allowed = true;
      sim.tokens = Math.max(0, Math.min(cap, cap - (sim.tatSec - sim.nowSec) / T));
    } else {
      sim.tokens = 0;
      retry = Math.max(1, Math.ceil(allowAt - sim.nowSec));
    }
  }

  if (allowed) {
    sim.ok += 1;
    sim.consecRej = 0;
    sim.lastStatus = 200;
    sim.lastRetry = 0;
    // Dip escapement arm to admit token & step rotor smoothly by 1 chamber (36 deg)
    target -= 36;
    liftTarget = 0.0;
    alertTarget = sim.boundarySpike || sim.threat.id !== "NORMAL" ? 0.5 : 0.0;
    if (broken && sim.tokens > cap * 0.45 && !sim.attackActive) triggerPoppet(false);
  } else {
    sim.rej += 1;
    sim.consecRej += 1;
    sim.lastStatus = 429;
    sim.lastRetry = retry;
    // Lock escapement arm high & blow 3D pressure-relief poppet on repeated overflow
    liftTarget = 1.0;
    alertTarget = 1.0;
    if (sim.securityXRay && sim.threat.blockSec > 0 && sim.consecRej >= 3) {
      sim.blockedUntil = sim.nowSec + sim.threat.blockSec;
      note = "ADAPTIVE BLOCK";
    }
    if (sim.consecRej >= 2) triggerPoppet(true);
  }

  appendLog(sim.lastStatus, path, Math.floor(sim.tokens), retry, note);
  syncWorkbenchStats();
  describe();
  run();
};

const draw = () => {
  own = true;
  controller.set({ dial: angle, lift, pod: poppetAt() });
  own = false;
  drawn = angle;
};

// Adaptive half-rate guard for dense 3D frames (references/3d.md section 15)
let avgMs = 4;
let halfRate = false;
let skipFrame = false;

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (calm) {
    touring = false;
    clearTimeout(idle);
  }

  // Advance physical rate-limiter clock & refill
  sim.nowSec += dt;
  const { cap, rate } = effParams();
  sim.tokens = Math.min(cap, sim.tokens + dt * rate);
  const idx = Math.floor(sim.nowSec / sim.windowSec);
  if (idx !== sim.windowIndex) {
    sim.windowIndex = idx;
    sim.windowCount = 0;
  }
  sim.recentReq *= Math.exp(-dt / 4.0);
  if (!sim.attackActive) {
    sim.recentAuthFails = Math.max(0, sim.recentAuthFails * Math.exp(-dt / 3.0));
    sim.recentPaths = Math.max(1, 1 + (sim.recentPaths - 1) * Math.exp(-dt / 4.0));
  }
  sim.threat = assessThreat();

  // Drive arrivals while touring or during active load / attack
  const activeLoad = sim.attackActive ? 11.0 : !manualHold && !calm ? sim.arrivalRate : 0;
  if (activeLoad > 0) {
    sim.reqAccum += dt * activeLoad;
    while (sim.reqAccum >= 1) {
      sim.reqAccum -= 1;
      fireRequest({
        path: sim.attackActive ? "/v1/auth/login" : "/v1/orders",
        isAuthFailure: sim.attackActive,
      });
    }
  }

  if (touring && activeLoad === 0) {
    target += SPEED * dt;
    clock += dt;
  } else {
    clock += dt;
  }

  angle = calm ? target : angle + (target - angle) * (1 - Math.exp(-dt / 0.14));
  if (Math.abs(target - angle) < 1e-3) angle = target;

  const desiredLift = sim.lastStatus === 429 ? 1.0 : touring ? tapAt(clock) * 0.55 : liftTarget;
  const nextLift = calm ? 0 : lift + (desiredLift - lift) * (1 - Math.exp(-dt / 0.14));
  let moved = Math.abs(nextLift - lift) > 1e-5;
  lift = nextLift;

  glClock += dt;
  const beforeOn = first.x;
  const lighting = stage.hasAttribute("data-gl") && settle(first, 1, dt, 0.35, calm);
  if (first.x !== beforeOn) moved = true;
  const beforeAlert = alertState.x;
  const shifting = settle(alertState, alertTarget, dt, 0.32, calm);
  if (alertState.x !== beforeAlert) moved = true;
  const sparking = stage.hasAttribute("data-gl") && stepSparks(calm ? 1 : dt);
  if (lighting || sparking || shifting) moved = true;

  if (breaking) {
    if (!breaking.reverse && breaking.time === 0 && !calm) ignite();
    breaking.time += calm ? DATA.breakEnd : dt;
    moved = true;
    if (breaking.time >= DATA.breakEnd) {
      broken = breaking.reverse ? 0 : 1;
      breaking = null;
      describe();
    }
  }

  syncWorkbenchStats();

  if (moved || drawn === null || Math.abs(angle - drawn) > 1e-4) {
    if (halfRate && skipFrame) {
      skipFrame = false;
    } else {
      skipFrame = true;
      const t0 = performance.now();
      draw();
      const elapsed = performance.now() - t0;
      avgMs = avgMs * 0.88 + elapsed * 0.12;
      if (avgMs > 14) halfRate = true;
      else if (avgMs < 9) halfRate = false;
    }
  }

  const settled = !touring && activeLoad === 0 && angle === target && !breaking && !lighting && !sparking && !shifting;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}

const run = () => {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};

new IntersectionObserver(
  (entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  },
  { rootMargin: "120px 0px" },
).observe(stage);

// ---- Direct 3D Pointer Drag on the Metering Drum ----
let drag = null;
stage.addEventListener("pointerdown", (event) => {
  hold();
  drag = { from: controller.angleAt(event.clientX, event.clientY, 17.2, "dial"), base: target, id: event.pointerId, captured: false };
});
stage.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  hold();
  const now = controller.angleAt(event.clientX, event.clientY, 17.2, "dial");
  const delta = now - drag.from;
  if (!drag.captured && Math.abs(delta) > 1.5) {
    drag.captured = true;
    stage.setPointerCapture(event.pointerId);
    stage.setAttribute("data-drag", "");
  }
  if (!drag.captured) return;
  target = drag.base + delta;
  sim.tokens = Math.max(0, Math.min(effParams().cap, tokenSlotOf(target)));
  describe();
  run();
});
const release = (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  drag = null;
  stage.removeAttribute("data-drag");
  try {
    stage.releasePointerCapture(event.pointerId);
  } catch {}
};
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);

// ---- Keyboard Controls ----
stage.addEventListener("keydown", (event) => {
  if (event.key === "b" || event.key === "B") {
    event.preventDefault();
    triggerPoppet(!broken);
    run();
    return;
  }
  if (event.key === " ") {
    event.preventDefault();
    fireRequest({ path: "/v1/orders" });
    return;
  }
  if (event.key === "x" || event.key === "X") {
    event.preventDefault();
    toggleAttack();
    return;
  }
  const step = event.shiftKey ? 36 : 3.6;
  let next = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.round(target / 3.6) * 3.6 - step;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.round(target / 3.6) * 3.6 + step;
  if (event.key === "Home") next = INDEX + 90 - 360 * Math.round((INDEX + 90 - target) / 360);
  if (next === null) return;
  event.preventDefault();
  hold();
  target = next;
  describe();
  run();
});

// ---- Workbench Button / Slider / Tab Handlers ----
document.querySelectorAll("[data-algo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    sim.algorithm = btn.getAttribute("data-algo");
    sim.windowCount = 0;
    sim.tatSec = sim.nowSec;
    sim.tokens = effParams().cap;
    document.querySelectorAll("[data-algo]").forEach((b) => b.setAttribute("data-active", String(b === btn)));
    announcePhase(`Switched algorithm to ${ALGOS[sim.algorithm]}`);
    syncWorkbenchStats();
    describe();
    run();
  });
});

const rSlider = document.querySelector("[data-slider-refill]");
const rVal = document.querySelector("[data-val-refill]");
if (rSlider) {
  rSlider.addEventListener("input", () => {
    sim.refillRate = Number(rSlider.value);
    if (rVal) rVal.textContent = `${sim.refillRate.toFixed(1)} tok/s`;
    run();
  });
}

const lSlider = document.querySelector("[data-slider-load]");
const lVal = document.querySelector("[data-val-load]");
if (lSlider) {
  lSlider.addEventListener("input", () => {
    sim.arrivalRate = Number(lSlider.value);
    manualHold = false;
    if (lVal) lVal.textContent = `${sim.arrivalRate.toFixed(1)} req/s`;
    run();
  });
}

document.querySelector("[data-act-send]")?.addEventListener("click", () => {
  fireRequest({ path: "/v1/orders" });
});

document.querySelector("[data-act-burst]")?.addEventListener("click", () => {
  for (let i = 0; i < 6; i++) fireRequest({ path: "/v1/orders" });
});

const attackBtn = document.querySelector("[data-act-attack]");
const toggleAttack = () => {
  sim.attackActive = !sim.attackActive;
  sim.securityXRay = sim.attackActive || sim.securityXRay;
  if (attackBtn) attackBtn.setAttribute("data-active", String(sim.attackActive));
  const xrayBtn = document.querySelector("[data-act-xray]");
  if (xrayBtn) xrayBtn.setAttribute("data-active", String(sim.securityXRay));
  if (!sim.attackActive) {
    sim.blockedUntil = 0;
    sim.consecRej = 0;
    alertTarget = 0;
    triggerPoppet(false);
    announcePhase("Credential stuffing simulation stopped");
  } else {
    announcePhase("Security X-Ray active: credential stuffing burst on /v1/auth/login");
  }
  syncWorkbenchStats();
  run();
};
attackBtn?.addEventListener("click", toggleAttack);

const xrayBtn = document.querySelector("[data-act-xray]");
xrayBtn?.addEventListener("click", () => {
  sim.securityXRay = !sim.securityXRay;
  if (!sim.securityXRay) {
    sim.attackActive = false;
    sim.blockedUntil = 0;
    if (attackBtn) attackBtn.setAttribute("data-active", "false");
  }
  xrayBtn.setAttribute("data-active", String(sim.securityXRay));
  sim.threat = assessThreat();
  syncWorkbenchStats();
  run();
});

document.querySelector("[data-act-reset]")?.addEventListener("click", () => {
  sim.tokens = sim.capacity;
  sim.windowCount = 0;
  sim.tatSec = sim.nowSec;
  sim.total = sim.ok = sim.rej = sim.consecRej = 0;
  sim.recentReq = sim.recentAuthFails = 0;
  sim.recentPaths = 1;
  sim.blockedUntil = 0;
  sim.attackActive = false;
  sim.lastStatus = 200;
  sim.lastRetry = 0;
  sim.boundarySpike = false;
  alertTarget = 0;
  liftTarget = 0;
  logEntries.length = 0;
  if (elLog) elLog.innerHTML = `<div class="wb-log-row"><span>Machine reset · bucket full (${sim.capacity}/${sim.capacity})</span><span>READY</span></div>`;
  if (attackBtn) attackBtn.setAttribute("data-active", "false");
  triggerPoppet(false);
  syncWorkbenchStats();
  describe();
  run();
});

// 4-Layer Tab Switcher
document.querySelectorAll("[data-wb-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const id = tab.getAttribute("data-wb-tab");
    document.querySelectorAll("[data-wb-tab]").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    document.querySelectorAll("[data-wb-pane]").forEach((p) => p.setAttribute("data-open", String(p.getAttribute("data-wb-pane") === id)));
  });
});

if (still.matches) touring = false;
syncWorkbenchStats();
draw();
describe();
