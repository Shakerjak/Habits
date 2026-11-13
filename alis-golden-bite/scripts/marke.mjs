#!/usr/bin/env node
// Erzeugt Favicons (PNG, ICO) und das Open-Graph-Bild aus dem Bildzeichen und der Wortmarke.
// Nur nötig, wenn sich Name, Farben oder Logo ändern: npm run marke
// Benötigt Playwright mit Chromium (npx playwright install chromium).
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { ZEICHEN_PFAD } from '../src/lib/bausteine.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC = path.join(WURZEL, 'src/static');
const betrieb = JSON.parse(await readFile(path.join(WURZEL, 'inhalte/betrieb.json'), 'utf8'));

const font = async (datei) => `data:font/woff2;base64,${(await readFile(path.join(WURZEL, 'src/fonts', datei))).toString('base64')}`;
const [bc700, bc600, dm] = await Promise.all([
  font('barlow-condensed-latin-700-normal.woff2'),
  font('barlow-condensed-latin-600-normal.woff2'),
  font('dm-sans-latin-wght-normal.woff2'),
]);

const icon = (groesse, rand) => `<!doctype html><html><body style="margin:0;background:#171614">
<svg xmlns="http://www.w3.org/2000/svg" width="${groesse}" height="${groesse}" viewBox="0 0 32 32" style="display:block">
<rect width="32" height="32" fill="#171614"/>
<path fill="#D6A84B" transform="translate(${16 - 16 * rand} ${16 - 16 * rand}) scale(${rand})" d="${ZEICHEN_PFAD}"/>
</svg></body></html>`;

const a = betrieb.adresse;
const og = `<!doctype html><html><head><style>
@font-face{font-family:"BC";src:url(${bc700});font-weight:700}
@font-face{font-family:"BC";src:url(${bc600});font-weight:600}
@font-face{font-family:"DM";src:url(${dm});font-weight:100 1000}
html,body{margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;background:#171614;color:#F7F2E9;font-family:"DM"}
.scheibe{position:absolute;right:-30px;top:35px;width:560px;height:560px;color:#D6A84B}
.text{position:absolute;left:84px;top:78px;width:640px}
.ali{font:600 40px/1 "BC";letter-spacing:.34em;color:#D6A84B;text-transform:uppercase}
.haupt{margin-top:10px;font:700 176px/.86 "BC";text-transform:uppercase;letter-spacing:.005em}
.haupt span{color:#D6A84B}
.linie{width:96px;height:6px;background:#D6A84B;margin:34px 0 26px}
.claim{font:600 38px/1.15 "BC";letter-spacing:.08em;text-transform:uppercase}
.ort{margin-top:12px;font:400 26px/1.3 "DM";color:#C4BAA8}
</style></head><body>
<svg class="scheibe" viewBox="0 0 32 32"><path fill="currentColor" d="${ZEICHEN_PFAD}"/></svg>
<div class="text">
<div class="ali">Ali’s</div>
<div class="haupt"><span>Golden</span><br>Bite</div>
<div class="linie"></div>
<div class="claim">Yaprak Döner · Burger · Pizza</div>
<div class="ort">${a.strasse} · ${a.plz} ${a.ort}</div>
</div>
</body></html>`;

function ico(png, groesse) {
  const kopf = Buffer.alloc(6 + 16);
  kopf.writeUInt16LE(0, 0);
  kopf.writeUInt16LE(1, 2);
  kopf.writeUInt16LE(1, 4);
  kopf.writeUInt8(groesse, 6);
  kopf.writeUInt8(groesse, 7);
  kopf.writeUInt8(0, 8);
  kopf.writeUInt8(0, 9);
  kopf.writeUInt16LE(1, 10);
  kopf.writeUInt16LE(32, 12);
  kopf.writeUInt32LE(png.length, 14);
  kopf.writeUInt32LE(22, 18);
  return Buffer.concat([kopf, png]);
}

const browser = await chromium.launch();
const seite = await browser.newPage();
async function bild(htmlText, breite, hoehe) {
  await seite.setViewportSize({ width: breite, height: hoehe });
  await seite.setContent(htmlText, { waitUntil: 'load' });
  await seite.evaluate(() => document.fonts.ready);
  return seite.screenshot({ type: 'png', clip: { x: 0, y: 0, width: breite, height: hoehe } });
}

await writeFile(path.join(STATIC, 'favicon.ico'), ico(await bild(icon(32, 0.86), 32, 32), 32));
await writeFile(path.join(STATIC, 'apple-touch-icon.png'), await bild(icon(180, 0.72), 180, 180));
await writeFile(path.join(STATIC, 'icon-192.png'), await bild(icon(192, 0.72), 192, 192));
await writeFile(path.join(STATIC, 'icon-512.png'), await bild(icon(512, 0.72), 512, 512));
await writeFile(path.join(STATIC, 'og-bild.png'), await bild(og, 1200, 630));
await browser.close();
console.log('✔ Favicons und og-bild.png in src/static/ erzeugt');
