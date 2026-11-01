"use strict";
/* ===== Alles wird selbst gezeichnet (keine Emojis, keine Zeichen als Bilder). Sprites werden einmal erzeugt und dann gecacht. ===== */

/* ---------- Schleime ---------- */
function slimePalette(l) {
  const H = [190, 125, 320, 38, 0, 270, 160, 15, 300, 210];
  const h = l <= 10 ? H[l - 1] : (l * 47 + 13) % 360;
  const span = l <= 10 ? 16 : Math.min(260, 16 + (l - 10) * 5.5);   // ab Stufe 10 wird der Verlauf immer bunter
  return [hsl(h, .9, .75), hsl(h + span * .5, .85, .63), hsl(h + span, .8, .52)];
}
const SL_W = 256, SL_U = 210, SL_OX = 128, SL_OY = 228;
const slimeCache = {}, faceCache = {}, weapCache = {}, silCache = {};
function shadeHex(hex, k) { const p = parseInt(hex.slice(1), 16), m = sh => Math.round(((p >> sh) & 255) * (1 - k)); return "rgb(" + m(16) + "," + m(8) + "," + m(0) + ")"; }
function bodyPath(c) { c.beginPath(); c.moveTo(-.5, -.02); c.bezierCurveTo(-.58, -.3, -.3, -.78, 0, -.78); c.bezierCurveTo(.3, -.78, .58, -.3, .5, -.02); c.quadraticCurveTo(0, .05, -.5, -.02); c.closePath(); }
function slimeHat(c, g, t, l) {   // Kopfschmuck je Materialstufe: ab Eisen gibt es etwas auf dem Kopf
  c.lineWidth = .03;
  if (t === 1) { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, -.77); c.bezierCurveTo(s * .06, -.9, s * .2, -.95, s * .26, -.88); c.bezierCurveTo(s * .22, -.78, s * .1, -.74, 0, -.77); c.closePath(); FS(c, s < 0 ? "#6fc05a" : "#8fd86a"); } }
  else if (t === 2) { crownShape(c, g, 0, -.74, .7); }
  else if (t === 3) { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * .13, -.72); c.lineTo(s * .22, -.98); c.lineTo(s * .3, -.7); c.closePath(); FS(c, "#9ff0ff"); g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = .02; g.beginPath(); g.moveTo(s * .22, -.94); g.lineTo(s * .2, -.78); g.stroke(); g.strokeStyle = INK; } }
  else if (t === 4) { const fl = [[-.14, -.74, .13, "#ff7a2a"], [.14, -.74, .13, "#ff7a2a"], [0, -.78, .18, "#ffb02a"]]; for (const f of fl) { c.beginPath(); c.moveTo(f[0] - f[2] * .6, f[1]); c.quadraticCurveTo(f[0] - f[2] * .3, f[1] - f[2] * 1.4, f[0], f[1] - f[2] * 2.1); c.quadraticCurveTo(f[0] + f[2] * .4, f[1] - f[2] * 1.2, f[0] + f[2] * .6, f[1]); c.closePath(); FS(c, f[3]); } }
  else if (t === 5) { c.lineWidth = .035; c.beginPath(); c.ellipse(0, -.93, .22, .06, 0, 0, 7); c.strokeStyle = "#ffe27a"; c.stroke(); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = .014; g.beginPath(); g.ellipse(0, -.935, .2, .045, 0, 3.4, 5.6); g.stroke(); g.strokeStyle = INK; }
}
function slimeSprite(l) {
  return slimeCache[l] || (slimeCache[l] = makeSprite(SL_W, SL_W, SL_OX, SL_OY, SL_U, l * .37 + 1, (c, g) => {
    const pal = slimePalette(l), t = wTier(l);
    g.fillStyle = "rgba(10,10,50,.22)"; g.beginPath(); g.ellipse(0, .0, .56, .07, 0, 0, 7); g.fill();
    const gr = g.createLinearGradient(0, -.78, 0, 0); gr.addColorStop(0, pal[0]); gr.addColorStop(.5, pal[1]); gr.addColorStop(1, pal[2]);
    bodyPath(c); c.lineWidth = .04; FS(c, gr);
    /* Schattierung nur innerhalb des Körpers: dunkler Rand, Rückstrahlung unten, heller Kern oben */
    g.save(); bodyPath(c); c.clip();
    const rg = g.createRadialGradient(-.08, -.46, .08, 0, -.36, .66); rg.addColorStop(0, "rgba(255,255,255,.22)"); rg.addColorStop(.55, "rgba(255,255,255,0)"); rg.addColorStop(1, "rgba(25,10,70,.34)"); g.fillStyle = rg; g.fillRect(-.7, -.9, 1.4, 1);
    const bg = g.createLinearGradient(0, -.2, 0, 0); bg.addColorStop(0, "rgba(255,255,255,0)"); bg.addColorStop(1, "rgba(255,255,255,.3)"); g.fillStyle = bg; g.fillRect(-.7, -.2, 1.4, .25);
    g.restore();
    /* Glanz */
    g.fillStyle = "rgba(255,255,255,.88)"; c.beginPath(); c.ellipse(-.25, -.57, .075, .16, -.5, 0, 7); c.fill();
    g.beginPath(); g.arc(-.12, -.7, .032, 0, 7); g.fill(); g.beginPath(); g.arc(-.32, -.4, .02, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = .028; g.beginPath(); g.arc(0, -.36, .42, -.5, .35); g.stroke();
    g.strokeStyle = INK;
    if (l >= 25) { g.fillStyle = "rgba(255,255,255,.95)"; sparklePath(g, .22, -.5, .07); g.fill(); sparklePath(g, .3, -.3, .045); g.fill(); sparklePath(g, -.3, -.22, .04); g.fill(); }
    if (t) slimeHat(c, g, t, l);
  }, .006));
}
function faceSprite(l, state) {   // state: 0 offen, 1 blinzeln, 2 Angriff
  const v = l % 4, key = v + "_" + state;
  return faceCache[key] || (faceCache[key] = makeSprite(SL_W, SL_W, SL_OX, SL_OY, SL_U, 7.7 + v, (c, g) => {
    g.fillStyle = "rgba(255,100,140,.55)"; c.beginPath(); c.ellipse(-.31, -.26, .07, .04, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(.31, -.26, .07, .04, 0, 0, 7); c.fill();
    for (const sx of [-1, 1]) {
      const ex = sx * .17, ey = -.38;
      if (state === 1) { c.lineWidth = .028; c.beginPath(); c.arc(ex, ey, .05, .15 * Math.PI, .85 * Math.PI); c.stroke(); }
      else { g.fillStyle = INK; c.beginPath(); c.ellipse(ex, ey, .06, .078, 0, 0, 7); c.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(ex + .02, ey - .028, .026, 0, 7); g.fill(); g.beginPath(); g.arc(ex - .02, ey + .03, .012, 0, 7); g.fill(); }
    }
    c.lineWidth = .028;
    if (state === 2) { c.beginPath(); c.ellipse(0, -.24, .06, .075, 0, 0, 7); FS(c, INK); g.fillStyle = "#ff7a95"; g.beginPath(); g.ellipse(0, -.205, .04, .035, 0, 0, 7); g.fill(); }
    else if (v === 0) { c.beginPath(); c.arc(0, -.31, .075, .15 * Math.PI, .85 * Math.PI); c.stroke(); }
    else if (v === 1) { c.beginPath(); c.arc(-.04, -.29, .04, .1 * Math.PI, .9 * Math.PI); c.stroke(); c.beginPath(); c.arc(.04, -.29, .04, .1 * Math.PI, .9 * Math.PI); c.stroke(); }
    else if (v === 2) { c.beginPath(); c.moveTo(-.08, -.3); c.quadraticCurveTo(0, -.17, .08, -.3); c.closePath(); FS(c, INK); g.fillStyle = "#ff7a95"; g.beginPath(); g.ellipse(0, -.225, .035, .028, 0, 0, 7); g.fill(); }
    else { c.beginPath(); c.ellipse(0, -.26, .035, .05, 0, 0, 7); FS(c, INK); }
  }, .003));
}
function slimeSil(l) { return silCache[l] || (silCache[l] = silhouette(slimeSprite(l), "#222a4a")); }

/* ---------- Waffen ---------- */
const WTYPES = ["keule", "schwert", "axt", "speer", "hammer", "zauberstab", "dolch", "dreizack", "mondstab", "streitkolben", "doppelaxt", "sense"];
const WTIERS = ["Holz", "Eisen", "Gold", "Kristall", "Feuer", "Magie"];
const MATS = [
  { m: "#c9a06a", d: "#8a5e30", h: "#8a5a2e", g: "#ffe27a" },
  { m: "#d5dce6", d: "#8895a8", h: "#7a4a2a", g: "#ffffff" },
  { m: "#ffd95a", d: "#d19a1c", h: "#8a3b2a", g: "#fff3b0" },
  { m: "#8fe9ff", d: "#3fb6d6", h: "#365a9c", g: "#e2fbff" },
  { m: "#ff9a4a", d: "#d8431c", h: "#4a2a2a", g: "#ffe29a" },
  { m: "#d89bff", d: "#8a46d0", h: "#2f2a5a", g: "#ffd6ff" }
];
const wType = l => (l - 1) % 12, wTier = l => Math.min(5, Math.floor((l - 1) / 12));
function slimeName(l) { const t = WTYPES[wType(l)]; return WTIERS[wTier(l)] + t; }
const WP_W = 256, WP_U = 190, WP_OX = 128, WP_OY = 205;
function weaponShape(c, g, type, M) {
  const shaft = (y0, y1, w) => { c.beginPath(); c.moveTo(-w, y0); c.lineTo(w, y0); c.lineTo(w * .9, y1); c.lineTo(-w * .9, y1); c.closePath(); FS(c, M.h); };
  const grip = () => { g.strokeStyle = hexA(INK, .5); g.lineWidth = .018; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-.04, -.02 + i * .05); g.lineTo(.04, .02 + i * .05); g.stroke(); } g.strokeStyle = INK; g.lineWidth = .03; };
  const poly = (pts, fill) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); FS(c, fill); };
  switch (type) {
    case 0: shaft(.12, -.42, .04); grip();
      c.beginPath(); c.moveTo(-.05, -.38); c.bezierCurveTo(-.22, -.5, -.24, -.86, 0, -.92); c.bezierCurveTo(.24, -.86, .22, -.5, .05, -.38); c.closePath(); FS(c, M.m);
      for (const p of [[-.09, -.62, .03], [.1, -.7, .03], [0, -.8, .03], [.07, -.52, .025]]) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, 7); FS(c, M.d); }
      break;
    case 1: poly([[-.07, -.28], [-.07, -.78], [0, -.97], [.07, -.78], [.07, -.28]], M.m);
      g.strokeStyle = M.d; g.lineWidth = .022; g.beginPath(); g.moveTo(0, -.3); g.lineTo(0, -.84); g.stroke(); g.strokeStyle = INK; g.lineWidth = .03;
      poly([[-.21, -.28], [.21, -.28], [.19, -.2], [-.19, -.2]], M.d); shaft(-.2, .08, .036); grip();
      c.beginPath(); c.arc(0, .12, .055, 0, 7); FS(c, M.d); break;
    case 2: shaft(.12, -.88, .035); grip();
      c.beginPath(); c.moveTo(.03, -.84); c.bezierCurveTo(.3, -.98, .44, -.76, .35, -.48); c.bezierCurveTo(.3, -.38, .2, -.42, .03, -.5); c.closePath(); FS(c, M.m);
      g.strokeStyle = M.d; g.lineWidth = .02; g.beginPath(); g.moveTo(.1, -.76); g.quadraticCurveTo(.3, -.8, .33, -.55); g.stroke(); g.strokeStyle = INK; g.lineWidth = .03;
      poly([[-.03, -.8], [-.14, -.72], [-.03, -.64]], M.d); break;
    case 3: shaft(.15, -.72, .03); grip();
      c.beginPath(); c.moveTo(0, -.98); c.bezierCurveTo(.14, -.86, .12, -.74, .05, -.68); c.lineTo(-.05, -.68); c.bezierCurveTo(-.12, -.74, -.14, -.86, 0, -.98); c.closePath(); FS(c, M.m);
      poly([[-.07, -.7], [.07, -.7], [.06, -.64], [-.06, -.64]], M.d); poly([[.03, -.62], [.2, -.55], [.03, -.5]], M.d); break;
    case 4: shaft(.12, -.7, .035); grip();
      c.beginPath(); c.rect(-.26, -.92, .52, .3); FS(c, M.m);
      poly([[-.3, -.95], [-.2, -.95], [-.2, -.59], [-.3, -.59]], M.d); poly([[.3, -.95], [.2, -.95], [.2, -.59], [.3, -.59]], M.d);
      g.strokeStyle = hexA("#ffffff", .5); g.lineWidth = .02; g.beginPath(); g.moveTo(-.14, -.86); g.lineTo(.12, -.86); g.stroke(); g.strokeStyle = INK; g.lineWidth = .03; break;
    case 5: shaft(.14, -.72, .028); grip();
      starPath(c, 0, -.82, .22, .095, 0); FS(c, M.m);
      c.beginPath(); c.arc(0, -.82, .045, 0, 7); FS(c, M.g);
      g.fillStyle = "rgba(255,255,255,.95)"; sparklePath(g, .26, -.96, .05); g.fill(); sparklePath(g, -.25, -.68, .04); g.fill(); break;
    case 6: poly([[-.055, -.12], [-.055, -.5], [0, -.66], [.055, -.5], [.055, -.12]], M.m);
      poly([[-.15, -.12], [.15, -.12], [.13, -.06], [-.13, -.06]], M.d); shaft(-.06, .1, .033); grip();
      c.beginPath(); c.arc(0, .13, .045, 0, 7); FS(c, M.d); break;
    case 7: shaft(.14, -.55, .03); grip();
      poly([[-.2, -.7], [-.14, -.7], [-.14, -.62], [-.12, -.6], [0, -.6], [.12, -.6], [.14, -.62], [.14, -.7], [.2, -.7], [.2, -.52], [.1, -.46], [-.1, -.46], [-.2, -.52]], M.m);
      poly([[-.2, -.7], [-.2, -.84], [-.17, -.92], [-.14, -.84], [-.14, -.7]], M.m); poly([[.2, -.7], [.2, -.84], [.17, -.92], [.14, -.84], [.14, -.7]], M.m);
      poly([[-.04, -.6], [-.04, -.86], [0, -.99], [.04, -.86], [.04, -.6]], M.m); break;
    case 8: shaft(.14, -.55, .028); grip();
      c.beginPath(); c.arc(0, -.72, .23, .949, 5.334, false); c.arc(.1, -.72, .19, 4.893, 1.39, true); c.closePath(); FS(c, M.m);
      g.fillStyle = M.g; sparklePath(g, .1, -.72, .06); g.fill(); break;
    case 9: shaft(.14, -.56, .03); grip();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .2, cx = 0, cy = -.74; poly([[cx + Math.cos(a - .28) * .15, cy + Math.sin(a - .28) * .15], [cx + Math.cos(a) * .3, cy + Math.sin(a) * .3], [cx + Math.cos(a + .28) * .15, cy + Math.sin(a + .28) * .15]], M.d); }
      c.beginPath(); c.arc(0, -.74, .17, 0, 7); FS(c, M.m); g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(-.06, -.8, .04, 0, 7); g.fill(); break;
    case 10: shaft(.12, -.9, .035); grip();
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * .03, -.84); c.bezierCurveTo(s * .3, -.98, s * .44, -.76, s * .35, -.5); c.bezierCurveTo(s * .3, -.4, s * .2, -.44, s * .03, -.52); c.closePath(); FS(c, M.m); }
      c.beginPath(); c.arc(0, -.68, .06, 0, 7); FS(c, M.d); break;
    default: shaft(.14, -.9, .03); grip();
      c.beginPath(); c.moveTo(-.02, -.9); c.bezierCurveTo(.3, -1, .56, -.82, .62, -.52); c.bezierCurveTo(.46, -.7, .26, -.76, -.02, -.74); c.closePath(); FS(c, M.m);
      g.strokeStyle = M.d; g.lineWidth = .02; g.beginPath(); g.moveTo(.1, -.82); g.quadraticCurveTo(.4, -.84, .55, -.62); g.stroke(); g.strokeStyle = INK; g.lineWidth = .03; break;
  }
}
function weaponSprite(l) {
  return weapCache[l] || (weapCache[l] = makeSprite(WP_W, WP_W, WP_OX, WP_OY, WP_U, l * .53 + 3, (c, g) => {
    const t = wTier(l), M = MATS[t];
    if (t >= 4) { const gr = g.createRadialGradient(0, -.7, .02, 0, -.7, .5); gr.addColorStop(0, t === 4 ? "rgba(255,160,60,.5)" : "rgba(210,140,255,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(-.7, -1.2, 1.4, 1.4); }
    c.lineWidth = .04; weaponShape(c, g, wType(l), M);
    g.save(); g.globalCompositeOperation = "source-atop";
    const sh = g.createLinearGradient(-.32, 0, .32, 0); sh.addColorStop(0, "rgba(255,255,255,.55)"); sh.addColorStop(.38, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(10,10,60,.34)"); g.fillStyle = sh; g.fillRect(-.8, -1.3, 1.6, 1.6);
    const tp = g.createLinearGradient(0, -1, 0, .1); tp.addColorStop(0, "rgba(255,255,255,.22)"); tp.addColorStop(1, "rgba(0,0,40,.12)"); g.fillStyle = tp; g.fillRect(-.8, -1.3, 1.6, 1.6);
    g.restore();
    if (t >= 2) { g.fillStyle = "rgba(255,255,255,.95)"; sparklePath(g, .12, -.85, .05); g.fill(); }
    if (t >= 3) { g.fillStyle = "rgba(255,255,255,.9)"; sparklePath(g, -.14, -.62, .035); g.fill(); }
  }, .006));
}

/* ---------- Monster ---------- */
const MON_W = 320, MON_U = 230, MON_OX = 160, MON_OY = 292;
const MONS = [
  { name: "Pilzling", top: .88, cx: 0, pal: [{ a: "#e5575b", b: "#f6e9cf", d: "#9c2f45" }, { a: "#7a5cd6", b: "#efe6ff", d: "#47318f" }, { a: "#e0a030", b: "#fff0c8", d: "#a8641a" }] },
  { name: "Stachelgel", top: .76, cx: -.1, pal: [{ a: "#a77b52", b: "#f0d2a0", d: "#5c3d28" }, { a: "#6c8ab0", b: "#dbe8f5", d: "#38506e" }, { a: "#9b6bb6", b: "#f1ddf7", d: "#582f70" }] },
  { name: "Steinbrocken", top: .76, cx: 0, pal: [{ a: "#9aa3b6", b: "#c9cfdc", d: "#586075" }, { a: "#b08a6a", b: "#d9bfa4", d: "#6b4a30" }, { a: "#6fa6a0", b: "#b9dcd7", d: "#356a66" }] },
  { name: "Fledermaus", top: .86, cx: 0, pal: [{ a: "#6b5fa8", b: "#b6a9e6", d: "#3a2f70" }, { a: "#c25a7a", b: "#f2b7c8", d: "#7a2a45" }, { a: "#3f8a8f", b: "#a8dfe0", d: "#1e5256" }] },
  { name: "Geistchen", top: .84, cx: 0, pal: [{ a: "#eef3ff", b: "#ffffff", d: "#9ab0d8" }, { a: "#e2ffe9", b: "#ffffff", d: "#8ccfa0" }, { a: "#ffe6f0", b: "#ffffff", d: "#e0a0bc" }] },
  { name: "Funkendrache", top: .9, cx: -.25, pal: [{ a: "#58b25a", b: "#f3e29a", d: "#2f7a3a" }, { a: "#e0564a", b: "#ffd9a0", d: "#8e2a22" }, { a: "#4a8fd8", b: "#d7ecff", d: "#27528c" }] }
];
function monEye(c, g, x, y, r, brow, side) {
  c.lineWidth = .026; c.beginPath(); c.ellipse(x, y, r, r * 1.15, 0, 0, 7); FS(c, "#fff");
  g.fillStyle = INK; g.beginPath(); g.arc(x - r * .32, y + r * .1, r * .55, 0, 7); g.fill();
  g.fillStyle = "#fff"; g.beginPath(); g.arc(x - r * .45, y - r * .1, r * .18, 0, 7); g.fill();
  if (brow) { c.lineWidth = .03; c.beginPath(); if (side < 0) { c.moveTo(x - r * 1.3, y - r * 1.9); c.lineTo(x + r * 1.2, y - r * 1.05); } else { c.moveTo(x - r * 1.2, y - r * 1.05); c.lineTo(x + r * 1.3, y - r * 1.9); } c.stroke(); }
}
const MONDRAW = [
  (c, g, P) => { // Pilz
    c.beginPath(); c.moveTo(-.22, 0); c.bezierCurveTo(-.3, -.15, -.26, -.33, -.2, -.44); c.lineTo(.2, -.44); c.bezierCurveTo(.26, -.33, .3, -.15, .22, 0); c.quadraticCurveTo(0, .05, -.22, 0); c.closePath(); FS(c, P.b);
    c.beginPath(); c.moveTo(-.54, -.42); c.bezierCurveTo(-.58, -.8, -.22, -.9, 0, -.9); c.bezierCurveTo(.22, -.9, .58, -.8, .54, -.42); c.quadraticCurveTo(0, -.34, -.54, -.42); c.closePath(); FS(c, P.a);
    for (const p of [[-.28, -.66, .08], [.06, -.76, .09], [.32, -.6, .065], [-.04, -.52, .045]]) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, 7); FS(c, "#fff"); }
    monEye(c, g, -.1, -.3, .05, true, -1); monEye(c, g, .08, -.3, .05, true, 1);
    c.lineWidth = .025; c.beginPath(); c.moveTo(-.1, -.15); c.lineTo(-.05, -.2); c.lineTo(0, -.15); c.lineTo(.05, -.2); c.lineTo(.1, -.15); c.stroke();
  },
  (c, g, P) => { // Igel
    c.beginPath(); for (let k = 0; k <= 16; k++) { const a = Math.PI * (1 + k / 16), o = k % 2; const x = .06 + Math.cos(a) * (o ? .66 : .5), y = -.3 + Math.sin(a) * (o ? .46 : .3); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.lineTo(.5, -.2); c.lineTo(-.4, -.2); c.closePath(); FS(c, P.d);
    c.beginPath(); c.ellipse(.04, -.28, .5, .3, 0, 0, 7); FS(c, P.a);
    c.beginPath(); c.ellipse(-.27, -.22, .22, .19, 0, 0, 7); FS(c, P.b);
    c.beginPath(); c.ellipse(-.2, -.02, .12, .05, 0, 0, 7); FS(c, P.d); c.beginPath(); c.ellipse(.28, -.02, .12, .05, 0, 0, 7); FS(c, P.d);
    c.beginPath(); c.arc(-.47, -.25, .045, 0, 7); FS(c, INK);
    monEye(c, g, -.3, -.36, .05, true, -1);
    c.lineWidth = .025; c.beginPath(); c.moveTo(-.4, -.14); c.quadraticCurveTo(-.3, -.1, -.2, -.15); c.stroke();
  },
  (c, g, P) => { // Golem
    c.beginPath(); c.ellipse(-.46, -.28, .1, .17, .1, 0, 7); FS(c, P.a); c.beginPath(); c.ellipse(.46, -.28, .1, .17, -.1, 0, 7); FS(c, P.a);
    c.beginPath(); c.moveTo(-.36, 0); c.lineTo(-.42, -.4); c.lineTo(-.26, -.72); c.lineTo(.26, -.72); c.lineTo(.42, -.4); c.lineTo(.36, 0); c.quadraticCurveTo(0, .04, -.36, 0); c.closePath(); FS(c, P.a);
    c.beginPath(); c.moveTo(-.28, -.69); c.quadraticCurveTo(-.2, -.8, -.1, -.71); c.quadraticCurveTo(0, -.82, .1, -.71); c.quadraticCurveTo(.2, -.8, .28, -.69); c.lineTo(.26, -.63); c.quadraticCurveTo(0, -.58, -.26, -.63); c.closePath(); FS(c, "#6cae4f");
    g.strokeStyle = P.d; g.lineWidth = .025; g.beginPath(); g.moveTo(.2, -.55); g.lineTo(.14, -.42); g.lineTo(.22, -.34); g.moveTo(-.3, -.2); g.lineTo(-.22, -.1); g.stroke(); g.strokeStyle = INK;
    for (const x of [-.17, .07]) { c.lineWidth = .026; c.beginPath(); c.rect(x, -.5, .1, .1); FS(c, "#ffe27a"); }
    c.lineWidth = .03; c.beginPath(); c.moveTo(-.2, -.56); c.lineTo(-.05, -.52); c.moveTo(.2, -.56); c.lineTo(.05, -.52); c.stroke();
    c.lineWidth = .026; c.beginPath(); c.moveTo(-.15, -.27); c.lineTo(.15, -.27); c.lineTo(.12, -.17); c.lineTo(-.12, -.17); c.closePath(); FS(c, P.d);
    g.strokeStyle = "#fff"; g.lineWidth = .02; g.beginPath(); g.moveTo(-.05, -.27); g.lineTo(-.05, -.18); g.moveTo(.05, -.27); g.lineTo(.05, -.18); g.stroke(); g.strokeStyle = INK;
  },
  (c, g, P) => { // Fledermaus
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * .16, -.5); c.bezierCurveTo(s * .4, -.82, s * .62, -.74, s * .66, -.5); c.quadraticCurveTo(s * .58, -.52, s * .53, -.38); c.quadraticCurveTo(s * .45, -.46, s * .38, -.3); c.quadraticCurveTo(s * .28, -.36, s * .18, -.2); c.closePath(); FS(c, P.d); }
    c.beginPath(); c.moveTo(-.2, -.66); c.lineTo(-.26, -.88); c.lineTo(-.06, -.74); c.closePath(); FS(c, P.a); c.beginPath(); c.moveTo(.2, -.66); c.lineTo(.26, -.88); c.lineTo(.06, -.74); c.closePath(); FS(c, P.a);
    c.beginPath(); c.ellipse(0, -.4, .25, .31, 0, 0, 7); FS(c, P.a); c.beginPath(); c.ellipse(0, -.32, .15, .2, 0, 0, 7); FS(c, P.b);
    monEye(c, g, -.1, -.5, .055, true, -1); monEye(c, g, .1, -.5, .055, true, 1);
    c.lineWidth = .022; c.beginPath(); c.moveTo(-.07, -.37); c.lineTo(-.04, -.28); c.lineTo(-.01, -.37); FS(c, "#fff"); c.beginPath(); c.moveTo(.01, -.37); c.lineTo(.04, -.28); c.lineTo(.07, -.37); FS(c, "#fff");
    c.beginPath(); c.ellipse(-.1, -.06, .05, .04, 0, 0, 7); FS(c, P.d); c.beginPath(); c.ellipse(.1, -.06, .05, .04, 0, 0, 7); FS(c, P.d);
  },
  (c, g, P) => { // Geist
    g.save(); g.globalAlpha = .94;
    c.beginPath(); c.moveTo(-.34, 0); c.bezierCurveTo(-.46, -.4, -.4, -.84, 0, -.84); c.bezierCurveTo(.4, -.84, .46, -.4, .34, 0); c.quadraticCurveTo(.26, -.08, .2, 0); c.quadraticCurveTo(.1, .08, 0, 0); c.quadraticCurveTo(-.1, -.08, -.2, 0); c.quadraticCurveTo(-.26, .08, -.34, 0); c.closePath(); FS(c, P.a);
    g.restore();
    g.fillStyle = hexA(P.d, .35); c.beginPath(); c.ellipse(.1, -.18, .22, .1, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(-.42, -.34, .08, .13, .5, 0, 7); FS(c, P.a); c.beginPath(); c.ellipse(.42, -.34, .08, .13, -.5, 0, 7); FS(c, P.a);
    g.fillStyle = INK; c.beginPath(); c.ellipse(-.13, -.52, .05, .085, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(.12, -.52, .05, .085, 0, 0, 7); c.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(-.14, -.55, .018, 0, 7); g.fill(); g.beginPath(); g.arc(.11, -.55, .018, 0, 7); g.fill();
    c.lineWidth = .026; c.beginPath(); c.ellipse(-.01, -.3, .06, .08, 0, 0, 7); FS(c, INK);
    g.fillStyle = "rgba(255,110,150,.4)"; c.beginPath(); c.ellipse(-.24, -.38, .05, .03, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(.22, -.38, .05, .03, 0, 0, 7); c.fill();
  },
  (c, g, P) => { // Drache
    c.beginPath(); c.moveTo(.2, -.55); c.bezierCurveTo(.45, -.95, .7, -.82, .72, -.55); c.quadraticCurveTo(.62, -.6, .58, -.45); c.quadraticCurveTo(.48, -.52, .4, -.35); c.closePath(); FS(c, P.d);
    c.beginPath(); c.moveTo(.36, -.3); c.bezierCurveTo(.58, -.24, .72, -.08, .78, -.3); c.bezierCurveTo(.68, -.16, .52, -.06, .34, -.08); c.closePath(); FS(c, P.a);
    for (const x of [-.02, .12, .26]) { c.beginPath(); c.moveTo(x - .05, -.6 + (x > .1 ? .06 : 0)); c.lineTo(x, -.74 + (x > .1 ? .07 : 0)); c.lineTo(x + .06, -.58 + (x > .1 ? .06 : 0)); c.closePath(); FS(c, P.d); }
    c.beginPath(); c.ellipse(.06, -.32, .4, .32, 0, 0, 7); FS(c, P.a);
    c.beginPath(); c.ellipse(-.02, -.24, .26, .22, 0, 0, 7); FS(c, P.b);
    g.strokeStyle = hexA(P.d, .5); g.lineWidth = .02; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-.2, -.32 + i * .09); g.quadraticCurveTo(-.02, -.28 + i * .09, .16, -.32 + i * .09); g.stroke(); } g.strokeStyle = INK;
    c.beginPath(); c.ellipse(-.2, -.02, .12, .05, 0, 0, 7); FS(c, P.d); c.beginPath(); c.ellipse(.22, -.02, .12, .05, 0, 0, 7); FS(c, P.d);
    c.beginPath(); c.moveTo(-.4, -.72); c.lineTo(-.46, -.9); c.lineTo(-.3, -.76); c.closePath(); FS(c, P.b); c.beginPath(); c.moveTo(-.22, -.74); c.lineTo(-.18, -.9); c.lineTo(-.1, -.7); c.closePath(); FS(c, P.b);
    c.beginPath(); c.arc(-.28, -.52, .24, 0, 7); FS(c, P.a); c.beginPath(); c.ellipse(-.46, -.44, .14, .1, 0, 0, 7); FS(c, P.a);
    g.fillStyle = INK; g.beginPath(); g.arc(-.55, -.48, .016, 0, 7); g.fill(); g.beginPath(); g.arc(-.55, -.42, .016, 0, 7); g.fill();
    monEye(c, g, -.3, -.58, .06, true, -1); monEye(c, g, -.12, -.58, .05, true, 1);
    c.lineWidth = .022; c.beginPath(); c.moveTo(-.58, -.38); c.quadraticCurveTo(-.45, -.34, -.34, -.4); c.stroke();
    c.beginPath(); c.moveTo(-.5, -.37); c.lineTo(-.47, -.31); c.lineTo(-.44, -.36); FS(c, "#fff");
  }
];
const monCache = {}, monSilCache = {};
function crownShape(c, g, x, y, s) {
  c.lineWidth = .028; c.beginPath(); c.moveTo(x - .2 * s, y); c.lineTo(x - .22 * s, y - .17 * s); c.lineTo(x - .1 * s, y - .09 * s); c.lineTo(x, y - .21 * s); c.lineTo(x + .1 * s, y - .09 * s); c.lineTo(x + .22 * s, y - .17 * s); c.lineTo(x + .2 * s, y); c.closePath(); FS(c, "#ffd23f");
  for (const dx of [-.22, 0, .22]) { c.beginPath(); c.arc(x + dx * s, y - (dx ? .17 : .21) * s, .03 * s, 0, 7); FS(c, "#ff5a6e"); }
}
function monsterSprite(kind, tint, boss) {
  const key = kind + "_" + tint + "_" + (boss ? 1 : 0);
  return monCache[key] || (monCache[key] = makeSprite(MON_W, MON_W, MON_OX, MON_OY, MON_U, kind * 1.9 + tint + 5, (c, g) => {
    const M = MONS[kind];
    g.fillStyle = "rgba(10,10,40,.28)"; g.beginPath(); g.ellipse(0, .01, .5, .06, 0, 0, 7); g.fill();
    if (boss) { const gr = g.createRadialGradient(0, -.4, .1, 0, -.4, .8); gr.addColorStop(0, "rgba(255,70,80,.38)"); gr.addColorStop(1, "rgba(255,70,80,0)"); g.fillStyle = gr; g.fillRect(-1, -1.2, 2, 1.6); }
    MONDRAW[kind](c, g, M.pal[tint]);
    if (boss) crownShape(c, g, M.cx, -M.top - .02, 1.1);
  }, .007));
}
function monsterSil(kind, tint, boss) { const key = kind + "_" + tint + "_" + (boss ? 1 : 0); return monSilCache[key] || (monSilCache[key] = silhouette(monsterSprite(kind, tint, boss), "#ffffff")); }

/* ---------- Kleinkram: Münze, Herz, Truhe ---------- */
let coinSpr = null, heartSpr = null, chestSpr = null;
function coinSprite() {
  return coinSpr || (coinSpr = makeSprite(72, 72, 36, 36, 30, 2.2, (c, g) => {
    const gr = g.createRadialGradient(-.3, -.35, .05, 0, 0, 1); gr.addColorStop(0, "#fff1a0"); gr.addColorStop(.55, "#ffd23f"); gr.addColorStop(1, "#f0a020");
    c.lineWidth = .1; c.beginPath(); c.arc(0, 0, .9, 0, 7); FS(c, gr);
    g.strokeStyle = "#c8860f"; g.lineWidth = .07; g.beginPath(); g.arc(0, 0, .58, 0, 7); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = .1; g.beginPath(); g.arc(0, 0, .72, 3.5, 4.4); g.stroke();
  }, .02));
}
function heartSprite() {
  return heartSpr || (heartSpr = makeSprite(64, 64, 32, 34, 26, 4.1, (c, g) => {
    c.lineWidth = .11; c.beginPath(); c.moveTo(0, .8); c.bezierCurveTo(-1.1, .1, -1, -.8, -.45, -.8); c.bezierCurveTo(-.15, -.8, 0, -.55, 0, -.4); c.bezierCurveTo(0, -.55, .15, -.8, .45, -.8); c.bezierCurveTo(1, -.8, 1.1, .1, 0, .8); c.closePath(); FS(c, "#ff7a95");
    g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.ellipse(-.5, -.42, .16, .1, -.6, 0, 7); g.fill();
  }, .02));
}
function chestSprite(open) {
  chestSpr = chestSpr || {};
  return chestSpr[open ? 1 : 0] || (chestSpr[open ? 1 : 0] = makeSprite(220, 200, 110, 170, 160, open ? 6.6 : 6.1, (c, g) => {
    const GOLD = "#ffd23f", ORG = "#f08a24";
    g.fillStyle = "rgba(10,10,40,.28)"; g.beginPath(); g.ellipse(0, .01, .5, .06, 0, 0, 7); g.fill();
    if (open) { const gr = g.createRadialGradient(0, -.5, .05, 0, -.5, .7); gr.addColorStop(0, "rgba(255,240,150,.8)"); gr.addColorStop(1, "rgba(255,240,150,0)"); g.fillStyle = gr; g.fillRect(-.9, -1.2, 1.8, 1.4);
      c.beginPath(); c.moveTo(-.4, -.4); c.bezierCurveTo(-.4, -.78, -.28, -.88, 0, -.88); c.bezierCurveTo(.28, -.88, .4, -.78, .4, -.4); c.closePath(); FS(c, "#d9a22a"); }
    c.beginPath(); c.moveTo(-.44, 0); c.lineTo(-.44, -.36); c.lineTo(.44, -.36); c.lineTo(.44, 0); c.quadraticCurveTo(0, .05, -.44, 0); c.closePath(); FS(c, GOLD);
    c.lineWidth = .026; c.beginPath(); c.rect(-.37, -.3, .25, .22); FS(c, ORG); c.beginPath(); c.rect(.12, -.3, .25, .22); FS(c, ORG);
    if (open) { c.lineWidth = .03; c.beginPath(); c.ellipse(0, -.36, .42, .09, 0, 0, 7); FS(c, "#5a3318"); for (const p of [[-.2, -.42], [.12, -.45], [-.02, -.5], [.26, -.4]]) { c.beginPath(); c.arc(p[0], p[1], .075, 0, 7); FS(c, "#ffe27a"); } }
    else { c.lineWidth = .03; c.beginPath(); c.moveTo(-.46, -.36); c.bezierCurveTo(-.46, -.64, -.32, -.74, 0, -.74); c.bezierCurveTo(.32, -.74, .46, -.64, .46, -.36); c.closePath(); FS(c, GOLD);
      c.lineWidth = .026; c.beginPath(); c.moveTo(-.34, -.4); c.bezierCurveTo(-.34, -.58, -.24, -.64, 0, -.64); c.bezierCurveTo(.24, -.64, .34, -.58, .34, -.4); c.closePath(); FS(c, ORG);
      g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.ellipse(-.24, -.56, .07, .035, -.5, 0, 7); g.fill(); }
    c.lineWidth = .026; c.beginPath(); c.rect(-.07, open ? -.32 : -.44, .14, .17); FS(c, "#fff0a8"); g.fillStyle = INK; g.beginPath(); g.arc(0, open ? -.25 : -.37, .02, 0, 7); g.fill();
  }, .006));
}

/* ---------- Mülleimer zum Löschen (Platte mit Eimer, Deckel springt auf wenn ein Schleim darüber ist) ---------- */
const binCache = {};
function binSprite(open) {
  return binCache[open ? 1 : 0] || (binCache[open ? 1 : 0] = makeSprite(144, 144, 72, 72, 120, open ? 9.3 : 9.1, (c, g) => {
    c.lineWidth = .04; c.beginPath(); c.moveTo(-.4, -.5); c.lineTo(.4, -.5); c.quadraticCurveTo(.5, -.5, .5, -.4); c.lineTo(.5, .4); c.quadraticCurveTo(.5, .5, .4, .5); c.lineTo(-.4, .5); c.quadraticCurveTo(-.5, .5, -.5, .4); c.lineTo(-.5, -.4); c.quadraticCurveTo(-.5, -.5, -.4, -.5); c.closePath(); FS(c, open ? "#c8504a" : "#4a5aa0");
    c.lineWidth = .035; c.beginPath(); c.moveTo(-.25, -.14); c.lineTo(-.2, .34); c.quadraticCurveTo(0, .4, .2, .34); c.lineTo(.25, -.14); c.closePath(); FS(c, "#a9bde6");
    g.strokeStyle = "rgba(30,40,100,.45)"; g.lineWidth = .022; for (const x of [-.1, 0, .1]) { g.beginPath(); g.moveTo(x * 1.1, -.08); g.lineTo(x, .3); g.stroke(); } g.strokeStyle = INK;
    g.save(); if (open) { g.translate(-.3, -.2); g.rotate(-.55); g.translate(.3, .2); }
    c.lineWidth = .035; c.beginPath(); c.moveTo(-.32, -.26); c.lineTo(.32, -.26); c.lineTo(.3, -.14); c.lineTo(-.3, -.14); c.closePath(); FS(c, "#c9d7f2");
    c.beginPath(); c.moveTo(-.09, -.26); c.quadraticCurveTo(-.08, -.36, 0, -.36); c.quadraticCurveTo(.08, -.36, .09, -.26); c.stroke(); g.restore();
    g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.ellipse(-.3, -.36, .1, .035, -.3, 0, 7); g.fill();
  }, .006));
}
