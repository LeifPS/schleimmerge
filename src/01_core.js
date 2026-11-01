"use strict";
/* ===== Hilfsfunktionen und der handgezeichnete Look (wie in Tonlinge: wackelnde Doppellinie in Tintenblau) ===== */
const INK = "#1d2742";
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
function hs(x, y, k) { let h = (x * 374761393 + y * 668265263 + (k || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function hsl(h, s, l) { h = ((h % 360) + 360) % 360; const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); }; return "#" + f(0) + f(8) + f(4); }
function hexA(hex, a) { const p = parseInt(hex.slice(1), 16); return "rgba(" + (p >> 16) + "," + ((p >> 8) & 255) + "," + (p & 255) + "," + a + ")"; }
function mkCanvas(w, h) { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }

/* Ein Zeichenkontext, der alle Pfade leicht wackeln lässt, die Kontur doppelt zieht und die Füllung minimal neben den Strich setzt.
   seg = Abstand der Stützpunkte, amp = Stärke des Wackelns (beides in den Einheiten, in denen gerade gezeichnet wird). */
function sketch(c, seed, seg, amp) {
  let subs = [], cur = null, lx = 0, ly = 0; const TAU = Math.PI * 2;
  const add = (x, y) => { if (!cur) { cur = { p: [], closed: false }; subs.push(cur); } cur.p.push([x, y]); lx = x; ly = y; };
  const line = (x, y) => { if (!cur) return add(x, y); const n = Math.max(1, Math.ceil(Math.hypot(x - lx, y - ly) / seg)), x0 = lx, y0 = ly; for (let i = 1; i <= n; i++) add(x0 + (x - x0) * i / n, y0 + (y - y0) * i / n); };
  const nz = (i, k) => Math.sin(i * .85 + seed * 12.9 + k * 3.1) * .62 + Math.sin(i * 2.1 + seed * 7.3 + k) * .38;
  const emit = (k, a, ox, oy) => { c.beginPath(); for (const sb of subs) { if (sb.p.length < 2) continue; sb.p.forEach((p, i) => { const x = p[0] + nz(i, k) * a + ox, y = p[1] + nz(i + 40, k) * a + oy; i ? c.lineTo(x, y) : c.moveTo(x, y); }); if (sb.closed) c.closePath(); } };
  const arcPts = (x, y, rx, ry, rot, a0, a1, ccw) => {
    let d = a1 - a0; if (!ccw) { while (d < 0) d += TAU; if (d > TAU) d = TAU; } else { while (d > 0) d -= TAU; if (d < -TAU) d = -TAU; }
    const full = Math.abs(d) >= TAU - .01, n = Math.max(10, Math.ceil(Math.abs(d) * Math.max(rx, ry) / seg)), co = Math.cos(rot), si = Math.sin(rot);
    for (let i = 0; i <= (full ? n - 1 : n); i++) { const a = a0 + d * i / n, px = Math.cos(a) * rx, py = Math.sin(a) * ry, X = x + px * co - py * si, Y = y + px * si + py * co; i === 0 ? line(X, Y) : add(X, Y); }
    if (full && cur) cur.closed = true;
  };
  const O = {
    beginPath() { subs = []; cur = null; },
    moveTo(x, y) { cur = null; add(x, y); },
    lineTo: line,
    quadraticCurveTo(cx, cy, x, y) { const x0 = lx, y0 = ly, n = Math.max(4, Math.ceil((Math.hypot(cx - x0, cy - y0) + Math.hypot(x - cx, y - cy)) / seg)); for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; add(u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y); } },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) { const x0 = lx, y0 = ly, n = Math.max(5, Math.ceil((Math.hypot(c1x - x0, c1y - y0) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x - c2x, y - c2y)) / seg)); for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; add(u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x, u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y); } },
    arc(x, y, r, a0, a1, ccw) { arcPts(x, y, r, r, 0, a0, a1, ccw); },
    ellipse(x, y, rx, ry, rot, a0, a1, ccw) { arcPts(x, y, rx, ry, rot, a0, a1, ccw); },
    rect(x, y, w, h) { cur = null; add(x, y); line(x + w, y); line(x + w, y + h); line(x, y + h); O.closePath(); },
    closePath() { if (cur && cur.p.length) { cur.closed = true; const f = cur.p[0]; lx = f[0]; ly = f[1]; cur = null; } },
    fill() { const lw = c.lineWidth; emit(3, amp * .8, lw * .4, lw * .35); c.fill(); },
    stroke() { const lw = c.lineWidth; emit(1, amp, 0, 0); c.stroke(); c.save(); c.globalAlpha *= .45; c.lineWidth = lw * .5; emit(2, amp * 1.4, lw * .3, -lw * .25); c.stroke(); c.restore(); },
    clip() { emit(1, amp * .5, 0, 0); c.clip(); }
  };
  return new Proxy(c, { get(t, p) { if (p in O) return O[p]; const v = t[p]; return typeof v === "function" ? v.bind(t) : v; }, set(t, p, v) { t[p] = v; return true; } });
}
/* Füllen und mit Tinte umranden */
let FSMODE = 0;   // 0 = normal, 1 = nur Füllung, 2 = nur Kontur (für die animierten Magiewaffen)
function FS(c, fill) { if (fill && FSMODE !== 2) { c.fillStyle = fill; c.fill(); } if (FSMODE !== 1) { c.strokeStyle = INK; c.stroke(); } }
/* Sprite zeichnen: Leinwand w*h, Ursprung (ox,oy), Einheit u. fn bekommt einen wackelnden Kontext in Einheiten */
function makeSprite(w, h, ox, oy, u, seed, fn, amp) {
  const cv = mkCanvas(w, h), g = cv.getContext("2d");
  g.save(); g.translate(ox, oy); g.scale(u, u); g.lineJoin = g.lineCap = "round"; g.lineWidth = .03; g.strokeStyle = INK;
  fn(sketch(g, seed, .07, amp == null ? .007 : amp), g); g.restore(); return cv;
}
/* Weiße Silhouette eines Sprites (für den Treffer-Blitz) */
function silhouette(src, col) { const cv = mkCanvas(src.width, src.height), g = cv.getContext("2d"); g.drawImage(src, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = col || "#fff"; g.fillRect(0, 0, cv.width, cv.height); return cv; }
/* Vierzackiger Funke */
function sparklePath(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); }
function starPath(c, x, y, ro, ri, rot) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? ri : ro; i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
