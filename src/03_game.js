"use strict";
/* ===== Zustand, Speichern ===== */
const cv = $("cv"), ctx = cv.getContext("2d");
let VW = 0, VH = 0, DPR = 1, L = null, time = 0;
const SAVEKEY = "schleimmerge.v1";
const newLane = () => ({ lvl: 0, stage: 1, hp: hpOf(1), chest: 0 });
const ownedUnits = sl => { let u = 0; for (const v of S.grid) if (v > 0) u += Math.pow(2, v - sl); for (const l of S.lanes) if (l.lvl > 0) u += Math.pow(2, l.lvl - sl); return u; };
const fresh = () => ({ v: 1, coins: 30, grid: [1, 1, 0, 0, 0, 0, 0, 0, 0], lanes: [newLane(), newLane(), newLane()], buys: {}, best: 1, kills: 0, merges: 0, saved: Date.now() });
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVEKEY));
    if (s && s.v === 1 && Array.isArray(s.grid) && s.grid.length === 9 && Array.isArray(s.lanes) && s.lanes.length === 3) {
      s.grid = s.grid.map(v => clamp(v | 0, 0, MAXLVL));
      s.lanes.forEach(l => { l.lvl = clamp(l.lvl | 0, 0, MAXLVL); l.stage = Math.max(1, l.stage | 0); if (!(l.hp > 0)) l.hp = hpOf(l.stage); l.chest = l.chest | 0; });
      s.buys = s.buys || {}; s.merges = s.merges | 0; s.kills = s.kills | 0; if (!(s.coins >= 0)) s.coins = 0;
      s.best = Math.max(1, s.best | 0, ...s.grid, ...s.lanes.map(l => l.lvl)); return s;
    }
  } catch (e) { }
  return null;
}
const S = load() || fresh();
function save() { S.saved = Date.now(); try { localStorage.setItem(SAVEKEY, JSON.stringify(S)); } catch (e) { } }

/* Laufzeit (wird nicht gespeichert) */
const R = [0, 1, 2].map(() => ({ atk: 0, swing: 0, hit: 0, dying: 0, spawn: 1, chestAnim: 0, chestBump: 0 }));
const gridPop = Array(9).fill(0), lanePop = [0, 0, 0];
let parts = [], floats = [], drag = null, buyPress = 0, buyShake = 0, counterBump = 0, listScroll = 0, banner = null;
let bgC = null, btnUp = null, btnDn = null, bestShown = 0;

/* ===== Geräusche (kleine selbst erzeugte Töne) ===== */
let AC = null, lastHitSfx = 0;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === "suspended") AC.resume(); return AC; }
function tone(f, dur, type, vol, slide, delay) {
  if (S.mute || !AC) return; const t0 = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type || "sine"; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t0 + dur);
  g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + dur + .03);
}
const sfx = {
  merge(l) { const f = 330 * Math.pow(1.0595, Math.min(24, l * 1.5)); tone(f, .12, "triangle", .09); tone(f * 1.5, .18, "triangle", .08, 1, .08); },
  buy() { tone(520, .07, "sine", .07, 1.3); tone(780, .1, "sine", .06, 1, .06); },
  move() { tone(300, .05, "sine", .05, 1.3); },
  hit() { const n = performance.now(); if (n - lastHitSfx < 90) return; lastHitSfx = n; tone(200 + Math.random() * 60, .07, "triangle", .035, .6); },
  kill() { tone(420, .14, "square", .035, 1.8); },
  chest() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .16, "triangle", .07, 1, i * .07)); },
  fail() { tone(160, .16, "sawtooth", .04, .7); },
  del() { tone(380, .18, "triangle", .06, .35); }
};
/* Verdienst, während das Spiel zu war (halbe Kraft, damit Dranbleiben sich lohnt) */
function offlineProgress(sec) {
  let gain = 0, kills = 0;
  for (let i = 0; i < 3; i++) {
    const ln = S.lanes[i]; if (!ln.lvl) continue; const dps = dpsOf(ln.lvl) * .5; let t = sec, hp = ln.hp, guard = 0;
    while (t > 0 && guard++ < 100000) {
      const need = hp / dps;
      if (need > t) { hp -= dps * t; t = 0; }
      else { t -= need + 1; const r = rewardOf(ln.stage); gain += r; kills++; ln.chest++; if (ln.chest >= CHEST_EVERY) { ln.chest = 0; gain += r * 3; } ln.stage++; hp = hpOf(ln.stage); }
    }
    ln.hp = Math.max(1, hp);
  }
  S.coins += gain; S.kills += kills; return { gain, kills };
}

/* Jeder Boss ist einzigartig: Kopfstück wechselt, und nach jedem Durchlauf durch alle Monsterarten kommt ein neuer Farbton dazu */
const monInfo = st => { const n = Math.floor((st - 1) / 10) + 1, boss = isBoss(st); return { kind: (n - 1) % MONS.length, tint: Math.floor((st - 1) / 60), boss, acc: (n - 1 + Math.floor((n - 1) / MONS.length)) % 6, deg: boss ? Math.floor((n - 1) / MONS.length) * 61 : 0 }; };
const getL = r => r.t === "g" ? S.grid[r.i] : S.lanes[r.i].lvl;
const setL = (r, v) => { if (r.t === "g") S.grid[r.i] = v; else S.lanes[r.i].lvl = v; if (v > S.best) S.best = v; };
const popOf = r => r.t === "g" ? gridPop : lanePop;
const refRect = r => r.t === "g" ? L.cells[r.i] : L.lanes[r.i].slot;
const freeCell = () => S.grid.indexOf(0);

/* ===== Layout (Querformat: Sammlung | Raster | Kampfbahnen, Hochformat: Kampfbahnen oben, Raster unten) ===== */
function layout() {
  const W = VW, H = VH, land = W / H >= 1.15; L = { land, W, H, cells: [], lanes: [] };
  let cs, gap, gw, gx, gy;
  if (land) {
    const listW = clamp(W * .085, 62, 120); L.list = { x: 0, y: 0, w: listW, h: H };
    const rx = listW, rw = W - listW, mw = rw * .44, lx = rx + mw, lw = rw - mw;
    const topH = H * .19; cs = Math.max(40, Math.min(mw * .3, (H - topH - H * .22) / 3.35)); gap = cs * .09; gw = 3 * cs + 2 * gap; gx = rx + (mw - gw) / 2; gy = topH;
    L.counter = { x: rx + mw / 2, y: H * .095, size: Math.min(H * .09, mw * .13) }; L.mute = { x: rx + 12, y: 12, w: 44, h: 44 };
    const bh = cs * .62, tw = gw * .94, gp = bh * .16, bx0 = rx + (mw - tw) / 2, by0 = gy + gw + cs * .26; L.buy = { x: bx0, y: by0, w: tw - bh - gp, h: bh }; L.bin = { x: bx0 + tw - bh, y: by0, w: bh, h: bh };
    L.laneArea = { x: lx, y: 0, w: lw, h: H };
    const m = H * .02, rh = (H - m * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const y0 = m + i * rh, ss = Math.min(rh * .74, lw * .24, cs * 1.3);
      L.lanes.push({ y0, rh, slot: { x: lx + lw * .04, y: y0 + (rh - ss) / 2 + rh * .03, w: ss, h: ss }, floorY: y0 + rh * .88, monX: lx + lw * .6, monH: Math.min(rh * .66, lw * .32), chestX: lx + lw * .9, chestS: Math.min(rh * .46, lw * .18), x0: lx + lw * .015, x1: W - lw * .01 });
    }
  } else {
    const topbar = H * .085, laneB = H * .54, rh = (laneB - topbar) / 3;
    L.counter = { x: W / 2, y: topbar / 2, size: Math.min(topbar * .8, W * .12) }; L.mute = { x: 8, y: Math.max(4, topbar / 2 - 20), w: 40, h: 40 }; L.laneArea = { x: 0, y: 0, w: W, h: laneB };
    for (let i = 0; i < 3; i++) {
      const y0 = topbar + i * rh, ss = Math.min(rh * .8, W * .24);
      L.lanes.push({ y0, rh, slot: { x: W * .03, y: y0 + (rh - ss) / 2 + rh * .03, w: ss, h: ss }, floorY: y0 + rh * .9, monX: W * .57, monH: Math.min(rh * .7, W * .36), chestX: W * .895, chestS: Math.min(rh * .5, W * .17), x0: W * .01, x1: W * .99 });
    }
    const availH = H - H * .565 - H * .03; cs = Math.max(40, Math.min(W * .27, availH / 3.95)); gap = cs * .09; gw = 3 * cs + 2 * gap; gx = (W - gw) / 2; gy = H * .565;
    const bh = cs * .62, tw = gw * .94, gp = bh * .16, bx0 = (W - tw) / 2, by0 = gy + gw + cs * .22; L.buy = { x: bx0, y: by0, w: tw - bh - gp, h: bh }; L.bin = { x: bx0 + tw - bh, y: by0, w: bh, h: bh };
    L.list = null;
  }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) L.cells.push({ x: gx + c * (cs + gap), y: gy + r * (cs + gap), w: cs, h: cs });
  L.grid = { x: gx, y: gy, w: gw, h: gw, cs };
  if (L.list) { L.list.itemH = L.list.w * 1.3; L.list.head = Math.min(48, H * .07); L.list.max = Math.max(0, L.list.head + MAXLVL * L.list.itemH - H + 12); listScroll = clamp(listScroll, 0, L.list.max); }
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }

/* ===== Hintergrund und feste Flächen (einmal gezeichnet) ===== */
function buildStatic() {
  const W = VW, H = VH; bgC = mkCanvas(W * DPR, H * DPR); const g = bgC.getContext("2d"); g.scale(DPR, DPR); g.lineJoin = g.lineCap = "round";
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#34417a"); gr.addColorStop(1, "#222b58"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const brick = (x0, y0, x1, y1, seed) => {
    const bh = Math.max(28, Math.min(W, H) / 9), bw = bh * 2; g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip(); g.lineWidth = 1.5; g.strokeStyle = "rgba(14,18,52,.3)";
    for (let r = 0, y = y0; y < y1 + bh; r++, y += bh) { const sk = sketch(g, seed + r * .7, 14, .9); for (let x = x0 - (r % 2) * bw / 2; x < x1 + bw; x += bw) { if (hs(r, (x / bw) | 0, seed | 0) < .78) sk.rect(x, y, bw, bh); } sk.stroke(); }
    g.restore();
  };
  const blot = (x0, y0, x1, y1, n, col) => { for (let i = 0; i < n; i++) { const x = x0 + hs(i, 1, 5) * (x1 - x0), y = y0 + hs(i, 2, 5) * (y1 - y0), r = (.08 + hs(i, 3, 5) * .14) * Math.min(W, H); const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, "rgba(" + col + ",.16)"); rg.addColorStop(1, "rgba(" + col + ",0)"); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); } };
  brick(0, 0, W, H, 3); blot(0, 0, W, H, 12, "130,150,255");
  /* Kampfbahn-Fläche mit gezackter Kante */
  const pts = [], zz = 22, A = L.laneArea;
  if (L.land) { pts.push([A.x, -zz]); let t = false; for (let y = -zz; y <= H + zz; y += zz) { pts.push([A.x + (t ? 9 : -9), y]); t = !t; } pts.push([W + 5, H + zz], [W + 5, -zz]); }
  else { const yb = A.h; pts.push([-5, -5], [W + 5, -5]); let t = false; for (let x = W + zz; x >= -zz; x -= zz) { pts.push([x, yb + (t ? 9 : -9)]); t = !t; } }
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = "#47408f"; g.fill();
  g.save(); g.clip(); brick(L.land ? A.x - 20 : 0, 0, W, L.land ? H : A.h + 20, 11); blot(L.land ? A.x : 0, 0, W, L.land ? H : A.h, 8, "200,140,255"); g.restore();
  const zk = sketch(g, 4.2, 14, 1.2); g.lineWidth = 4; g.strokeStyle = INK; zk.beginPath(); const edge = L.land ? pts.slice(1, pts.length - 2) : pts.slice(2); edge.forEach((p, i) => i ? zk.lineTo(p[0], p[1]) : zk.moveTo(p[0], p[1])); zk.stroke();
  /* Raster-Tafel und Felder */
  const G = L.grid, sk = sketch(g, 6.6, 12, 1.5); g.lineWidth = 4; rr(sk, G.x - G.cs * .12, G.y - G.cs * .12, G.w + G.cs * .24, G.h + G.cs * .24, G.cs * .14); g.fillStyle = "#283164"; sk.fill(); g.strokeStyle = INK; sk.stroke();
  const ck = sketch(g, 8.1, 9, 1.1); g.lineWidth = 3;
  L.cells.forEach((c, i) => { rr(ck, c.x, c.y, c.w, c.h, c.w * .14); g.fillStyle = "#3f4d92"; ck.fill(); g.strokeStyle = INK; ck.stroke(); g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 2; g.beginPath(); g.moveTo(c.x + c.w * .16, c.y + c.h * .1); g.lineTo(c.x + c.w * .55, c.y + c.h * .08); g.stroke(); g.lineWidth = 3; });
  /* Kampfbahnen: Boden und Platz für den Schleim */
  L.lanes.forEach((ln, i) => {
    const fk = sketch(g, 12 + i, 16, 1.4); g.lineWidth = 3.5; rr(fk, ln.x0, ln.floorY, ln.x1 - ln.x0, Math.max(10, ln.rh * .07), 5); g.fillStyle = "#1f2756"; fk.fill(); g.strokeStyle = INK; fk.stroke();
    const sk2 = sketch(g, 20 + i, 9, 1.1); g.lineWidth = 3; rr(sk2, ln.slot.x, ln.slot.y, ln.slot.w, ln.slot.h, ln.slot.w * .14); g.fillStyle = "#4a7cc6"; sk2.fill(); g.strokeStyle = INK; sk2.stroke();
  });
  /* Sammlungs-Leiste */
  if (L.list) { const lk = sketch(g, 5.5, 14, 1.2); g.lineWidth = 4; g.beginPath(); g.rect(-6, -6, L.list.w + 6, H + 12); g.fillStyle = "#262f66"; g.fill(); lk.beginPath(); lk.moveTo(L.list.w, -6); lk.lineTo(L.list.w, H + 6); g.strokeStyle = INK; lk.stroke(); }
  buildButtons();
}
function buildButtons() {
  const b = L.buy, pad = 10, mk = down => {
    const c = mkCanvas((b.w + pad * 2) * DPR, (b.h + pad * 2 + 8) * DPR), g = c.getContext("2d"); g.scale(DPR, DPR); g.lineJoin = g.lineCap = "round"; const sk = sketch(g, down ? 5.1 : 5.5, 12, 1.3); g.lineWidth = 4;
    if (!down) { rr(sk, pad, pad + 8, b.w, b.h, b.h * .28); g.fillStyle = "#238ba6"; sk.fill(); g.strokeStyle = INK; sk.stroke(); }
    const oy = down ? 6 : 0, sk2 = sketch(g, down ? 5.3 : 5.7, 12, 1.3); rr(sk2, pad, pad + oy, b.w, b.h, b.h * .28); const gg = g.createLinearGradient(0, pad + oy, 0, pad + oy + b.h); gg.addColorStop(0, "#8ff6ff"); gg.addColorStop(1, "#4fd8ee"); g.fillStyle = gg; sk2.fill(); g.strokeStyle = INK; sk2.stroke();
    g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 3; g.beginPath(); g.moveTo(pad + b.h * .3, pad + oy + b.h * .17); g.lineTo(pad + b.w * .4, pad + oy + b.h * .14); g.stroke(); return c;
  };
  btnUp = mk(false); btnDn = mk(true); btnUp.pad = btnDn.pad = pad;
}
function resize() { DPR = Math.min(window.devicePixelRatio || 1, 2); VW = window.innerWidth; VH = window.innerHeight; cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR); layout(); buildStatic(); }

/* ===== Spielregeln ===== */
function say(text, x, y, col, size) { floats.push({ x, y, text, col: col || "#fff", size: size || 22, t: 0, life: 1.1 }); }
function sparks(x, y, n, col, spd) { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = (spd || 120) * (.4 + Math.random() * .8); parts.push({ type: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: .5 + Math.random() * .4, r: 5 + Math.random() * 6, col: col || "#fff6a8" }); } }
function puffs(x, y, n, sz) { for (let i = 0; i < n; i++) { const a = Math.random() * 7; parts.push({ type: "puff", x: x + Math.cos(a) * sz * .3, y: y + Math.sin(a) * sz * .2, vx: Math.cos(a) * 40, vy: Math.sin(a) * 30 - 20, t: 0, life: .5, r: sz * (.12 + Math.random() * .1) }); } }
function coinBurst(x, y, n, size) { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, v = 150 + Math.random() * 170; parts.push({ type: "coin", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: -Math.random() * .1, life: 1, size, phase: 0 }); } }

function merge(src, dst) {
  const a = getL(src); setL(dst, a + 1); setL(src, 0); S.merges++; popOf(dst)[dst.i] = 1; const rc = refRect(dst), cx = rc.x + rc.w / 2, cy = rc.y + rc.h * .55;
  sparks(cx, cy, 14, "#fff6a8", 190); puffs(cx, cy + rc.h * .2, 4, rc.w); sfx.merge(a + 1);
  if (a + 1 > bestShown) { bestShown = a + 1; banner = { lvl: a + 1, t: 0 }; sparks(cx, cy, 14, "#ffd1ff", 230); }
}
function apply(src, dst) {
  if (src.t === dst.t && src.i === dst.i) return;
  const a = getL(src), b = getL(dst);
  if (!a) return;
  if (!b) { setL(dst, a); setL(src, 0); popOf(dst)[dst.i] = .6; sfx.move(); }
  else if (a === b && a < MAXLVL) merge(src, dst);
  else { setL(dst, a); setL(src, b); popOf(dst)[dst.i] = .6; popOf(src)[src.i] = .6; sfx.move(); }
}
function buy() {
  const sl = spawnLvl(S.best), cost = costOf(sl, ownedUnits(sl)), b = L.buy, fc = freeCell();
  if (fc < 0) { buyShake = 1; say("Kein Platz mehr", b.x + b.w / 2, b.y - 10, "#ffb0b0", 24); sfx.fail(); return; }
  if (S.coins < cost) { buyShake = 1; say("Zu wenig Münzen", b.x + b.w / 2, b.y - 10, "#ffb0b0", 24); sfx.fail(); return; }
  S.coins -= cost; S.buys[sl] = (S.buys[sl] | 0) + 1; S.grid[fc] = sl; gridPop[fc] = 1; const c = L.cells[fc]; puffs(c.x + c.w / 2, c.y + c.h * .8, 5, c.w); sparks(c.x + c.w / 2, c.y + c.h / 2, 6, "#bff7ff", 120); sfx.buy();
}
function hitMonster(i, dmg) {
  const ln = S.lanes[i], r = R[i], Ls = L.lanes[i], crit = Math.random() < .12; if (crit) dmg *= 2;
  ln.hp -= dmg; r.swing = 1; r.hit = 1; sfx.hit();
  say(fmt(dmg), Ls.monX + (Math.random() - .5) * Ls.monH * .5, Ls.floorY - Ls.monH * (.5 + Math.random() * .4), crit ? "#ffe45a" : "#ffffff", crit ? 30 : 22);
  sparks(Ls.monX - Ls.monH * .2, Ls.floorY - Ls.monH * .45, crit ? 7 : 3, crit ? "#ffe45a" : "#ffffff", 120);
  if (ln.hp <= 0) kill(i);
}
function kill(i) {
  const ln = S.lanes[i], r = R[i], Ls = L.lanes[i], rew = rewardOf(ln.stage); S.coins += rew; S.kills++; r.dying = 1;
  coinBurst(Ls.monX, Ls.floorY - Ls.monH * .5, Math.min(10, 4 + Math.floor(Math.log10(rew + 1))), Ls.monH * .2);
  puffs(Ls.monX, Ls.floorY - Ls.monH * .3, 6, Ls.monH); say("+" + fmt(rew), Ls.monX, Ls.floorY - Ls.monH * 1.05, "#ffd23f", 28);
  sfx.kill(); ln.chest++; r.chestBump = 1;
  if (ln.chest >= CHEST_EVERY) { ln.chest = 0; openChest(i, rew); }
}
function openChest(i, rew) {
  const r = R[i], Ls = L.lanes[i], bonus = rew * 3; S.coins += bonus; r.chestAnim = 1; sfx.chest();
  coinBurst(Ls.chestX, Ls.floorY - Ls.chestS * .5, 8, Ls.monH * .18); sparks(Ls.chestX, Ls.floorY - Ls.chestS * .6, 12, "#fff0a0", 200); say("+" + fmt(bonus), Ls.chestX, Ls.floorY - Ls.chestS * 1.2, "#ffd23f", 26);
  const fc = freeCell(); if (fc >= 0 && Math.random() < .5) { const lv = Math.min(MAXLVL, spawnLvl(S.best) + 1); S.grid[fc] = lv; if (lv > S.best) S.best = lv; gridPop[fc] = 1; const c = L.cells[fc]; sparks(c.x + c.w / 2, c.y + c.h / 2, 10, "#fff6a8", 160); say("Schleim aus der Kiste", L.grid.x + L.grid.w / 2, L.grid.y - 10, "#bff7ff", 22); }
}
function nextMonster(i) { const ln = S.lanes[i], r = R[i]; ln.stage++; ln.hp = hpOf(ln.stage); r.spawn = 0; r.atk = 0; }

function update(dt) {
  time += dt;
  for (let i = 0; i < 3; i++) {
    const ln = S.lanes[i], r = R[i];
    r.swing = Math.max(0, r.swing - dt * 3.4); r.hit = Math.max(0, r.hit - dt * 5); r.spawn = Math.min(1, r.spawn + dt * 2.2); r.chestAnim = Math.max(0, r.chestAnim - dt * 1.1); r.chestBump = Math.max(0, r.chestBump - dt * 3);
    if (r.dying > 0) { r.dying -= dt * 1.8; if (r.dying <= 0) { r.dying = 0; nextMonster(i); } continue; }
    if (ln.lvl > 0 && r.spawn >= 1) { r.atk += dt; if (r.atk >= BEAT) { r.atk -= BEAT; hitMonster(i, dpsOf(ln.lvl) * BEAT); } }
  }
  for (let i = 0; i < 9; i++) gridPop[i] = Math.max(0, gridPop[i] - dt * 3.2);
  for (let i = 0; i < 3; i++) lanePop[i] = Math.max(0, lanePop[i] - dt * 3.2);
  buyShake = Math.max(0, buyShake - dt * 3); counterBump = Math.max(0, counterBump - dt * 4);
  if (banner) { banner.t += dt; if (banner.t > 3) banner = null; }
  const ctr = L.counter;
  parts = parts.filter(p => {
    p.t += dt; if (p.t < 0) return true;
    if (p.type === "coin") {
      if (p.t < .5) { p.vy += 620 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t >= .5 - dt) { p.fx = p.x; p.fy = p.y; } }
      else { if (p.fx == null) { p.fx = p.x; p.fy = p.y; } const k = ease(clamp((p.t - .5) / .5, 0, 1)); p.x = lerp(p.fx, ctr.x - ctr.size * 1.2, k); p.y = lerp(p.fy, ctr.y, k); if (p.t >= 1) { counterBump = 1; return false; } }
      return true;
    }
    p.x += p.vx * dt; p.y += p.vy * dt; if (p.type === "spark") p.vy += 300 * dt; return p.t < p.life;
  });
  floats = floats.filter(f => { f.t += dt; f.y -= 38 * dt; return f.t < f.life; });
}

/* ===== Zeichnen ===== */
function txt(s, x, y, size, fill, align, stroke) {
  ctx.font = size + "px \"Caveat Brush\",\"Patrick Hand\",\"Segoe Print\",cursive"; ctx.textAlign = align || "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size * .2); ctx.strokeStyle = stroke || INK; ctx.strokeText(s, x, y); ctx.fillStyle = fill || "#fff"; ctx.fillText(s, x, y);
}
function swingAng(r) {   // Ausholen, Zuschlagen, Zurück
  if (r.swing <= 0) return .25; const p = 1 - r.swing;
  if (p < .25) return .25 - (p / .25) * .7; if (p < .5) return -.45 + ((p - .25) / .25) * 1.9; return 1.45 - ((p - .5) / .5) * 1.2;
}
/* Bewegte Effekte der Kristall-, Feuer- und Magiewaffen: pulsierendes Leuchten, Funkeln, aufsteigende Glut, kreisende Sterne */
function weaponFx(c, l, t, u) {
  const a = HEAD[wType(l)], ax = a[0] * u, ay = a[1] * u, tm = time, pr = .5 + .5 * Math.sin(tm * 4 + l), col = t === 3 ? "120,230,255" : t === 4 ? "255,150,50" : "210,130,255", hc = t === 5 ? hsl(tm * 90 + l * 20, 1, .6) : t === 6 ? hsl(205 + Math.sin(tm * 2 + l) * 12, 1, .72) : null;
  c.save(); c.globalCompositeOperation = "lighter"; const rg = c.createRadialGradient(ax, ay, 0, ax, ay, u * .5); if (hc) { rg.addColorStop(0, hexA(hc, .22 + .2 * pr)); rg.addColorStop(1, hexA(hc, 0)); } else { rg.addColorStop(0, "rgba(" + col + "," + (.14 + .14 * pr) + ")"); rg.addColorStop(1, "rgba(" + col + ",0)"); } c.fillStyle = rg; c.fillRect(ax - u * .5, ay - u * .5, u, u); c.restore();
  c.save();
  if (t === 3) { for (let i = 0; i < 5; i++) { const ph = (tm * 1.1 + i * .2 + l * .13) % 1; c.globalAlpha = Math.sin(ph * Math.PI); c.fillStyle = "#fff"; sparklePath(c, ax + Math.cos(i * 2.1 + l) * u * .32, ay + Math.sin(i * 1.7 + l) * u * .32, u * .06 * (.4 + ph)); c.fill(); } }
  else if (t === 4) { for (let i = 0; i < 8; i++) { const ph = (tm * .85 + i / 8) % 1; c.globalAlpha = 1 - ph; c.fillStyle = i % 2 ? "#ffd34a" : "#ff7a2a"; c.beginPath(); c.arc(ax + Math.sin(i * 2.7 + ph * 5) * u * .15, ay + u * .05 - ph * u * .62, u * .024 * (1 - ph * .5), 0, 7); c.fill(); } }
  else if (t === 5) {
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i++) { const ang = tm * (i % 2 ? -2.6 : 2.2) + i * 1.257, rr = u * (.3 + .1 * (i % 3)); c.globalAlpha = .75 + .25 * Math.sin(tm * 5 + i); c.fillStyle = hsl(tm * 120 + i * 72, 1, .72); starPath(c, ax + Math.cos(ang) * rr, ay + Math.sin(ang) * rr * .32, u * .05, u * .02, ang); c.fill(); }
    for (let i = 0; i < 9; i++) { const ph = (tm * 1.1 + i / 9) % 1, a = i * 2.4 + l; c.globalAlpha = Math.sin(ph * Math.PI) * .9; c.fillStyle = hsl(tm * 120 + i * 40, 1, .78); sparklePath(c, ax + Math.cos(a) * u * (.12 + ph * .38), ay + Math.sin(a) * u * (.1 + ph * .3) - ph * u * .12, u * .05 * (1 - ph * .4)); c.fill(); }
  }
  else {
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) { const ang = tm * (i % 2 ? -1.5 : 1.2) + i * 1.047, rr = u * (.55 + .08 * (i % 2)), ex = Math.cos(ang) * rr, ey = Math.sin(ang) * rr * .3; c.globalAlpha = .8 + .2 * Math.sin(tm * 6 + i); c.fillStyle = i % 2 ? "#ffffff" : "#bfe4ff"; starPath(c, ax + ex, ay + ey - u * .05, u * .05, u * .02, ang); c.fill(); }
    for (let i = 0; i < 14; i++) { const ph = (tm * .9 + i / 14) % 1, a = i * 2.4 + l * 1.3, rr = u * (.1 + ph * .52); c.globalAlpha = Math.sin(ph * Math.PI); c.fillStyle = i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#9fdcff" : "#d6ecff"; sparklePath(c, ax + Math.cos(a) * rr, ay + Math.sin(a) * rr * .7, u * .055 * (1 - ph * .5)); c.fill(); }
    const cp = (tm * .55 + l * .17) % 1; if (cp < .4) { const k = cp / .4; c.globalAlpha = Math.sin(k * Math.PI); const sx = ax - u * .5 + k * u, sy = ay - u * .55 + k * u * .3, tg = c.createLinearGradient(sx, sy, sx - u * .3, sy - u * .09); tg.addColorStop(0, "rgba(255,255,255,.95)"); tg.addColorStop(1, "rgba(255,255,255,0)"); c.strokeStyle = tg; c.lineWidth = u * .02; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - u * .3, sy - u * .09); c.stroke(); }
    /* Planeten, die um den Waffenkopf kreisen */
    c.globalCompositeOperation = "source-over"; c.lineJoin = "round";
    const planets = [[.55, .2, .1, 1.1, 0, "#e8f6ff", "#6fb4ff", "#2446b8", true], [.38, .13, .055, -1.7, 2.1, "#ffffff", "#c4e2ff", "#6a8ee0", false], [.7, .24, .04, .8, 4.2, "#d8f0ff", "#8ac8ff", "#3a62d0", false]];
    for (const P of planets) {
      const a = tm * P[3] + P[4] + l, dp = Math.sin(a), px = ax + Math.cos(a) * P[0] * u, py = ay + dp * P[1] * u - u * .04, r = u * P[2] * (.85 + .15 * dp);
      c.globalAlpha = 1; const sg = c.createRadialGradient(px - r * .35, py - r * .35, r * .1, px, py, r); sg.addColorStop(0, P[5]); sg.addColorStop(.5, P[6]); sg.addColorStop(1, P[7]);
      if (P[8]) { c.strokeStyle = INK; c.lineWidth = u * .03; c.beginPath(); c.ellipse(px, py, r * 1.75, r * .5, -.35, Math.PI, 2 * Math.PI); c.stroke(); c.strokeStyle = "#cfeaff"; c.lineWidth = u * .016; c.beginPath(); c.ellipse(px, py, r * 1.75, r * .5, -.35, Math.PI, 2 * Math.PI); c.stroke(); }
      c.fillStyle = sg; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = u * .016; c.stroke();
      c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.ellipse(px - r * .35, py - r * .35, r * .22, r * .13, -.6, 0, 7); c.fill();
      if (P[8]) { c.strokeStyle = INK; c.lineWidth = u * .03; c.beginPath(); c.ellipse(px, py, r * 1.75, r * .5, -.35, 0, Math.PI); c.stroke(); c.strokeStyle = "#cfeaff"; c.lineWidth = u * .016; c.beginPath(); c.ellipse(px, py, r * 1.75, r * .5, -.35, 0, Math.PI); c.stroke(); }
    }
  }
  c.restore();
}
function drawSlime(l, cx, by, size, o) {
  o = o || {}; const k = size / SL_U * (o.pop || 1), sq = Math.sin(time * 3 + l * 1.3 + (o.ph || 0)) * .035 + (o.sq || 0);
  ctx.save(); ctx.translate(cx + (o.dx || 0), by); ctx.scale(1 + sq, 1 - sq);
  if (l >= 30) { const col = slimePalette(l)[1], rg = ctx.createRadialGradient(0, -size * .35, size * .1, 0, -size * .35, size * .85); rg.addColorStop(0, hexA(col, .55 + .15 * Math.sin(time * 3))); rg.addColorStop(1, hexA(col, 0)); ctx.fillStyle = rg; ctx.fillRect(-size, -size * 1.3, size * 2, size * 1.6); }
  const dx = -SL_OX * k, dy = -SL_OY * k, dw = SL_W * k;
  ctx.drawImage(slimeSprite(l), dx, dy, dw, dw);
  const blink = ((time * .6 + l * .37) % 4) < .12; ctx.drawImage(faceSprite(l, o.attack ? 2 : blink ? 1 : 0), dx, dy, dw, dw);
  const wk = size * 1.05 / WP_U; ctx.save(); ctx.translate(size * .42, -size * .2); ctx.rotate(o.ang != null ? o.ang : .25 + Math.sin(time * 2 + l) * .04); ctx.drawImage(weaponFrame(l, time), -WP_OX * wk, -WP_OY * wk, WP_W * wk, WP_W * wk); if (wTier(l) >= 3) weaponFx(ctx, l, wTier(l), WP_U * wk); ctx.restore();
  ctx.restore();
}
function drawLocked(l, cx, by, size) { const k = size / SL_U; ctx.globalAlpha = .55; ctx.drawImage(slimeSil(l), cx - SL_OX * k, by - SL_OY * k, SL_W * k, SL_W * k); ctx.globalAlpha = 1; }

function drawCounter() {
  const c = L.counter, s = c.size * (1 + counterBump * .12), str = fmt(S.coins); ctx.font = s + "px \"Caveat Brush\",cursive"; const tw = ctx.measureText(str).width, cw = s * 1.05, tot = cw + s * .25 + tw, x0 = c.x - tot / 2;
  ctx.drawImage(coinSprite(), x0, c.y - cw / 2, cw, cw); txt(str, x0 + cw + s * .25, c.y + s * .04, s, "#fff", "left");
}
function pairLevels() { const n = {}; S.grid.forEach(v => { if (v) n[v] = (n[v] || 0) + 1; }); return n; }
function drawGrid() {
  const pl = pairLevels(), tut = S.merges < 3, dl = drag ? drag.lvl : 0, pulse = .5 + .5 * Math.sin(time * 6);
  L.cells.forEach((c, i) => {
    const l = S.grid[i], isDrag = drag && drag.ref.t === "g" && drag.ref.i === i;
    if (l && !isDrag) { const sz = c.w * .66, po = gridPop[i] > 0 ? 1 + Math.sin(gridPop[i] * Math.PI) * .22 : 1; drawSlime(l, c.x + c.w * .46, c.y + c.h * .86, sz, { ph: i, pop: po, sq: gridPop[i] > 0 ? -Math.sin(gridPop[i] * Math.PI) * .05 : 0 }); }
    const hint = (drag && l !== 0 ? false : false);
    let glow = 0; if (drag && !isDrag && l === dl && l) glow = 1; else if (!drag && tut && l && pl[l] >= 2) glow = .6;
    if (drag && !isDrag && !l) glow = .25;
    if (glow) { ctx.save(); ctx.strokeStyle = "rgba(255,246,150," + (glow * (.5 + pulse * .5)) + ")"; ctx.lineWidth = 4; rr(ctx, c.x + 2, c.y + 2, c.w - 4, c.h - 4, c.w * .14); ctx.stroke(); ctx.restore(); }
  });
}
function drawLanes() {
  const dl = drag ? drag.lvl : 0, anyEq = S.lanes.some(l => l.lvl > 0), hasG = S.grid.some(v => v);
  for (let i = 0; i < 3; i++) {
    const ln = S.lanes[i], r = R[i], Ls = L.lanes[i], sl = Ls.slot, isDrag = drag && drag.ref.t === "l" && drag.ref.i === i;
    /* Schleim im Platz */
    if (ln.lvl && !isDrag) {
      const ss = sl.w, size = ss * .74, phase = 1 - r.swing, dx = r.swing > 0 ? Math.sin(clamp((phase - .2) / .5, 0, 1) * Math.PI) * ss * .2 : 0, po = lanePop[i] > 0 ? 1 + Math.sin(lanePop[i] * Math.PI) * .2 : 1;
      drawSlime(ln.lvl, sl.x + ss * .44, sl.y + ss * .88, size, { ph: i * 2, dx, ang: swingAng(r), attack: r.swing > 0, pop: po });
      const ds = Math.max(14, ss * .17); ctx.drawImage(weaponSprite(14), sl.x + ss * .04, sl.y + ss * .03, ds * 1.25, ds * 1.25); txt(fmt(dpsOf(ln.lvl)), sl.x + ss * .04 + ds * 1.3, sl.y + ds * .72, ds, "#fff", "left");
    } else if (!ln.lvl && !isDrag) { const pu = .5 + .5 * Math.sin(time * 4); txt("frei", sl.x + sl.w / 2, sl.y + sl.h / 2, Math.max(16, sl.w * .2), "rgba(255,255,255," + (.45 + (hasG && !anyEq ? pu * .5 : 0)) + ")"); }
    if (drag && !isDrag && (!ln.lvl || ln.lvl === dl)) { ctx.save(); ctx.strokeStyle = "rgba(255,246,150," + (ln.lvl === dl ? .9 : .4) * (.5 + .5 * Math.sin(time * 6)) + ")"; ctx.lineWidth = 4; rr(ctx, sl.x + 2, sl.y + 2, sl.w - 4, sl.h - 4, sl.w * .14); ctx.stroke(); ctx.restore(); }
    else if (!drag && hasG && !anyEq && !ln.lvl) { ctx.save(); ctx.strokeStyle = "rgba(255,246,150," + (.3 + .5 * Math.sin(time * 4) * .5 + .25) + ")"; ctx.lineWidth = 4; rr(ctx, sl.x + 2, sl.y + 2, sl.w - 4, sl.h - 4, sl.w * .14); ctx.stroke(); ctx.restore(); }
    /* Monster */
    const info = monInfo(ln.stage), spr = monsterSprite(info), hsz = Math.max(16, Ls.monH * .14), topU = MONS[info.kind].top + (info.boss ? .4 : .02), availH = Ls.floorY - (Ls.y0 + hsz * 1.45 + 17), upx = Math.min(Ls.monH / .9 * (info.boss ? .96 : 1), availH / topU), k = upx / MON_U, topPx = upx * topU;
    let alpha = 1, sx = 1, sy = 1, ox = 0, oy = 0;
    if (r.spawn < 1) { const e = ease(r.spawn); oy = -(1 - e) * Ls.monH * .9; alpha = Math.min(1, e * 1.4); if (e > .8) { const q = Math.sin((e - .8) / .2 * Math.PI); sy = 1 - .12 * q; sx = 1 + .1 * q; } }
    if (r.dying > 0) { const d = r.dying; alpha = d; sx = 1 + (1 - d) * .5; sy = .35 + .65 * d; }
    const idle = Math.sin(time * 2.6 + i * 1.7) * .022; ox += Math.sin(time * 70) * r.hit * Ls.monH * .025;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(Ls.monX + ox, Ls.floorY + 3 + oy); ctx.scale(sx * (1 + idle), sy * (1 - idle));
    ctx.drawImage(spr, -MON_OX * k, -MON_OY * k, MON_W * k, MON_W * k);
    if (r.hit > 0 && r.dying <= 0) { ctx.globalAlpha = alpha * r.hit * .7; ctx.drawImage(monsterSil(info), -MON_OX * k, -MON_OY * k, MON_W * k, MON_W * k); }
    ctx.restore();
    /* Lebenspunkte */
    if (r.dying <= 0) {
      const hy = Math.max(Ls.y0 + hsz * 1.45 + 2, Ls.floorY - topPx - 10), bw = Math.max(70, Ls.monH * .95), bx = Ls.monX - bw / 2, bh = 9, fr = clamp(ln.hp / hpOf(ln.stage), 0, 1);
      ctx.save(); ctx.globalAlpha = Math.min(1, r.spawn * 1.5); ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.fillStyle = "#2a1e3c"; rr(ctx, bx, hy, bw, bh, 4); ctx.fill(); ctx.stroke();
      if (fr > 0) { ctx.fillStyle = info.boss ? "#ff8a3c" : "#ff6a86"; rr(ctx, bx + 1, hy + 1, Math.max(6, (bw - 2) * fr), bh - 2, 3); ctx.fill(); }
      const str = fmt(Math.ceil(ln.hp)); ctx.font = hsz + "px \"Caveat Brush\",cursive"; const tw = ctx.measureText(str).width;
      ctx.drawImage(heartSprite(), Ls.monX - tw / 2 - hsz * 1.05, hy - hsz * 1.35, hsz * 1.1, hsz * 1.1); txt(str, Ls.monX - tw / 2 + hsz * .1, hy - hsz * .75, hsz, "#fff", "left");
      const br = Math.max(11, hsz * .62), bcx = bx - br - 4, bcy = hy + bh / 2; ctx.lineWidth = 2.5; ctx.fillStyle = info.boss ? "#ff8a3c" : "#ffd23f"; ctx.beginPath(); ctx.arc(bcx, bcy, br, 0, 7); ctx.fill(); ctx.stroke(); ctx.font = (br * 1.15) + "px \"Caveat Brush\",cursive"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = INK; ctx.fillText(String(ln.stage), bcx, bcy + 1);
      ctx.restore();
    }
    /* Kiste */
    const open = r.chestAnim > 0, cK = Ls.chestS / .88 / 160, bump = r.chestBump > 0 ? 1 + Math.sin(r.chestBump * Math.PI) * .12 : 1, ready = ln.chest === CHEST_EVERY - 1;
    ctx.save(); ctx.translate(Ls.chestX, Ls.floorY + 3); ctx.scale(bump, bump * (ready ? 1 + Math.sin(time * 8) * .03 : 1)); ctx.drawImage(chestSprite(open), -110 * cK, -170 * cK, 220 * cK, 200 * cK); ctx.restore();
    const dr = Math.max(4, Ls.chestS * .05); for (let d = 0; d < CHEST_EVERY; d++) { ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.fillStyle = d < ln.chest ? "#ffd23f" : "#3a3f78"; ctx.beginPath(); ctx.arc(Ls.chestX + (d - (CHEST_EVERY - 1) / 2) * dr * 2.5, Ls.floorY - Ls.chestS * .92 - dr * 1.6, dr, 0, 7); ctx.fill(); ctx.stroke(); }
    if (ready) { ctx.save(); ctx.fillStyle = "rgba(255,246,170,.95)"; const q = (time * 2 + i) % 1; sparklePath(ctx, Ls.chestX + Ls.chestS * .4, Ls.floorY - Ls.chestS * (.5 + q * .4), 6 + 5 * Math.sin(q * Math.PI)); ctx.fill(); ctx.restore(); }
  }
}
function drawBuy() {
  const b = L.buy, sl = spawnLvl(S.best), cost = costOf(sl, ownedUnits(sl)), can = S.coins >= cost && freeCell() >= 0, img = buyPress ? btnDn : btnUp, shx = Math.sin(time * 60) * buyShake * 6, dy = buyPress ? 6 : 0;
  ctx.drawImage(img, b.x - img.pad + shx, b.y - img.pad, img.width / DPR, img.height / DPR);
  if (!can) { ctx.save(); ctx.fillStyle = "rgba(60,70,120,.42)"; rr(ctx, b.x + shx, b.y + dy, b.w, b.h, b.h * .28); ctx.fill(); ctx.restore(); }
  drawSlime(sl, b.x + b.h * .72 + shx, b.y + dy + b.h * .86, b.h * .92, { ph: 1 });
  const s = b.h * .56, str = fmt(cost); ctx.font = s + "px \"Caveat Brush\",cursive"; const tw = ctx.measureText(str).width, cw = s * 1.05, tot = tw + cw + s * .2, x1 = b.x + b.w * .92 + shx, x0 = x1 - tot;
  txt(str, x0, b.y + dy + b.h * .5, s, can ? "#fff" : "#d8def5", "left"); ctx.drawImage(coinSprite(), x0 + tw + s * .2, b.y + dy + b.h * .5 - cw / 2, cw, cw);
}
function drawBin() {
  const b = L.bin; if (!b) return; const over = !!(drag && inR({ x: drag.px, y: drag.py }, b)), pulse = .5 + .5 * Math.sin(time * 6), sc = over ? 1.1 : 1;
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(sc, sc); ctx.drawImage(binSprite(over), -b.w * .6, -b.h * .6, b.w * 1.2, b.h * 1.2);
  if (drag && !over) { ctx.strokeStyle = "rgba(255,170,160," + (.3 + .4 * pulse) + ")"; ctx.lineWidth = 4; rr(ctx, -b.w * .48, -b.h * .48, b.w * .96, b.h * .96, b.w * .16); ctx.stroke(); }
  ctx.restore();
}
function drawList() {
  const li = L.list; if (!li) return; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, li.w - 3, VH); ctx.clip();
  const sz = li.w * .52; for (let l = 1; l <= MAXLVL; l++) {
    const y = li.head + (l - 1) * li.itemH - listScroll; if (y > VH + li.itemH || y < -li.itemH) continue; const by = y + li.itemH * .62, cx = li.w * .42;
    if (l <= S.best) drawSlime(l, cx, by, sz, { ph: l }); else drawLocked(l, cx, by, sz);
    txt("LVL " + l, li.w / 2, y + li.itemH * .83, Math.max(13, li.w * .17), l <= S.best ? "#8fe3ff" : "#6f7ab0", "center", "#141a3c");
  }
  ctx.fillStyle = "#262f66"; ctx.fillRect(0, 0, li.w, li.head); txt(S.best + "/" + MAXLVL, li.w / 2, li.head * .5, Math.max(18, li.w * .24), "#8fe3ff", "center", "#141a3c"); ctx.restore();
}
function drawParts() {
  for (const p of parts) {
    if (p.t < 0) continue;
    if (p.type === "coin") { const s = p.size * (p.t > .5 ? lerp(1, .55, (p.t - .5) / .5) : 1); ctx.drawImage(coinSprite(), p.x - s / 2, p.y - s / 2, s, s); }
    else if (p.type === "spark") { const k = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.globalAlpha = Math.min(1, k * 1.6); sparklePath(ctx, p.x, p.y, p.r * (.4 + k * .8)); ctx.fill(); ctx.globalAlpha = 1; }
    else { const k = p.t / p.life; ctx.globalAlpha = (1 - k) * .8; ctx.fillStyle = "#f3f0ff"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (.6 + k), 0, 7); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  for (const f of floats) { const k = f.t / f.life; ctx.globalAlpha = k < .7 ? 1 : 1 - (k - .7) / .3; txt(f.text, f.x, f.y, f.size * (k < .15 ? .7 + k / .15 * .3 : 1), f.col); ctx.globalAlpha = 1; }
}
function drawBanner() {
  if (!banner) return; const k = banner.t, a = k < .3 ? k / .3 : k > 2.5 ? 1 - (k - 2.5) / .5 : 1, c = L.counter, y = c.y + c.size * 1.25, w = Math.min(VW * .8, 340);
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); const sk = sketch(ctx, 7.7, 10, 1.2); ctx.lineWidth = 3.5; rr(sk, c.x - w / 2, y - 34, w, 68, 14); ctx.fillStyle = "#f6efd9"; sk.fill(); ctx.strokeStyle = INK; sk.stroke();
  if (banner.lvl) { drawSlime(banner.lvl, c.x - w / 2 + 46, y + 28, 52, {}); txt("Neuer Schleim", c.x + 38, y - 11, 24, "#1d2742", "center", "rgba(0,0,0,0)"); txt(slimeName(banner.lvl) + " (Stufe " + banner.lvl + ")", c.x + 38, y + 16, 20, "#2b7a86", "center", "rgba(0,0,0,0)"); }
  else { txt(banner.title, c.x, y - 11, 24, "#1d2742", "center", "rgba(0,0,0,0)"); txt(banner.sub, c.x, y + 16, 20, "#2b7a86", "center", "rgba(0,0,0,0)"); }
  ctx.restore();
}
function drawMute() {
  const m = L.mute; if (!m) return; const cx = m.x + m.w / 2, cy = m.y + m.h / 2, r = m.w / 2; ctx.save(); ctx.lineJoin = ctx.lineCap = "round"; ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.fillStyle = "#f6efd9"; ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(cx - r * .5, cy - r * .18); ctx.lineTo(cx - r * .24, cy - r * .18); ctx.lineTo(cx + r * .06, cy - r * .46); ctx.lineTo(cx + r * .06, cy + r * .46); ctx.lineTo(cx - r * .24, cy + r * .18); ctx.lineTo(cx - r * .5, cy + r * .18); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 2.6; if (S.mute) { ctx.strokeStyle = "#b8473a"; ctx.beginPath(); ctx.moveTo(cx - r * .55, cy + r * .6); ctx.lineTo(cx + r * .55, cy - r * .6); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(cx + r * .06, cy, r * .3, -.9, .9); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + r * .06, cy, r * .52, -.9, .9); ctx.stroke(); }
  ctx.restore();
}
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.lineJoin = ctx.lineCap = "round"; ctx.clearRect(0, 0, VW, VH);
  ctx.drawImage(bgC, 0, 0, VW, VH);
  drawList(); drawCounter(); drawMute(); drawGrid(); drawLanes(); drawBuy(); drawBin(); drawParts(); drawBanner();
  if (drag) { const sz = L.grid.cs * .8, rc = drag; ctx.save(); ctx.fillStyle = "rgba(10,10,40,.3)"; ctx.beginPath(); ctx.ellipse(rc.x, rc.y + sz * .42, sz * .42, sz * .08, 0, 0, 7); ctx.fill(); ctx.restore(); drawSlime(drag.lvl, rc.x, rc.y + sz * .35, sz, { ph: 3, ang: .45 }); }
}

/* ===== Eingabe: ziehen zum Verbinden, tippen zum Ausrüsten ===== */
const inR = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const pt = e => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
function hitSlot(p) {
  for (let i = 0; i < 9; i++) if (inR(p, L.cells[i])) return { t: "g", i };
  for (let i = 0; i < 3; i++) { const s = L.lanes[i].slot, m = s.w * .12; if (inR(p, { x: s.x - m, y: s.y - m, w: s.w + m * 2, h: s.h + m * 2 })) return { t: "l", i }; }
  return null;
}
let down = null;
cv.addEventListener("pointerdown", e => {
  e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } audio(); const p = pt(e); down = { x: p.x, y: p.y, t: performance.now(), moved: 0, mode: null, scroll: listScroll };
  if (L.mute && inR(p, L.mute)) { down.mode = "mute"; return; }
  if (inR(p, L.buy)) { down.mode = "buy"; buyPress = 1; return; }
  if (L.list && p.x < L.list.w) { down.mode = "list"; return; }
  const ref = hitSlot(p); if (ref && getL(ref)) { down.mode = "slime"; down.ref = ref; drag = { ref, lvl: getL(ref), x: p.x, y: p.y - L.grid.cs * .25, px: p.x, py: p.y }; }
});
cv.addEventListener("pointermove", e => {
  if (!down) return; const p = pt(e); down.moved = Math.max(down.moved, Math.hypot(p.x - down.x, p.y - down.y));
  if (down.mode === "slime" && drag) { drag.x = p.x; drag.y = p.y - L.grid.cs * .25; drag.px = p.x; drag.py = p.y; }
  else if (down.mode === "list" && L.list) listScroll = clamp(down.scroll - (p.y - down.y), 0, L.list.max);
  else if (down.mode === "buy" && !inR(p, L.buy)) buyPress = 0;
});
function release(e, cancel) {
  if (!down) return; const p = pt(e), d = down; down = null;
  if (d.mode === "mute") { if (!cancel && inR(p, L.mute)) { S.mute = !S.mute; save(); } return; }
  if (d.mode === "buy") { buyPress = 0; if (!cancel && inR(p, L.buy)) buy(); return; }
  if (d.mode === "slime" && drag) {
    const tap = d.moved < 10 && performance.now() - d.t < 450; drag = null; if (cancel) return;
    if (tap) { tapSlime(d.ref); return; }
    if (inR(p, L.bin)) { deleteSlime(d.ref); return; }
    const dst = hitSlot(p); if (dst) apply(d.ref, dst);
  }
}
cv.addEventListener("pointerup", e => release(e, false)); cv.addEventListener("pointercancel", e => release(e, true));
cv.addEventListener("wheel", e => { if (L.list && e.clientX < L.list.w) { listScroll = clamp(listScroll + e.deltaY, 0, L.list.max); e.preventDefault(); } }, { passive: false });
cv.addEventListener("contextmenu", e => e.preventDefault());
function deleteSlime(ref) {
  const l = getL(ref); if (!l) return; setL(ref, 0); const b = L.bin, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  puffs(cx, cy, 6, b.w * 1.2); sparks(cx, cy - b.h * .2, 8, "#c9d7f2", 140); say("Gelöscht", cx, b.y - 10, "#c9d7f2", 22); sfx.del();
}
/* Tippen: Schleim aus dem Raster in eine freie Bahn, oder aus der Bahn zurück ins Raster */
function tapSlime(ref) {
  const l = getL(ref);
  if (ref.t === "g") {
    let t = S.lanes.findIndex(x => !x.lvl); if (t < 0) { let w = 0; for (let i = 1; i < 3; i++) if (S.lanes[i].lvl < S.lanes[w].lvl) w = i; if (S.lanes[w].lvl < l) t = w; }
    if (t >= 0) apply(ref, { t: "l", i: t });
  } else { const fc = freeCell(); if (fc >= 0) apply(ref, { t: "g", i: fc }); else { buyShake = 1; say("Kein Platz im Raster", L.grid.x + L.grid.w / 2, L.grid.y - 10, "#ffb0b0", 22); } }
}

/* ===== Start und Schleife ===== */
bestShown = S.best;
window.addEventListener("resize", resize);
window.addEventListener("pagehide", save); document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
setInterval(save, 4000);
let last = performance.now();
function frame(now) { const dt = Math.min(.1, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(frame); }
function start() { const away = (Date.now() - (S.saved || Date.now())) / 1000; if (away > 45 && S.lanes.some(l => l.lvl)) { const o = offlineProgress(Math.min(away, 7200)); if (o.gain > 0) banner = { title: "Willkommen zurück", sub: "+" + fmt(o.gain) + " Münzen (" + o.kills + " Siege)", t: 0 }; } resize(); listScroll = L.list ? clamp(L.list.head + (S.best - 3) * L.list.itemH - L.list.h * .3, 0, L.list.max) : 0; requestAnimationFrame(t => { last = t; frame(t); }); }
Promise.race([Promise.all([document.fonts.load("28px \"Caveat Brush\""), document.fonts.load("18px \"Patrick Hand\"")]), new Promise(r => setTimeout(r, 1500))]).then(start, start);
window.G = { S, R, buy, apply, tapSlime, update, render, get L() { return L; } };
