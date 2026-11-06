#!/bin/bash
# Baut public/index.html aus den Quelldateien in src/
cd "$(dirname "$0")/src"
mkdir -p ../public
{ echo '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
  cat head.html fonts.css base.css
  echo '</style><body><canvas id="cv"></canvas><script>'
  cat 00_lgh_vorlade.js 00_balance.js 01_core.js 02_art.js 03_game.js 99_spielstand_code.js
  echo '</script>'; } > ../public/index.html
node -e "const s=require('fs').readFileSync('../public/index.html','utf8');const m=s.match(/<script>([\s\S]*)<\/script>/)[1];try{new Function(m);console.log('syntax ok')}catch(e){console.log('ERR',e.message)}"
ls -la ../public/index.html
