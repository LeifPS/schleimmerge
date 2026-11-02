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
  else if (t === 7) {
    if (l === 85) { c.lineWidth = .04; c.beginPath(); c.ellipse(0, -.76, .26, .06, 0, 0, 7); c.strokeStyle = "#ffd95a"; c.stroke(); for (const f of [[-.15, .2, .07], [0, .3, .09], [.15, .2, .07]]) flameAt(c, g, f[0], -.76, f[1], f[2], "#ff5a1c", "#ffc13a"); }
    else if (l === 86) { for (const s of [-1, 1]) { c.lineWidth = .028; poly(c, [[s * .08, -.74], [s * .22, -.88], [s * .15, -.9], [s * .27, -1.04], [s * .07, -.93], [s * .14, -.92], [s * .03, -.8]], "#ffe94a"); } }
    else { c.lineWidth = .05; c.beginPath(); c.ellipse(0, -.93, .25, .066, 0, 0, 7); c.strokeStyle = "#12082a"; c.stroke(); c.lineWidth = .02; c.beginPath(); c.ellipse(0, -.93, .25, .066, 0, 0, 7); c.strokeStyle = "#c08cff"; c.stroke(); c.lineWidth = .028; c.beginPath(); c.arc(0, -1.0, .06, 0, 7); FS(c, "#0a0418"); g.strokeStyle = INK; }
  }
  else if (t === 6) { c.lineWidth = .035; c.beginPath(); c.ellipse(0, -.9, .27, .07, 0, 0, 7); c.strokeStyle = "#9fd8ff"; c.stroke(); c.lineWidth = .02; c.beginPath(); c.ellipse(0, -.9, .2, .042, 0, 0, 7); c.strokeStyle = "#fff"; c.stroke(); for (const s of [[-.21, -.97, .055], [0, -1.0, .07], [.21, -.97, .055]]) { c.lineWidth = .025; starPath(c, s[0], s[1], s[2], s[2] * .45, 0); FS(c, "#e4f4ff"); } g.strokeStyle = INK; }
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
const WTIERS = ["Holz", "Eisen", "Gold", "Kristall", "Feuer", "Magie", "Kosmos"];
const MATS = [
  { m: "#c9a06a", d: "#8a5e30", h: "#8a5a2e", g: "#ffe27a" },
  { m: "#d5dce6", d: "#8895a8", h: "#7a4a2a", g: "#ffffff" },
  { m: "#ffd95a", d: "#d19a1c", h: "#8a3b2a", g: "#fff3b0" },
  { m: "#8fe9ff", d: "#3fb6d6", h: "#365a9c", g: "#e2fbff" },
  { m: "#ff9a4a", d: "#d8431c", h: "#4a2a2a", g: "#ffe29a" },
  { m: "#d89bff", d: "#8a46d0", h: "#2f2a5a", g: "#ffd6ff" },
  { m: "#8a6aff", d: "#2a1f8a", h: "#1a1540", g: "#fff3a8" }
];
const wType = l => (l - 1) % 12, wTier = l => l > 84 ? 7 : Math.min(6, Math.floor((l - 1) / 12));
function slimeName(l) { if (l > 84) return SPECIAL_NAMES[l - 85]; const t = WTYPES[wType(l)]; return WTIERS[wTier(l)] + t; }
const WP_W = 320, WP_U = 190, WP_OX = 160, WP_OY = 262;
/* Wo der Kopf der Waffe sitzt (für Leuchten, Flammen, Funken), in Einheiten ab dem Griff */
const HEAD = [[0, -.72], [0, -.66], [.2, -.68], [0, -.84], [0, -.76], [0, -.82], [0, -.4], [0, -.74], [0, -.72], [0, -.74], [0, -.68], [.22, -.78]];
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
function flameAt(c, g, x, y, h, w, outer, inner) {
  c.lineWidth = .03; c.beginPath(); c.moveTo(x - w, y); c.bezierCurveTo(x - w * 1.1, y - h * .4, x - w * .3, y - h * .55, x, y - h); c.bezierCurveTo(x + w * .3, y - h * .5, x + w * 1.2, y - h * .35, x + w, y); c.closePath(); FS(c, outer);
  c.beginPath(); c.moveTo(x - w * .5, y); c.quadraticCurveTo(x - w * .5, y - h * .4, x, y - h * .62); c.quadraticCurveTo(x + w * .5, y - h * .35, x + w * .5, y); c.closePath(); c.fillStyle = inner; c.fill();
}
function diamondAt(c, g, x, y, r, fill) { c.lineWidth = .025; c.beginPath(); c.moveTo(x, y - r * 1.5); c.lineTo(x + r, y); c.lineTo(x, y + r * 1.5); c.lineTo(x - r, y); c.closePath(); FS(c, fill); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = .015; g.beginPath(); g.moveTo(x - r * .2, y - r * .9); g.lineTo(x + r * .2, y - r * .1); g.stroke(); g.strokeStyle = INK; }
function weaponSprite(l) {
  return weapCache[l] || (weapCache[l] = makeSprite(WP_W, WP_W, WP_OX, WP_OY, WP_U, l * .53 + 3, (c, g) => {
    const t = wTier(l), type = wType(l), M = Object.assign({}, MATS[t]), ax = HEAD[type][0], ay = HEAD[type][1];
    const TCOL = ["", "", "", "120,230,255", "255,150,50", "210,130,255"];
    /* Hinter der Waffe: Leuchten und je Stufe eigene Effekte */
    if (t >= 3) { const gr = g.createRadialGradient(ax, ay, .02, ax, ay, .62); gr.addColorStop(0, "rgba(" + TCOL[t] + ",.5)"); gr.addColorStop(1, "rgba(" + TCOL[t] + ",0)"); g.fillStyle = gr; g.fillRect(-.9, -1.4, 1.8, 1.7); }
    if (t === 3) { for (const d of [[-.42, -.2, .06], [.4, .1, .07], [-.36, .3, .045], [.1, -.3, .05], [.46, -.32, .04], [-.12, .22, .035]]) diamondAt(c, g, ax + d[0], ay + d[1], d[2], "#bff4ff"); }
    if (t === 4) { const fl = [[-.36, .14, .3, .08], [-.19, .08, .44, .1], [0, .03, .58, .125], [.19, .08, .42, .1], [.36, .14, .28, .08]]; for (const f of fl) flameAt(c, g, ax + f[0], ay + f[1], f[2], f[3], "#ff5a1c", "#ffc13a"); }
    if (t === 5) { g.save(); g.translate(ax, ay); g.rotate(-.45); g.lineCap = "round"; for (const [col, w] of [[INK, .075], ["#6fe0ff", .045], ["#f0ffff", .014]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.ellipse(0, 0, .46, .15, 0, 0, 7); g.stroke(); } g.restore(); }
    /* Material mit Verlauf entlang der Waffe */
    if (t >= 3) {
      const gm = g.createLinearGradient(0, ay - .42, 0, ay + .5);
      const ss = t === 3 ? ["#f4feff", "#8fe9ff", "#3fb6d6", "#2a7fb8"] : t === 4 ? ["#ffd23a", "#ff9a2a", "#e8481c", "#a82014"] : ["#ffeaff", "#e0a8ff", "#9a55f0", "#4a2aa8"];
      gm.addColorStop(0, ss[0]); gm.addColorStop(.3, ss[1]); gm.addColorStop(.65, ss[2]); gm.addColorStop(1, ss[3]); M.m = gm; M.d = ss[3];
    }
    c.lineWidth = .04; weaponShape(c, g, type, M);
    /* Licht und Schatten, nur auf der Waffe selbst */
    g.save(); g.globalCompositeOperation = "source-atop";
    const sh = g.createLinearGradient(-.32, 0, .32, 0); sh.addColorStop(0, "rgba(255,255,255,.55)"); sh.addColorStop(.38, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(10,10,60,.34)"); g.fillStyle = sh; g.fillRect(-.9, -1.4, 1.8, 1.7);
    const tp = g.createLinearGradient(0, -1, 0, .1); tp.addColorStop(0, "rgba(255,255,255,.22)"); tp.addColorStop(1, "rgba(0,0,40,.12)"); g.fillStyle = tp; g.fillRect(-.9, -1.4, 1.8, 1.7);
    g.lineCap = "round";
    if (t === 3) { for (let i = 0; i < 7; i++) { g.strokeStyle = i % 2 ? "rgba(255,255,255,.65)" : "rgba(0,70,140,.35)"; g.lineWidth = .02; g.beginPath(); g.moveTo(ax - .45 + i * .15, ay - .5); g.lineTo(ax - .25 + i * .15, ay + .5); g.stroke(); }
      g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(ax - .1, ay - .5); g.lineTo(ax + .02, ay - .5); g.lineTo(ax - .02, ay + .2); g.lineTo(ax - .14, ay + .2); g.closePath(); g.fill(); }
    if (t === 4) { g.strokeStyle = "rgba(255,230,120,.6)"; g.lineWidth = .016; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(ax + i * .12, ay + .45); g.bezierCurveTo(ax + i * .12 - .08, ay + .2, ax + i * .12 + .08, ay, ax + i * .12 - .02, ay - .45); g.stroke(); }
      const hg = g.createRadialGradient(ax, ay, .02, ax, ay, .3); hg.addColorStop(0, "rgba(255,240,160,.4)"); hg.addColorStop(1, "rgba(255,240,160,0)"); g.fillStyle = hg; g.fillRect(ax - .4, ay - .4, .8, .8); }
    if (t === 5) { for (let i = 0; i < 8; i++) { g.strokeStyle = i % 2 ? "rgba(120,240,255,.55)" : "rgba(255,150,255,.5)"; g.lineWidth = .028; g.beginPath(); g.moveTo(ax - .6 + i * .16, ay - .5); g.lineTo(ax - .3 + i * .16, ay + .5); g.stroke(); }
      g.fillStyle = "rgba(255,255,255,.8)"; for (const d of [[-.1, -.2], [.12, .05], [-.04, .22], [.08, -.38]]) { sparklePath(g, ax + d[0], ay + d[1], .035); g.fill(); } }
    if (t >= 2) { g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = .022; g.beginPath(); g.moveTo(-.025, -.95); g.lineTo(-.025, -.45); g.stroke(); }
    g.restore();
    /* Vor der Waffe: Funken, vordere Hälfte des Energierings */
    g.strokeStyle = INK;
    if (t === 5) { g.save(); g.translate(ax, ay); g.rotate(-.45); g.lineCap = "round"; for (const [col, w] of [[INK, .075], ["#6fe0ff", .045], ["#f0ffff", .014]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.ellipse(0, 0, .46, .15, 0, .12, Math.PI - .12); g.stroke(); }
      for (const a of [.12, Math.PI - .12]) { const ox = Math.cos(a) * .46, oy = Math.sin(a) * .15; g.fillStyle = "#fff"; g.strokeStyle = INK; g.lineWidth = .025; g.beginPath(); g.arc(ox, oy, .045, 0, 7); g.fill(); g.stroke(); }
      g.restore(); g.fillStyle = "#ffe27a"; starPath(g, ax + .3, ay - .36, .07, .03, 0); g.fill(); g.fillStyle = "#ffd6ff"; starPath(g, ax - .32, ay - .26, .055, .024, .3); g.fill(); }
    g.fillStyle = "rgba(255,255,255,.95)";
    if (t === 2) { sparklePath(g, ax + .12, ay - .12, .05); g.fill(); }
    if (t === 3) { for (const d of [[.2, -.3, .07], [-.22, -.1, .05], [.1, .2, .045], [-.12, -.42, .04]]) { sparklePath(g, ax + d[0], ay + d[1], d[2]); g.fill(); } }
    if (t === 4) { for (const d of [[-.2, -.5, .018], [.16, -.62, .022], [.04, -.74, .016], [-.08, -.56, .014], [.26, -.44, .015]]) { g.fillStyle = "#ffd34a"; g.beginPath(); g.arc(ax + d[0], ay + d[1], d[2], 0, 7); g.fill(); } }
  }, .006));
}

/* ---------- Magiewaffen (Stufe 61+): Farbverlauf läuft ständig durch die Waffe ----------
   Die Waffe wird in Füllung und Linien getrennt vorgezeichnet. Pro Bild wird ein wandernder Regenbogen
   in die Füllung multipliziert, danach kommen die Linien wieder obendrauf. */
const magicCache = {}, magicOut = {};
let magicTmp = null; const gradKey = {}, gradCvs = {};
const STARS = []; for (let i = 0; i < 90; i++) STARS.push([hs(i, 1, 9) * WP_W, hs(i, 2, 9) * WP_W, .8 + hs(i, 3, 9) * 1.8, hs(i, 4, 9) * 6.28]);
function magicParts(l) {
  if (magicCache[l]) return magicCache[l];
  const type = wType(l), ax = HEAD[type][0], ay = HEAD[type][1], seed = l * .53 + 3;
  const M = { m: "#ffffff", d: "#b4aedc", h: "#5a4aa0", g: "#ffffff" };
  const RINGS = wTier(l) === 6 ? [] : [[-.45, .46, .15]];
  const ring = (g, a0, a1, w) => { for (const R of RINGS) { g.save(); g.translate(ax, ay); g.rotate(R[0]); g.lineCap = "round"; g.lineWidth = w * (RINGS.length > 1 ? .72 : 1); g.beginPath(); g.ellipse(0, 0, R[1], R[2], 0, a0, a1); g.stroke(); g.restore(); } };
  const orbs = (g, fill) => { for (const R of RINGS) { g.save(); g.translate(ax, ay); g.rotate(R[0]); for (const a of [.12, Math.PI - .12]) { g.beginPath(); g.arc(Math.cos(a) * R[1], Math.sin(a) * R[2], .05, 0, 7); if (fill) { g.fillStyle = "#fff"; g.fill(); } else { g.strokeStyle = INK; g.lineWidth = .026; g.stroke(); } } g.restore(); } };
  const B0 = Math.PI + .12, B1 = 2 * Math.PI - .12, F0 = .12, F1 = Math.PI - .12;
  const mk = fn => makeSprite(WP_W, WP_W, WP_OX, WP_OY, WP_U, seed, fn, .006);
  const parts = {};
  FSMODE = 1;
  try {
    parts.aFill = mk((c, g) => {
      g.strokeStyle = "#fff"; ring(g, B0, B1, .07);
      c.lineWidth = .04; weaponShape(c, g, type, M);
      g.save(); g.globalCompositeOperation = "source-atop";
      const sh = g.createLinearGradient(-.32, 0, .32, 0); sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(.5, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(60,20,110,.42)"); g.fillStyle = sh; g.fillRect(-.9, -1.4, 1.8, 1.7);
      const tp = g.createLinearGradient(0, -1, 0, .1); tp.addColorStop(0, "rgba(255,255,255,0)"); tp.addColorStop(1, "rgba(40,0,90,.2)"); g.fillStyle = tp; g.fillRect(-.9, -1.4, 1.8, 1.7);
      g.restore();
    });
    parts.cFill = mk((c, g) => { g.strokeStyle = "#fff"; ring(g, F0, F1, .07); orbs(g, true); });
    FSMODE = 2;
    parts.aLine = mk((c, g) => {
      g.strokeStyle = INK; ring(g, B0, B1, .098); g.globalCompositeOperation = "destination-out"; ring(g, B0, B1, .05); g.globalCompositeOperation = "source-over";
      c.lineWidth = .04; weaponShape(c, g, type, M);
      g.save(); g.globalCompositeOperation = "source-atop"; g.lineCap = "round";
      for (let i = 0; i < 6; i++) { g.strokeStyle = "rgba(255,255,255," + (i % 2 ? .5 : .28) + ")"; g.lineWidth = .02 + (i % 3) * .006; g.beginPath(); g.moveTo(ax - .5 + i * .2, ay - .55); g.lineTo(ax - .3 + i * .2, ay + .5); g.stroke(); }
      g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = .022; g.beginPath(); g.moveTo(-.025, -.95); g.lineTo(-.025, -.45); g.stroke();
      g.restore();
      g.fillStyle = "rgba(255,255,255,.95)"; for (const d of [[-.1, -.2, .04], [.12, .05, .035], [-.04, .22, .03], [.08, -.38, .04]]) { sparklePath(g, ax + d[0], ay + d[1], d[2]); g.fill(); }
    });
    parts.cLine = mk((c, g) => { g.strokeStyle = INK; ring(g, F0, F1, .098); g.globalCompositeOperation = "destination-out"; ring(g, F0, F1, .05); g.globalCompositeOperation = "source-over"; g.save(); g.translate(0, 0); orbs(g, false); g.restore(); });
  } finally { FSMODE = 0; }
  return magicCache[l] = parts;
}
/* Wandernder Regenbogen, einmal pro Bild für alle Waffen gleich (in Sprite-Pixeln) */
function magicGrad(key, tm, tier) {
  if (gradKey[tier] === key && gradCvs[tier]) return gradCvs[tier];
  gradKey[tier] = key; const gradCv = gradCvs[tier] || (gradCvs[tier] = mkCanvas(WP_W, WP_W));
  const g = gradCv.getContext("2d"), Lp = 170, dx = .5, dy = .87, sh = ((tm * .55) % 1) * Lp, cx = WP_OX, cy = WP_OY - WP_U * .5;
  const x0 = cx - dx * Lp * 1.5 + dx * sh, y0 = cy - dy * Lp * 1.5 + dy * sh, gr = g.createLinearGradient(x0, y0, x0 + dx * Lp * 3, y0 + dy * Lp * 3);
  if (tier === 6) { const C = ["#2a50d0", "#4a8cf8", "#a8dcff", "#ffffff", "#8cc8ff", "#3a66e0", "#2a50d0"]; const N = C.length - 1; for (let k = 0; k <= N * 3; k++) gr.addColorStop(k / (N * 3), C[k % N === 0 && k ? 0 : k % N]); }
  else { const N = 8; for (let k = 0; k <= N * 3; k++) gr.addColorStop(k / (N * 3), hsl(((k % N) / N) * 360 + 300, .95, .66)); }
  g.clearRect(0, 0, WP_W, WP_W); g.fillStyle = gr; g.fillRect(0, 0, WP_W, WP_W); return gradCv;
}
function weaponFrame(l, tm) {
  const tier = wTier(l); if (tier === 7) return specialFrame(l, tm); if (tier < 5) return weaponSprite(l);
  const key = Math.floor(tm * 20);
  let o = magicOut[l]; if (!o) o = magicOut[l] = { cv: mkCanvas(WP_W, WP_W), key: -1 };
  if (o.key === key) return o.cv; o.key = key;
  const P = magicParts(l), G = magicGrad(key, tm + l * .31, tier), ax = HEAD[wType(l)][0], ay = HEAD[wType(l)][1], g = o.cv.getContext("2d");
  if (!magicTmp) magicTmp = mkCanvas(WP_W, WP_W); const t = magicTmp.getContext("2d");
  const color = (fill, stars) => { t.globalCompositeOperation = "source-over"; t.clearRect(0, 0, WP_W, WP_W); t.drawImage(G, 0, 0); t.globalCompositeOperation = "multiply"; t.drawImage(fill, 0, 0); t.globalCompositeOperation = "destination-in"; t.drawImage(fill, 0, 0);
    if (tier === 6 && stars) { t.globalCompositeOperation = "source-atop"; for (let i = 0; i < STARS.length; i++) { const S = STARS[i], a = .5 + .5 * Math.sin(tm * 3.2 + S[3]); if (a < .35) continue; t.globalAlpha = a; t.fillStyle = i % 3 === 0 ? "#1a2a8a" : "#fff"; t.fillRect(S[0] - S[2] / 2, S[1] - S[2] / 2, S[2], S[2]); if (S[2] > 2) { t.fillRect(S[0] - S[2] * 1.2, S[1] - .5, S[2] * 2.4, 1); t.fillRect(S[0] - .5, S[1] - S[2] * 1.2, 1, S[2] * 2.4); } } t.globalAlpha = 1; }
    t.globalCompositeOperation = "source-over"; g.drawImage(magicTmp, 0, 0); };
  g.clearRect(0, 0, WP_W, WP_W);
  g.save(); g.setTransform(WP_U, 0, 0, WP_U, WP_OX, WP_OY);
  if (tier === 6) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    const px = WP_OX + ax * WP_U, py = WP_OY + ay * WP_U, pu = .5 + .5 * Math.sin(tm * 3 + l);
    g.save(); g.globalCompositeOperation = "lighter";
    const bg2 = g.createRadialGradient(px, py, 4, px, py, WP_U * .68); bg2.addColorStop(0, "rgba(215,240,255," + (.5 + .2 * pu) + ")"); bg2.addColorStop(.45, "rgba(90,170,255,.25)"); bg2.addColorStop(1, "rgba(40,80,255,0)"); g.fillStyle = bg2; g.fillRect(0, 0, WP_W, WP_W);
    for (let i = 0; i < 14; i++) { const a = tm * .45 + i * Math.PI / 7, len = WP_U * (i % 2 ? .5 : .66) * (.85 + .15 * Math.sin(tm * 4 + i)), w = i % 2 ? .13 : .2, tx = px + Math.cos(a) * len, ty = py + Math.sin(a) * len, rg = g.createLinearGradient(px, py, tx, ty); rg.addColorStop(0, "rgba(225,244,255,.95)"); rg.addColorStop(1, "rgba(150,200,255,0)"); g.fillStyle = rg; g.beginPath(); g.moveTo(px + Math.cos(a + w) * 6, py + Math.sin(a + w) * 6); g.lineTo(tx, ty); g.lineTo(px + Math.cos(a - w) * 6, py + Math.sin(a - w) * 6); g.closePath(); g.fill(); }
    g.restore();
  } else {
  const h = (tm * 90 + l * 20) % 360, gl = g.createRadialGradient(ax, ay, .02, ax, ay, .64); gl.addColorStop(0, hsl(h, 1, .7).replace("#", "#") + "99"); gl.addColorStop(1, hsl(h, 1, .7) + "00"); g.fillStyle = gl; g.fillRect(-.9, -1.4, 1.8, 1.7);
  g.restore(); }
  color(P.aFill, true); g.drawImage(P.aLine, 0, 0); color(P.cFill, false); g.drawImage(P.cLine, 0, 0);
  return o.cv;
}

/* ---------- Drei Spezialwaffen (Level 85-87): jede mit eigener Form und eigener Animation ---------- */
const SPW = { w: 440, ox: 220, oy: 300 }, specialCache = {};
const SPECIAL_NAMES = ["Phönixschwert", "Sturmhammer", "Leerenstab"];
function weaponMeta(l) { return wTier(l) === 7 ? SPW : { w: WP_W, ox: WP_OX, oy: WP_OY }; }
function glowAt(g, x, y, r, rgb, a) { g.save(); g.globalCompositeOperation = "lighter"; const rg = g.createRadialGradient(x, y, r * .05, x, y, r); rg.addColorStop(0, "rgba(" + rgb + "," + a + ")"); rg.addColorStop(1, "rgba(" + rgb + ",0)"); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
function poly(c, pts, fill) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); FS(c, fill); }
function phoenixSword(c, g, tm, l) {
  const pu = .5 + .5 * Math.sin(tm * 3), flap = Math.sin(tm * 3.2) * .13;
  glowAt(g, 0, -.7, 1.0, "255,150,50", .42 + .2 * pu);
  /* Flügel aus Feuerfedern, schlagen langsam auf und ab */
  const FC = ["#ffe27a", "#ffb02a", "#ff7a2a", "#ff4a1c", "#c82a14"];
  for (const s of [-1, 1]) for (let i = 4; i >= 0; i--) {
    const th = s * (.5 + i * .3 + flap * (1 + i * .12)), L = .5 + (i === 2 ? .12 : i === 1 || i === 3 ? .06 : 0), dx = Math.sin(th), dy = -Math.cos(th), px = -dy, py = dx, bx = s * .06, by = -.28, w = .1;
    c.lineWidth = .03; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + dx * L * .55 + px * w, by + dy * L * .55 + py * w, bx + dx * L, by + dy * L); c.quadraticCurveTo(bx + dx * L * .5 - px * w, by + dy * L * .5 - py * w, bx, by); c.closePath(); FS(c, FC[i]);
  }
  /* Klinge mit nach oben laufendem Feuerverlauf */
  const bl = () => { c.beginPath(); c.moveTo(-.065, -.3); c.lineTo(-.065, -1.0); c.lineTo(0, -1.22); c.lineTo(.065, -1.0); c.lineTo(.065, -.3); c.closePath(); };
  const gr = g.createLinearGradient(0, -.3, 0, -1.2); gr.addColorStop(0, "#c82a14"); gr.addColorStop(.35, "#ff6a24"); gr.addColorStop(.7, "#ffc13a"); gr.addColorStop(1, "#fff6c0");
  c.lineWidth = .035; bl(); FS(c, gr);
  g.save(); bl(); c.clip();
  for (let k = 0; k < 3; k++) { const y = -.3 - ((tm * .5 + k / 3) % 1) * .95, bg = g.createLinearGradient(0, y - .07, 0, y + .07); bg.addColorStop(0, "rgba(255,255,220,0)"); bg.addColorStop(.5, "rgba(255,255,230,.8)"); bg.addColorStop(1, "rgba(255,255,220,0)"); g.fillStyle = bg; g.fillRect(-.1, y - .07, .2, .14); }
  g.restore(); g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = .016; g.beginPath(); g.moveTo(0, -.34); g.lineTo(0, -1.05); g.stroke(); g.strokeStyle = INK;
  /* Griff, Parierstange, Knauf */
  c.lineWidth = .03; poly(c, [[-.035, -.22], [.035, -.22], [.03, .1], [-.03, .1]], "#6a1a20");
  g.strokeStyle = "#ffd95a"; g.lineWidth = .02; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-.035, -.17 + i * .08); g.lineTo(.035, -.13 + i * .08); g.stroke(); } g.strokeStyle = INK;
  c.lineWidth = .03; poly(c, [[-.2, -.3], [.2, -.3], [.17, -.22], [-.17, -.22]], "#ffd95a");
  c.beginPath(); c.arc(0, -.26, .035, 0, 7); FS(c, "#e8381c"); c.beginPath(); c.arc(0, .14, .055, 0, 7); FS(c, "#ffd95a"); c.beginPath(); c.arc(0, .14, .025, 0, 7); FS(c, "#e8381c");
  /* Flammen an der Klinge */
  for (let k = 0; k < 6; k++) flameAt(c, g, (k % 2 ? 1 : -1) * .085, -.4 - k * .12, .2 + .08 * Math.sin(tm * 7 + k * 1.7), .055, "#ff5a1c", "#ffc13a");
  flameAt(c, g, 0, -1.14, .42 + .1 * Math.sin(tm * 8), .11, "#ff5a1c", "#ffe27a");
  /* Funken und treibende Federn */
  g.save(); for (let i = 0; i < 16; i++) { const ph = (tm * .65 + i / 16) % 1, x = Math.sin(i * 2.3 + ph * 4) * (.12 + ph * .5), y = -.45 - ph * 1.0; g.globalAlpha = Math.sin(ph * Math.PI); g.fillStyle = i % 2 ? "#ffd34a" : "#ff7a2a";
    if (i % 4 === 0) { g.beginPath(); g.ellipse(x, y, .045, .018, ph * 3 + i, 0, 7); g.fill(); } else { g.beginPath(); g.arc(x, y, .017 * (1 - ph * .4), 0, 7); g.fill(); } } g.restore();
}
function stormHammer(c, g, tm, l) {
  const cyc = tm % 1.4, fl = Math.max(0, 1 - cyc / .3), f = Math.floor(tm * 14), pu = .5 + .5 * Math.sin(tm * 6);
  glowAt(g, 0, -.85, .9, "130,190,255", .25 + .5 * fl + .1 * pu);
  /* Gewitterwolke */
  const cb = Math.sin(tm * 2) * .02, cl = "rgb(" + Math.round(74 + fl * 160) + "," + Math.round(86 + fl * 150) + "," + Math.round(130 + fl * 100) + ")";
  for (const p of [[-.27, -1.24, .14], [.27, -1.24, .14], [-.13, -1.19, .13], [.13, -1.19, .13], [0, -1.34, .18]]) { c.lineWidth = .03; c.beginPath(); c.arc(p[0], p[1] + cb, p[2], 0, 7); FS(c, cl); }
  c.lineWidth = 0; g.fillStyle = cl; g.beginPath(); g.ellipse(0, -1.24 + cb, .26, .12, 0, 0, 7); g.fill();
  /* Schaft */
  c.lineWidth = .03; poly(c, [[-.04, -.66], [.04, -.66], [.036, .14], [-.036, .14]], "#3a4468");
  g.strokeStyle = "#8aa0d8"; g.lineWidth = .02; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-.04, -.05 + i * .045); g.lineTo(.04, -.02 + i * .045); g.stroke(); } g.strokeStyle = INK;
  c.beginPath(); c.arc(0, .17, .06, 0, 7); FS(c, "#8aa0d8");
  /* Hammerkopf */
  const hg = g.createLinearGradient(0, -1.0, 0, -.66); hg.addColorStop(0, "#f0f6ff"); hg.addColorStop(.5, "#97aedf"); hg.addColorStop(1, "#46588f");
  c.lineWidth = .035; poly(c, [[-.34, -1.0], [.34, -1.0], [.34, -.66], [-.34, -.66]], hg);
  c.lineWidth = .03; poly(c, [[-.45, -1.04], [-.32, -1.04], [-.32, -.62], [-.45, -.62]], "#46588f"); poly(c, [[.45, -1.04], [.32, -1.04], [.32, -.62], [.45, -.62]], "#46588f");
  for (const p of [[-.385, -.97], [-.385, -.69], [.385, -.97], [.385, -.69]]) { c.beginPath(); c.arc(p[0], p[1], .02, 0, 7); FS(c, "#e8f0ff"); }
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = .018; g.beginPath(); g.moveTo(-.28, -.95); g.lineTo(.22, -.95); g.stroke(); g.strokeStyle = INK;
  /* leuchtendes Blitzzeichen */
  c.lineWidth = .028; poly(c, [[.05, -.96], [-.1, -.8], [-.01, -.8], [-.07, -.68], [.11, -.85], [.01, -.85]], "rgb(255," + Math.round(225 + 30 * fl) + "," + Math.round(60 + 160 * fl) + ")");
  /* Blitze, springen im Takt von der Wolke und vom Kopf */
  const bolt = (x0, y0, x1, y1, k, n) => { const pts = [[x0, y0]]; for (let i = 1; i < n; i++) { const t = i / n, jx = (hs(f, i, k) - .5) * .18, jy = (hs(f, i + 9, k) - .5) * .1; pts.push([x0 + (x1 - x0) * t + jx, y0 + (y1 - y0) * t + jy]); } pts.push([x1, y1]); return pts; };
  const draw = (pts, w, col, a) => { g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; g.lineJoin = "miter"; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.restore(); };
  const arcs = [bolt(-.45, -.8, -.9 + (hs(f, 1, 5) - .5) * .2, -.55 + (hs(f, 2, 5) - .5) * .4, 1, 6), bolt(.45, -.8, .9 + (hs(f, 3, 5) - .5) * .2, -1.0 + (hs(f, 4, 5) - .5) * .4, 2, 6), bolt(-.2, -1.1, -.3, -.7, 3, 4), bolt(.25, -1.1, .33, -.7, 4, 4)];
  if (fl > .15) arcs.push(bolt(.1, -1.2, .6 + hs(f, 5, 6) * .2, -.1, 7, 9));
  for (const a of arcs) { draw(a, .07, "#7ec8ff", .4); draw(a, .028, "#ffffff", .95); }
  g.save(); for (let i = 0; i < 8; i++) { const ph = (tm * 1.3 + i * .125) % 1; g.globalAlpha = Math.sin(ph * Math.PI); g.fillStyle = i % 2 ? "#ffe94a" : "#ffffff"; sparklePath(g, Math.cos(i * 2.1) * .5 * (.5 + ph * .6), -.82 + Math.sin(i * 1.7) * .28 - ph * .1, .045); g.fill(); } g.restore();
}
function voidStaff(c, g, tm, l) {
  const cx = 0, cy = -.98, pu = .5 + .5 * Math.sin(tm * 2.2), ROT = -.35, CG = g.createConicGradient ? 1 : 0;
  glowAt(g, cx, cy, .6, "190,120,255", .2 + .12 * pu);
  /* dunkle Verzerrung um das Loch */
  g.save(); const hr = g.createRadialGradient(cx, cy, .1, cx, cy, .85); hr.addColorStop(0, "rgba(20,0,50,.6)"); hr.addColorStop(.6, "rgba(60,20,120,.22)"); hr.addColorStop(1, "rgba(60,20,120,0)"); g.fillStyle = hr; g.fillRect(-1, -1.9, 2, 1.8); g.restore();
  for (let k = 0; k < 2; k++) { const ph = (tm * .45 + k * .5) % 1; g.save(); g.globalAlpha = (1 - ph) * .6; g.strokeStyle = "#c8a0ff"; g.lineWidth = .012; g.beginPath(); g.arc(cx, cy, .2 + ph * .6, 0, 7); g.stroke(); g.restore(); }
  /* Stab mit Runen */
  c.lineWidth = .03; poly(c, [[-.035, -.7], [.035, -.7], [.03, .14], [-.03, .14]], "#2a1850");
  for (let i = 0; i < 6; i++) { const a = .5 + .5 * Math.sin(tm * 3 + i * 1.1); g.fillStyle = i % 2 ? "rgba(120,230,255," + (.4 + .6 * a) + ")" : "rgba(255,140,230," + (.4 + .6 * a) + ")"; g.fillRect(-.012, -.58 + i * .11, .024, .05); }
  c.beginPath(); c.arc(0, .17, .06, 0, 7); FS(c, "#8a46d0");
  /* Klauen */
  for (const s of [-1, 1]) { c.lineWidth = .03; c.beginPath(); c.moveTo(s * .035, -.7); c.bezierCurveTo(s * .2, -.78, s * .32, -.95, s * .22, -1.17); c.lineTo(s * .17, -1.1); c.bezierCurveTo(s * .24, -.95, s * .14, -.82, 0, -.76); c.closePath(); FS(c, "#b98cff"); }
  /* Akkretionsscheibe: hintere Hälfte */
  const disk = (a0, a1) => {
    g.save(); g.translate(cx, cy); g.rotate(ROT); g.lineCap = "butt";
    g.strokeStyle = INK; g.lineWidth = .11; g.beginPath(); g.ellipse(0, 0, .46, .13, 0, a0, a1); g.stroke();
    let st = "#ffb040"; if (CG) { const cg = g.createConicGradient(-tm * 1.6, 0, 0); [[0, "#fff3c0"], [.18, "#ffb040"], [.38, "#ff4a8a"], [.58, "#8a4aff"], [.78, "#4ac8ff"], [1, "#fff3c0"]].forEach(p => cg.addColorStop(p[0], p[1])); st = cg; }
    g.strokeStyle = st; g.lineWidth = .075; g.beginPath(); g.ellipse(0, 0, .46, .13, 0, a0, a1); g.stroke(); g.restore();
  };
  disk(Math.PI, 2 * Math.PI);
  /* das Loch selbst */
  c.lineWidth = .03; c.beginPath(); c.arc(cx, cy, .16, 0, 7); FS(c, "#050210");
  g.save(); g.strokeStyle = "rgba(255,240,255," + (.7 + .3 * pu) + ")"; g.lineWidth = .014; g.beginPath(); g.arc(cx, cy, .178, 0, 7); g.stroke(); g.restore();
  disk(0, Math.PI);
  /* Sterne, die ins Loch gezogen werden */
  g.save(); g.translate(cx, cy); g.rotate(ROT);
  for (let i = 0; i < 30; i++) { const ph = (tm * .33 + i / 30) % 1, r = .85 * (1 - ph) + .2, a = i * 2.4 + ph * 7, x = Math.cos(a) * r, y = Math.sin(a) * r * .32; g.globalAlpha = Math.sin(ph * Math.PI) * .95; g.fillStyle = i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#c8a0ff" : "#ffb040"; g.beginPath(); g.arc(x, y, .018 * (1.2 - ph * .5), 0, 7); g.fill(); if (i % 5 === 0) { sparklePath(g, x, y, .04); g.fill(); } }
  g.restore();
}
const SPECIAL_DRAW = [phoenixSword, stormHammer, voidStaff];
function specialFrame(l, tm) {
  const key = Math.floor(tm * 20); let o = specialCache[l]; if (!o) o = specialCache[l] = { cv: mkCanvas(SPW.w, SPW.w), key: -1 };
  if (o.key === key) return o.cv; o.key = key;
  const g = o.cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, SPW.w, SPW.w);
  g.setTransform(WP_U, 0, 0, WP_U, SPW.ox, SPW.oy); g.lineJoin = g.lineCap = "round"; g.lineWidth = .03; g.strokeStyle = INK;
  SPECIAL_DRAW[l - 85](sketch(g, l * .71, .07, .006), g, tm, l);
  return o.cv;
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
/* Farbton verschieben (für immer neue Farben bei späteren Durchläufen); Grau und Weiß werden dabei eingefärbt */
function shiftHex(hex, deg) {
  const p = parseInt(hex.slice(1), 16); let r = (p >> 16) / 255, g = ((p >> 8) & 255) / 255, b = (p & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, sat = 0;
  if (mx !== mn) { const d = mx - mn; sat = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return hsl(h + deg, Math.max(sat, .42), clamp(l, .3, .86));
}
function monPal(kind, tint, deg) {
  const base = MONS[kind].pal[tint % 3], extra = Math.floor(tint / 3) * 47 + deg; if (!extra) return base;
  return { a: shiftHex(base.a, extra), b: shiftHex(base.b, extra), d: shiftHex(base.d, extra) };
}
/* Sechs verschiedene Kopfstücke für Bosse */
function bossHat(c, g, acc, x, y) {
  c.lineWidth = .03;
  const band = col => { c.beginPath(); c.moveTo(x - .22, y); c.lineTo(x - .21, y - .07); c.lineTo(x + .21, y - .07); c.lineTo(x + .22, y); c.closePath(); FS(c, col); };
  if (acc === 0) crownShape(c, g, x, y, 1.1);
  else if (acc === 1) {
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * .2, y - .06); c.quadraticCurveTo(x + s * .42, y - .08, x + s * .38, y - .34); c.quadraticCurveTo(x + s * .3, y - .2, x + s * .15, y - .16); c.closePath(); FS(c, "#f3e6c0"); }
    c.beginPath(); c.moveTo(x - .24, y); c.quadraticCurveTo(x - .24, y - .26, x, y - .26); c.quadraticCurveTo(x + .24, y - .26, x + .24, y); c.closePath(); FS(c, "#9aa3b6");
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .02; g.beginPath(); g.moveTo(x - .14, y - .1); g.quadraticCurveTo(x - .1, y - .2, x - .02, y - .21); g.stroke(); g.strokeStyle = INK;
  } else if (acc === 2) {
    band("#c9482a"); for (const f of [[-.14, .18, "#ff7a2a"], [0, .27, "#ffb02a"], [.14, .18, "#ff7a2a"]]) { c.beginPath(); c.moveTo(x + f[0] - .07, y - .07); c.quadraticCurveTo(x + f[0] - .03, y - .07 - f[1] * .6, x + f[0], y - .07 - f[1]); c.quadraticCurveTo(x + f[0] + .04, y - .07 - f[1] * .5, x + f[0] + .07, y - .07); c.closePath(); FS(c, f[2]); }
  } else if (acc === 3) {
    band("#6d7fb8"); for (const f of [[-.14, .2], [0, .3], [.14, .2]]) { c.beginPath(); c.moveTo(x + f[0] - .06, y - .07); c.lineTo(x + f[0], y - .07 - f[1]); c.lineTo(x + f[0] + .06, y - .07); c.closePath(); FS(c, "#9ff0ff"); }
  } else if (acc === 4) {
    const gr = g.createRadialGradient(x, y - .12, .02, x, y - .12, .3); gr.addColorStop(0, "rgba(255,240,150,.55)"); gr.addColorStop(1, "rgba(255,240,150,0)"); g.fillStyle = gr; g.fillRect(x - .4, y - .45, .8, .6);
    c.lineWidth = .045; c.beginPath(); c.ellipse(x, y - .14, .24, .065, 0, 0, 7); c.strokeStyle = "#ffe27a"; c.stroke(); g.strokeStyle = INK;
  } else {
    c.beginPath(); c.ellipse(x, y - .02, .3, .06, 0, 0, 7); FS(c, "#4a2f8a");
    c.beginPath(); c.moveTo(x - .2, y - .03); c.quadraticCurveTo(x - .1, y - .2, x + .1, y - .42); c.quadraticCurveTo(x + .14, y - .2, x + .2, y - .03); c.closePath(); FS(c, "#5a3aa0");
    g.fillStyle = "#ffe27a"; starPath(g, x + .01, y - .15, .06, .028, 0); g.fill();
  }
}
function monKey(i) { return [i.kind, i.tint, i.boss ? i.acc : "x", i.deg || 0].join("_"); }
function monsterSprite(info) {
  const key = monKey(info);
  return monCache[key] || (monCache[key] = makeSprite(MON_W, MON_W, MON_OX, MON_OY, MON_U, info.kind * 1.9 + info.tint + 5 + (info.acc || 0) * .3, (c, g) => {
    const M = MONS[info.kind];
    g.fillStyle = "rgba(10,10,40,.28)"; g.beginPath(); g.ellipse(0, .01, .5, .06, 0, 0, 7); g.fill();
    if (info.boss) { const gr = g.createRadialGradient(0, -.4, .1, 0, -.4, .8); gr.addColorStop(0, "rgba(255,70,80,.38)"); gr.addColorStop(1, "rgba(255,70,80,0)"); g.fillStyle = gr; g.fillRect(-1, -1.2, 2, 1.6); }
    MONDRAW[info.kind](c, g, monPal(info.kind, info.tint, info.deg || 0));
    if (info.boss) bossHat(c, g, info.acc, M.cx, -M.top - .02);
  }, .007));
}
function monsterSil(info) { const key = monKey(info); return monSilCache[key] || (monSilCache[key] = silhouette(monsterSprite(info), "#ffffff")); }

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
