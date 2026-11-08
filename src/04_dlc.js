"use strict";
/* ===== DLC „Runenschmiede“: Runenwaffen (neue Waffenreihe) und Verzauberungen =====
   Gekauft wird nur im Leif Game Hub (dort mit Hexis, dem Guthaben des Hubs). Das Spiel fragt den Hub per postMessage
   ({lgh:"dlc", spiel, aktion:"frage"}) und bekommt Besitz und Preis zurück. Ohne Hub (oder ohne Kauf) bleibt alles wie vorher:
   Verzauberungen und Runenwaffen wirken dann nicht, der Spielstand bleibt aber erhalten. */
const DLC_ID = "schleimmerge-runen", RUNEN_BONUS = .15, ENCH_MAX = 10;
const DLC = { besitz: false, preis: 0, guthaben: 0, antwort: false, imHub: window.parent !== window };
const ENCH = [
  { k: "flamme", name: "Flamme", col: "#ff7a2a", txt: n => "+" + 12 * n + "% Schaden" },
  { k: "frost", name: "Frost", col: "#6fe0ff", txt: n => 5 * n + "% Eisschlag (3× Schaden)" },
  { k: "glueck", name: "Glück", col: "#7be06a", txt: n => "+" + 10 * n + "% Münzen" },
  { k: "blitz", name: "Blitz", col: "#ffe45a", txt: n => 6 * n + "% Kettenblitz (alle Bahnen)" }
];
/* Spielstand: Stufen der Verzauberungen, welche Bahn welche trägt, Stil der Waffen */
(function enchNorm() {
  const e = S.ench && typeof S.ench === "object" ? S.ench : {}, lv = {}, b = Array.isArray(e.bahn) ? e.bahn : [];
  for (const x of ENCH) lv[x.k] = clamp((e.lv && e.lv[x.k]) | 0, 0, ENCH_MAX);
  S.ench = { lv, bahn: [0, 1, 2].map(i => ENCH.some(x => x.k === b[i]) ? b[i] : null), runen: e.runen !== false };
})();

/* ---------- Verbindung zum Hub ---------- */
if (DLC.imHub) {
  window.addEventListener("message", e => {
    if (e.source !== window.parent) return; const d = e.data;
    if (!d || d.lgh !== "dlc" || d.spiel !== "schleimmerge") return;
    const k = (d.katalog || []).find(x => x.id === DLC_ID);
    DLC.antwort = true; DLC.besitz = !!(k && k.besitz); DLC.preis = k ? k.preis | 0 : 0; DLC.guthaben = d.guthaben | 0;
    if (!DLC.besitz) EM.open = false;
  });
  const frage = () => { try { window.parent.postMessage({ lgh: "dlc", spiel: "schleimmerge", aktion: "frage" }, "*"); } catch (e) { } };
  frage(); setTimeout(() => { if (!DLC.antwort) frage(); }, 2000); setTimeout(() => { if (!DLC.antwort) frage(); }, 6000);
}
function dlcKaufen() { try { window.parent.postMessage({ lgh: "dlc", spiel: "schleimmerge", aktion: "kaufen", id: DLC_ID }, "*"); } catch (e) { } }
const runenAn = () => DLC.besitz && S.ench.runen;
const dlcMult = () => runenAn() ? 1 + RUNEN_BONUS : 1;
const btnSichtbar = () => DLC.besitz || (DLC.imHub && DLC.antwort && DLC.preis > 0);

/* ---------- Runenwaffen: dieselben 84 Waffen als dunkler Stein mit leuchtenden Runen ---------- */
const RUNE_COL = ["#ffb35a", "#9fe6ff", "#ffe27a", "#7ff0ff", "#ff7a3a", "#e08cff", "#9aa6ff", "#ffffff"], runeCache = {};
function runeSprite(l) {
  if (runeCache[l]) return runeCache[l];
  const base = weaponFrame(l, 0), t = wTier(l), wm = weaponMeta(l), o = mkCanvas(base.width, base.height), g = o.getContext("2d"), col = RUNE_COL[t];
  const hd = t === 7 ? [0, -.7] : HEAD[wType(l)], U = WP_U;
  g.drawImage(base, 0, 0);
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = "rgba(22,14,50,.68)"; g.fillRect(0, 0, o.width, o.height);          // dunkler Stein
  g.save(); g.translate(wm.ox, wm.oy); g.lineCap = g.lineJoin = "round";
  for (const [lw, c] of [[.05, col], [.016, "#ffffff"]]) {                          // Runen entlang der Waffe, außen farbig, innen weiß
    g.strokeStyle = c; g.lineWidth = lw * U; g.beginPath();
    for (let i = 0; i < 6; i++) {
      const y = (.06 - i * .17) * U, x = hd[0] * .2 * U, h = .055 * U, v = (i + l) % 3;
      g.moveTo(x, y - h); g.lineTo(x, y + h);
      if (v === 0) { g.moveTo(x - h * .8, y - h * .2); g.lineTo(x, y - h * .9); g.lineTo(x + h * .8, y - h * .2); }
      else if (v === 1) { g.moveTo(x - h * .8, y + h * .7); g.lineTo(x, y); g.lineTo(x + h * .8, y + h * .7); }
      else { g.moveTo(x - h * .7, y - h * .5); g.lineTo(x + h * .7, y + h * .5); }
    }
    g.stroke();
  }
  g.restore();
  g.globalCompositeOperation = "destination-over";                                  // Leuchten hinter der Waffe
  const gx = wm.ox + hd[0] * U, gy = wm.oy + hd[1] * U, rg = g.createRadialGradient(gx, gy, U * .02, gx, gy, U * .62);
  rg.addColorStop(0, hexA(col, .4)); rg.addColorStop(1, hexA(col, 0)); g.fillStyle = rg; g.fillRect(0, 0, o.width, o.height);
  return runeCache[l] = o;
}
const weaponFrameD = (l, tm) => runenAn() ? runeSprite(l) : weaponFrame(l, tm);
function runeFx(c, l, u, col) {   // c: Kontext am Griff der Waffe, wie bei weaponFx
  const t = wTier(l), h = t === 7 ? [0, -.7] : HEAD[wType(l)], ax = h[0] * u, ay = h[1] * u, cc = col || RUNE_COL[t], pr = .5 + .5 * Math.sin(time * 3 + l);
  c.save(); c.globalCompositeOperation = "lighter";
  const rg = c.createRadialGradient(ax, ay, 0, ax, ay, u * .55); rg.addColorStop(0, hexA(cc, .2 + .2 * pr)); rg.addColorStop(1, hexA(cc, 0)); c.fillStyle = rg; c.fillRect(ax - u * .6, ay - u * .6, u * 1.2, u * 1.2);
  c.fillStyle = cc;
  for (let i = 0; i < 4; i++) { const ph = (time * .7 + i / 4 + l * .13) % 1; c.globalAlpha = Math.sin(ph * Math.PI); sparklePath(c, ax + Math.sin(i * 2.3 + l) * u * .18, ay + u * .1 - ph * u * .55, u * .05 * (1 - ph * .4)); c.fill(); }
  c.restore();
}

/* ---------- Verzauberungen ---------- */
const enchLane = i => { if (!DLC.besitz) return null; const k = S.ench.bahn[i], e = ENCH.find(x => x.k === k); return e && S.ench.lv[k] > 0 ? e : null; };
const enchCol = i => { const e = enchLane(i); return e ? e.col : null; };
const enchCost = lv => Math.ceil(rewardOf(S.unlocked) * 6 * Math.pow(1.9, lv));
function enchBefore(i, dmg) {   // vor dem Schlag: Flamme und Frost
  const e = enchLane(i); if (!e) return dmg; const n = S.ench.lv[e.k], r = R[i], Ls = L.lanes[i], mx = Ls.monX, my = Ls.floorY - Ls.monH * .55;
  if (e.k === "flamme") { dmg *= 1 + .12 * n; sparks(mx - Ls.monH * .1, my, 4, "#ff9a3a", 140); }
  else if (e.k === "frost") {
    if (r.frozen) { r.frozen = false; dmg *= 3; say("Eis! ×3", mx, my - Ls.monH * .35, "#9fe6ff", 28); sparks(mx, my, 10, "#bff4ff", 190); }
    else if (Math.random() < .05 * n) { r.frozen = true; say("Eingefroren", mx, my - Ls.monH * .35, "#9fe6ff", 22); sparks(mx, my, 5, "#bff4ff", 110); }
  }
  return dmg;
}
function enchAfter(i, dmg) {   // nach dem Schlag: Blitz springt auf die anderen Bahnen
  const e = enchLane(i); if (!e || e.k !== "blitz" || Math.random() >= .06 * S.ench.lv.blitz) return;
  for (let j = 0; j < 3; j++) if (j !== i && R[j].dying <= 0 && R[j].spawn >= 1) {
    const Lj = L.lanes[j]; sparks(Lj.monX, Lj.floorY - Lj.monH * .5, 9, "#ffe45a", 210); say("Blitz!", Lj.monX, Lj.floorY - Lj.monH * 1.0, "#ffe45a", 24);
    hitMonster(j, dmg * .6, true);
  }
}
const enchCoin = i => { const e = enchLane(i); return e && e.k === "glueck" ? 1 + .1 * S.ench.lv.glueck : 1; };
function enchUp(k) {
  const n = S.ench.lv[k]; if (n >= ENCH_MAX) return;
  const cost = enchCost(n); if (S.coins < cost) { EM.msg = { t: "Zu wenig Münzen", at: time }; sfx.fail(); return; }
  S.coins -= cost; S.ench.lv[k] = n + 1; sfx.buy(); sfx.merge(n + 4); save();
  EM.pulse = { k, at: time };
}

/* ---------- Zeichnen: Glyphen, Knopf, Fenster ---------- */
function enchGlyph(c, k, cx, cy, r) {
  c.save(); c.translate(cx, cy); c.lineJoin = c.lineCap = "round";
  const path = f => { c.beginPath(); f(); }, both = (lw, fill) => { c.strokeStyle = INK; c.lineWidth = lw * 1.9; c.stroke(); if (fill) { c.fillStyle = "#fff"; c.fill(); } else { c.strokeStyle = "#fff"; c.lineWidth = lw; c.stroke(); } };
  if (k === "flamme") { path(() => { c.moveTo(0, -r * .8); c.bezierCurveTo(r * .7, -r * .2, r * .55, r * .7, 0, r * .75); c.bezierCurveTo(-r * .6, r * .7, -r * .7, -r * .1, -r * .2, -r * .35); c.bezierCurveTo(-r * .1, -r * .55, 0, -r * .6, 0, -r * .8); c.closePath(); }); both(r * .1, true); }
  else if (k === "frost") { for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; path(() => { c.moveTo(Math.cos(a) * r * .75, Math.sin(a) * r * .75); c.lineTo(-Math.cos(a) * r * .75, -Math.sin(a) * r * .75); }); both(r * .16, false); } }
  else if (k === "glueck") { for (const [x, y] of [[-.34, -.34], [.34, -.34], [-.34, .34], [.34, .34]]) { path(() => c.arc(x * r, y * r, r * .32, 0, 7)); both(r * .08, true); } }
  else if (k === "blitz") { path(() => { c.moveTo(r * .22, -r * .85); c.lineTo(-r * .45, r * .1); c.lineTo(-r * .02, r * .1); c.lineTo(-r * .22, r * .85); c.lineTo(r * .45, -r * .15); c.lineTo(r * .02, -r * .15); c.closePath(); }); both(r * .1, true); }
  c.restore();
}
function hexPath(c, cx, cy, r) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3 - Math.PI / 2 + Math.PI / 6; i ? c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); }
function enchBadge(i, sl) {
  const e = enchLane(i); if (!e) return; const r = Math.max(11, sl.w * .13), cx = sl.x + sl.w - r * 1.1, cy = sl.y + r * 1.2;
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.fillStyle = e.col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke(); enchGlyph(ctx, e.k, cx, cy, r * .72); ctx.restore();
}
function drawEnchBtn() {
  const m = L.ench; if (!m || !btnSichtbar()) return; const cx = m.x + m.w / 2, cy = m.y + m.h / 2, r = m.w / 2;
  ctx.save(); ctx.lineJoin = ctx.lineCap = "round"; ctx.lineWidth = 3; ctx.strokeStyle = INK;
  const gr = ctx.createLinearGradient(m.x, m.y, m.x + m.w, m.y + m.h);
  if (DLC.besitz) { gr.addColorStop(0, "#9a7bff"); gr.addColorStop(1, "#5a3fd0"); } else { gr.addColorStop(0, "#ffd36b"); gr.addColorStop(1, "#ff8a4a"); }
  hexPath(ctx, cx, cy, r + 1); ctx.fillStyle = gr; ctx.fill(); ctx.stroke();
  if (DLC.besitz) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy - r * .5); ctx.lineTo(cx, cy + r * .5); ctx.moveTo(cx - r * .32, cy - r * .12); ctx.lineTo(cx, cy - r * .5); ctx.lineTo(cx + r * .32, cy - r * .12); ctx.moveTo(cx - r * .3, cy + r * .28); ctx.lineTo(cx + r * .3, cy + r * .02); ctx.stroke(); }
  else txt("DLC", cx, cy + 1, r * .72, "#3a2300", "center", "rgba(0,0,0,0)");
  ctx.restore();
}
const EM = { open: false, zones: [], u: 1, px: 0, py: 0, msg: null, pulse: null };
function drawEnchPanel() {
  if (!EM.open) return;
  const u = Math.min((VW - 12) / 560, (VH - 12) / 640, 1.3), pw = 560 * u, ph = 640 * u, px = (VW - pw) / 2, py = (VH - ph) / 2, Z = [];
  EM.u = u; EM.px = px; EM.py = py;
  ctx.save(); ctx.fillStyle = "rgba(8,10,30,.74)"; ctx.fillRect(0, 0, VW, VH);
  ctx.translate(px, py); ctx.scale(u, u); ctx.lineJoin = ctx.lineCap = "round";
  ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.fillStyle = "#222a5e"; rr(ctx, 0, 0, 560, 640, 22); ctx.fill(); ctx.stroke();
  const zone = (x, y, w, h, f) => Z.push({ x, y, w, h, f });
  zone(0, 0, 560, 640, () => { });   // Tippen ins Fenster schließt es nicht
  txt("Verzauberungen", 24, 36, 32, "#ffd23f", "left", "#141a3c");
  ctx.drawImage(coinSprite(), 300, 20, 32, 32); txt(fmt(S.coins), 340, 36, 26, "#fff", "left", "#141a3c");
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.fillStyle = "#3a3f78"; rr(ctx, 508, 14, 40, 40, 12); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(520, 26); ctx.lineTo(536, 42); ctx.moveTo(536, 26); ctx.lineTo(520, 42); ctx.stroke();
  zone(508, 14, 40, 40, () => { EM.open = false; });
  ENCH.forEach((e, a) => {
    const y = 70 + a * 64, n = S.ench.lv[e.k], pul = EM.pulse && EM.pulse.k === e.k && time - EM.pulse.at < .5 ? 1 + Math.sin((time - EM.pulse.at) / .5 * Math.PI) * .18 : 1;
    ctx.fillStyle = "#2b3470"; ctx.lineWidth = 3; ctx.strokeStyle = INK; rr(ctx, 12, y, 536, 58, 14); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(44, y + 29); ctx.scale(pul, pul); ctx.fillStyle = e.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fill(); ctx.stroke(); enchGlyph(ctx, e.k, 0, 0, 16); ctx.restore();
    txt(e.name + "  Stufe " + n + "/" + ENCH_MAX, 80, y + 19, 24, "#fff", "left", "#141a3c");
    txt(n ? e.txt(n) : "noch nicht aufgewertet", 80, y + 43, 17, n ? "#bff7ff" : "#8f98c8", "left", "#141a3c");
    const bx = 380, by = y + 7, bw = 160, bh = 44;
    if (n >= ENCH_MAX) { ctx.fillStyle = "#3a3f78"; rr(ctx, bx, by, bw, bh, 12); ctx.fill(); ctx.stroke(); txt("Maximal", bx + bw / 2, by + bh / 2, 22, "#ffd23f", "center", "#141a3c"); }
    else {
      const cost = enchCost(n), can = S.coins >= cost; ctx.fillStyle = can ? "#2f9d63" : "#3a3f78"; rr(ctx, bx, by, bw, bh, 12); ctx.fill(); ctx.stroke();
      txt("+", bx + 20, by + bh / 2, 28, can ? "#fff" : "#9aa2d0", "center", "#141a3c"); ctx.drawImage(coinSprite(), bx + 38, by + 8, 28, 28); txt(fmt(cost), bx + 72, by + bh / 2, 24, can ? "#fff" : "#aab2e0", "left", "#141a3c");
      zone(bx, by, bw, bh, () => enchUp(e.k));
    }
  });
  txt("Welche Verzauberung trägt welche Bahn?", 24, 346, 20, "#ffd23f", "left", "#141a3c");
  for (let i = 0; i < 3; i++) {
    const y = 364 + i * 56; txt("Bahn " + (i + 1), 24, y + 26, 22, "#fff", "left", "#141a3c");
    for (let c = 0; c < 5; c++) {
      const e = c ? ENCH[c - 1] : null, x = 112 + c * 86, can = !e || S.ench.lv[e.k] > 0, sel = (e ? e.k : null) === S.ench.bahn[i];
      ctx.save(); ctx.globalAlpha = can ? 1 : .35; ctx.lineWidth = sel ? 4 : 3; ctx.strokeStyle = sel ? "#ffd23f" : INK; ctx.fillStyle = sel ? "#4a55a8" : "#2b3470"; rr(ctx, x, y + 4, 76, 44, 12); ctx.fill(); ctx.stroke();
      if (e) { ctx.fillStyle = e.col; ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(x + 38, y + 26, 16, 0, 7); ctx.fill(); ctx.stroke(); enchGlyph(ctx, e.k, x + 38, y + 26, 12); }
      else txt("keine", x + 38, y + 27, 20, "#c9d1ff", "center", "#141a3c");
      ctx.restore(); if (can) zone(x, y + 4, 76, 44, () => { S.ench.bahn[i] = e ? e.k : null; sfx.move(); save(); });
    }
  }
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.fillStyle = "#2b3470"; rr(ctx, 12, 546, 536, 64, 14); ctx.fill(); ctx.stroke();
  txt("Runenwaffen", 28, 568, 24, "#fff", "left", "#141a3c"); txt("Neue Waffenreihe, +" + Math.round(RUNEN_BONUS * 100) + "% Schaden", 28, 594, 17, "#bff7ff", "left", "#141a3c");
  ctx.fillStyle = S.ench.runen ? "#2f9d63" : "#3a3f78"; rr(ctx, 380, 556, 160, 44, 12); ctx.fill(); ctx.stroke(); txt(S.ench.runen ? "An" : "Aus", 460, 579, 24, "#fff", "center", "#141a3c");
  zone(380, 556, 160, 44, () => { S.ench.runen = !S.ench.runen; sfx.pick(); save(); });
  txt("Die Verzauberung wirkt auf den Schleim, der in der Bahn kämpft.", 280, 626, 15, "#8f98c8", "center", "#141a3c");
  if (EM.msg && time - EM.msg.at < 1.4) txt(EM.msg.t, 280, 332, 24, "#ffb0b0", "center", "#141a3c");
  ctx.restore(); EM.zones = Z;
}
function enchPointer(e) {   // true, wenn die Eingabe dem Verzauberungs-Knopf oder -Fenster gehört
  const p = pt(e);
  if (EM.open) {
    e.preventDefault(); const vx = (p.x - EM.px) / EM.u, vy = (p.y - EM.py) / EM.u;
    if (vx < 0 || vy < 0 || vx > 560 || vy > 640) { EM.open = false; return true; }
    for (let i = EM.zones.length - 1; i >= 0; i--) { const z = EM.zones[i]; if (vx >= z.x && vx <= z.x + z.w && vy >= z.y && vy <= z.y + z.h) { z.f(); break; } }
    return true;
  }
  if (L.ench && btnSichtbar() && inR(p, L.ench)) { e.preventDefault(); audio(); if (DLC.besitz) { EM.open = true; sfx.pick(); } else dlcKaufen(); return true; }
  return false;
}
