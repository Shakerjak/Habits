#!/usr/bin/env node
// Listet alle offenen und zu prüfenden Angaben aus inhalte/ auf: npm run offen
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeInhalte, sammleProbleme } from '../src/lib/daten.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const probleme = await sammleProbleme(await ladeInhalte(WURZEL), WURZEL);
const ARTEN = { offen: 'FEHLT ', pruefen: 'PRÜFEN', bild: 'FOTO  ', hinweis: 'HINWEIS' };
let datei = null;
for (const p of probleme) {
  if (p.datei !== datei) {
    datei = p.datei;
    console.log(`\ninhalte/${datei}`);
  }
  console.log(`  [${ARTEN[p.art]}] ${p.ort}: ${p.text}`);
}
const blockierend = probleme.filter((p) => p.blockiert).length;
console.log(`\n${blockierend} Pflichtangaben offen, ${probleme.length - blockierend} Empfehlungen.`);
