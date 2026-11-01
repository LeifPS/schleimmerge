"use strict";
/* Reine Rechenfunktionen (ohne Browser), damit man sie in Node simulieren kann */
const MAXLVL = 84;
const BEAT = 0.85;                                   // Sekunden zwischen zwei Schlägen
const dpsOf = l => 4 * Math.pow(2.15, l - 1);         // Schaden pro Sekunde eines Schleims
const isBoss = st => st % 10 === 0;
const baseHp = st => Math.round(14 * Math.pow(1.30, st - 1));
const hpOf = st => baseHp(st) * (isBoss(st) ? 5 : 1);
const rewardOf = st => Math.ceil(baseHp(st) * 0.6) * (isBoss(st) ? 4 : 1);
const spawnLvl = best => Math.max(1, best - 5);       // welche Stufe der Kauf-Button liefert
const costOf = (lvl, units) => Math.floor(12 * Math.pow(2.3, lvl - 1) * (1 + 0.022 * units));   // units = Wert aller aktuell besessenen Schleime, gemessen in Schleimen der Kauf-Stufe (eine Stufe höher zählt genau doppelt)
const CHEST_EVERY = 5;                               // Kisten öffnen sich nach so vielen Siegen

const SUFFIX = ["", "k", "m", "b", "t", "qa", "qi", "sx", "sp", "oc", "no", "dc", "ud", "dd"];
function fmt(n) {
  if (!isFinite(n)) return "unendlich";
  if (n < 1000) return String(Math.floor(n));
  const e = Math.min(SUFFIX.length - 1, Math.floor(Math.log10(n) / 3));
  if (e >= SUFFIX.length - 1 && n >= 1e42) return n.toExponential(2).replace("+", "");
  const v = n / Math.pow(1000, e);
  return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "") + SUFFIX[e];
}
