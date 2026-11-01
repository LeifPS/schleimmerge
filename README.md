# Schleimmerge

Ein handgezeichnetes Merge-Spiel im Browser: Kaufe Schleime, ziehe zwei gleiche aufeinander und erhalte einen besseren. Jeder Schleim hat einen eigenen Farbverlauf und eine eigene Waffe. Drei Schleime kämpfen rechts gegen Monster und verdienen Münzen. Alles ist selbst gezeichnet (keine Emojis, keine Symbolschriften), im Stil von Tonlinge.

## Spielen

- **Kaufen**: den blauen Knopf unter dem Raster drücken.
- **Verschmelzen**: einen Schleim auf einen gleichen ziehen, dann wird er eine Stufe besser.
- **Ausrüsten**: Schleim in eines der drei blauen Felder rechts ziehen (oder antippen). Dort kämpft er automatisch.
- **Löschen**: Einen Schleim auf den Mülleimer neben dem Kaufknopf ziehen, dann ist er weg (macht Platz im Raster).
- **Kisten**: Nach jedem fünften Sieg einer Bahn öffnet sich die Kiste und gibt Bonusmünzen, manchmal einen Schleim.
- **Sammlung**: Die Leiste links zeigt alle 84 Stufen (im Querformat).
- **Weg gewesen**: Beim Zurückkommen gibt es Münzen für die Zeit, in der deine Schleime weitergekämpft haben (bis 2 Stunden, mit halber Kraft).
- **Ton**: kleine selbst erzeugte Geräusche, der runde Knopf oben links schaltet sie aus.

Der Spielstand liegt im Browser (localStorage).

## Aufbau

- `src/`: Quellcode (`00_balance.js` Zahlen, `01_core.js` Zeichenhelfer und Wackel-Linien, `02_art.js` Schleime, Waffen, Monster, Kiste, `03_game.js` Spiel)
- `build.sh`: baut alles zu einer einzigen `public/index.html`
- `public/index.html`: das fertige Spiel, einfach im Browser öffnen oder irgendwo hosten

```
./build.sh
```
