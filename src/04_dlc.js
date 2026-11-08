"use strict";
/* ===== DLC „Runenschmiede“: Runenwaffen (zufällig dabei) und Verzauberungen =====
   Runenwaffen: 20 % aller neuen Waffen (Kauf, Kiste) sind Runenwaffen, +50 % Schaden. Zwei Runenwaffen ergeben wieder eine Runenwaffe
   (die nächste Stufe), Runenwaffe plus normale Waffe ergibt eine normale. Verzauberungen sind allgemein (nicht je Waffe), je Bahn wählbar.
   Bezahlt wird mit Runensplittern: Du hast so viele, wie dein höchstes erreichtes Waffenlevel ist (S.best); jede Stufe kostet gleich viel
   (ENCH_KOSTEN), unabhängig vom Spielfortschritt. Stufen lassen sich jederzeit zurücknehmen und anders verteilen.
   Gekauft wird nur im Leif Game Hub (dort mit Hexis, dem Guthaben des Hubs). Das Spiel fragt den Hub per postMessage
   ({lgh:"dlc", spiel, aktion:"frage"}) und bekommt Besitz und Preis zurück. Ohne Hub (oder ohne Kauf) bleibt alles wie vorher:
   Verzauberungen und Runenwaffen wirken dann nicht, der Spielstand bleibt aber erhalten. */
const DLC_ID = "schleimmerge-runen", RUNEN_BONUS = .5, RUNEN_CHANCE = .2, ENCH_MAX = 10, ENCH_KOSTEN = 2;
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
  S.ench = { lv, bahn: [0, 1, 2].map(i => ENCH.some(x => x.k === b[i]) && b.indexOf(b[i]) === i ? b[i] : null) };
  let over = ENCH.reduce((a, x) => a + lv[x.k], 0) * ENCH_KOSTEN - S.best;   // mehr Stufen als Runensplitter (alter Stand): von den höchsten Stufen herunter
  while (over > 0) { const x = ENCH.reduce((m, y) => lv[y.k] > lv[m.k] ? y : m, ENCH[0]); if (!lv[x.k]) break; lv[x.k]--; over -= ENCH_KOSTEN; }
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
const runenAn = ru => DLC.besitz && !!ru;                              // ru: ist diese Waffe eine Runenwaffe?
const dlcMult = ru => runenAn(ru) ? 1 + RUNEN_BONUS : 1;
const neueRunenwaffe = () => DLC.besitz && Math.random() < RUNEN_CHANCE;   // neue Waffe aus Kauf oder Kiste
const mergeRune = (a, b) => a && b ? 1 : 0;                              // Rune + Rune = Rune, sonst normal
const mergeMax = () => DLC.besitz ? DLC_MAX : BASE_MAX;                    // Nur mit dem DLC lassen sich 87+87 zu Waffe 88 und 88+88 zu Waffe 89 verbinden
const listMax = () => Math.max(mergeMax(), S.best);                      // Liste: Besitzer sehen 89, alle sehen auch, was sie schon haben
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
const weaponFrameD = (l, tm, ru) => runenAn(ru) ? runeSprite(l) : weaponFrame(l, tm);
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
const splitterGesamt = () => S.best;                                      // so viele Runensplitter wie das höchste erreichte Waffenlevel
const splitterFrei = () => Math.max(0, S.best - ENCH_KOSTEN * ENCH.reduce((a, x) => a + S.ench.lv[x.k], 0));
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
  if (splitterFrei() < ENCH_KOSTEN) { EM.msg = { t: "Zu wenig Runensplitter", at: time }; sfx.fail(); return; }
  S.ench.lv[k] = n + 1; sfx.pick(); sfx.merge(n + 4); save();
  EM.pulse = { k, at: time };
}
function enchDown(k) { const n = S.ench.lv[k]; if (n <= 0) return; S.ench.lv[k] = n - 1; sfx.move(); save(); EM.pulse = { k, at: time }; }
function splitterIcon(c, cx, cy, r) {   // kleiner Runensplitter: Kristall mit Glanz
  c.save(); c.lineJoin = "round"; c.lineWidth = Math.max(2, r * .16); c.strokeStyle = INK; c.fillStyle = "#b99cff";
  c.beginPath(); c.moveTo(cx, cy - r); c.lineTo(cx + r * .7, cy - r * .1); c.lineTo(cx + r * .35, cy + r); c.lineTo(cx - r * .35, cy + r); c.lineTo(cx - r * .7, cy - r * .1); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "rgba(255,255,255,.7)"; c.beginPath(); c.moveTo(cx - r * .05, cy - r * .7); c.lineTo(cx + r * .3, cy - r * .1); c.lineTo(cx - r * .05, cy - r * .1); c.closePath(); c.fill(); c.restore();
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
  splitterIcon(ctx, 322, 36, 17); txt(splitterFrei() + " / " + splitterGesamt(), 346, 36, 26, "#fff", "left", "#141a3c");
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.fillStyle = "#3a3f78"; rr(ctx, 508, 14, 40, 40, 12); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(520, 26); ctx.lineTo(536, 42); ctx.moveTo(536, 26); ctx.lineTo(520, 42); ctx.stroke();
  zone(508, 14, 40, 40, () => { EM.open = false; });
  ENCH.forEach((e, a) => {
    const y = 70 + a * 64, n = S.ench.lv[e.k], pul = EM.pulse && EM.pulse.k === e.k && time - EM.pulse.at < .5 ? 1 + Math.sin((time - EM.pulse.at) / .5 * Math.PI) * .18 : 1;
    ctx.fillStyle = "#2b3470"; ctx.lineWidth = 3; ctx.strokeStyle = INK; rr(ctx, 12, y, 536, 58, 14); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(44, y + 29); ctx.scale(pul, pul); ctx.fillStyle = e.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fill(); ctx.stroke(); enchGlyph(ctx, e.k, 0, 0, 16); ctx.restore();
    txt(e.name + "  Stufe " + n + "/" + ENCH_MAX, 80, y + 19, 24, "#fff", "left", "#141a3c");
    txt(n ? e.txt(n) : "noch nicht aufgewertet", 80, y + 43, 17, n ? "#bff7ff" : "#8f98c8", "left", "#141a3c");
    const by = y + 7, bh = 44, mx = 380, mw = 44, px2 = 430, pw2 = 110;   // links "−" (Stufe zurücknehmen), rechts "+" mit Preis in Runensplittern
    ctx.fillStyle = n > 0 ? "#4a55a8" : "#3a3f78"; rr(ctx, mx, by, mw, bh, 12); ctx.fill(); ctx.stroke(); txt("−", mx + mw / 2, by + bh / 2, 30, n > 0 ? "#fff" : "#7f88b8", "center", "#141a3c");
    if (n > 0) zone(mx, by, mw, bh, () => enchDown(e.k));
    if (n >= ENCH_MAX) { ctx.fillStyle = "#3a3f78"; rr(ctx, px2, by, pw2, bh, 12); ctx.fill(); ctx.stroke(); txt("Maximal", px2 + pw2 / 2, by + bh / 2, 20, "#ffd23f", "center", "#141a3c"); }
    else {
      const can = splitterFrei() >= ENCH_KOSTEN; ctx.fillStyle = can ? "#2f9d63" : "#3a3f78"; rr(ctx, px2, by, pw2, bh, 12); ctx.fill(); ctx.stroke();
      txt("+", px2 + 22, by + bh / 2, 28, can ? "#fff" : "#9aa2d0", "center", "#141a3c"); splitterIcon(ctx, px2 + 56, by + bh / 2, 13); txt(String(ENCH_KOSTEN), px2 + 76, by + bh / 2, 24, can ? "#fff" : "#aab2e0", "left", "#141a3c");
      zone(px2, by, pw2, bh, () => enchUp(e.k));
    }
  });
  txt("Welche Verzauberung trägt welche Bahn?", 24, 340, 20, "#ffd23f", "left", "#141a3c"); txt("Jede Verzauberung kann nur eine Bahn tragen.", 24, 358, 14, "#8f98c8", "left", "#141a3c");
  for (let i = 0; i < 3; i++) {
    const y = 366 + i * 56; txt("Bahn " + (i + 1), 24, y + 26, 22, "#fff", "left", "#141a3c");
    for (let c = 0; c < 5; c++) {
      const e = c ? ENCH[c - 1] : null, x = 112 + c * 86, can = !e || S.ench.lv[e.k] > 0, sel = (e ? e.k : null) === S.ench.bahn[i];
      ctx.save(); ctx.globalAlpha = can ? 1 : .35; ctx.lineWidth = sel ? 4 : 3; ctx.strokeStyle = sel ? "#ffd23f" : INK; ctx.fillStyle = sel ? "#4a55a8" : "#2b3470"; rr(ctx, x, y + 4, 76, 44, 12); ctx.fill(); ctx.stroke();
      if (e) { ctx.fillStyle = e.col; ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(x + 38, y + 26, 16, 0, 7); ctx.fill(); ctx.stroke(); enchGlyph(ctx, e.k, x + 38, y + 26, 12); }
      else txt("keine", x + 38, y + 27, 20, "#c9d1ff", "center", "#141a3c");
      ctx.restore(); if (can) zone(x, y + 4, 76, 44, () => { if (e) for (let j = 0; j < 3; j++) if (j !== i && S.ench.bahn[j] === e.k) S.ench.bahn[j] = null; S.ench.bahn[i] = e ? e.k : null; sfx.move(); save(); });   // jede Verzauberung trägt nur eine Bahn
    }
  }
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.fillStyle = "#2b3470"; rr(ctx, 12, 546, 536, 64, 14); ctx.fill(); ctx.stroke();
  txt("Runenwaffen", 28, 566, 24, "#fff", "left", "#141a3c"); txt(Math.round(RUNEN_CHANCE * 100) + "% der neuen Waffen, +" + Math.round(RUNEN_BONUS * 100) + "% Schaden", 28, 586, 16, "#bff7ff", "left", "#141a3c");
  txt("Rune + Rune = Rune, Rune + normal = normal", 28, 604, 14, "#8f98c8", "left", "#141a3c");
  txt("Runensplitter = dein höchstes Waffenlevel · jede Stufe kostet " + ENCH_KOSTEN + " · jederzeit umverteilbar", 280, 626, 14, "#8f98c8", "center", "#141a3c");
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
