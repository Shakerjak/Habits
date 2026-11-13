#!/usr/bin/env node
// Erzeugt die statische Website im Ordner dist/.
//   npm run build        → Vorschau mit markierten Platzhaltern (noindex)
//   npm run build:live   → Veröffentlichungsversion; bricht ab, solange Pflichtangaben fehlen
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ladeInhalte, sammleProbleme } from '../src/lib/daten.mjs';
import { verarbeiteBilder, ogBildAusFoto } from '../src/lib/bilder.mjs';
import { seitenGeruest } from '../src/lib/layout.mjs';
import { startseite } from '../src/seiten/startseite.mjs';
import { speisekarte } from '../src/seiten/speisekarte.mjs';
import { impressum, datenschutz } from '../src/seiten/rechtliches.mjs';
import { fehlerseite, offenePunkte } from '../src/seiten/sonstige.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = path.join(WURZEL, 'dist');
const VORSCHAU_DOMAIN = 'https://domain-noch-offen.invalid';

const modus = process.argv.includes('--live') ? 'live' : 'vorschau';

function hash(inhalt) {
  return createHash('sha256').update(inhalt).digest('hex').slice(0, 10);
}

function pruefeDomain(domain) {
  if (typeof domain !== 'string' || !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return 'In inhalte/betrieb.json bei "domain" die endgültige Adresse eintragen, z. B. https://www.beispiel.at (mit https://, ohne / am Ende).';
  }
  return null;
}

// Einfache, sichere Verkleinerung: Kommentare und überflüssige Leerzeichen entfernen.
function minimiereCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

async function kopiereAssets() {
  await mkdir(path.join(ZIEL, 'assets'), { recursive: true });
  const css = minimiereCss(await readFile(path.join(WURZEL, 'src/css/site.css'), 'utf8'));
  const js = await readFile(path.join(WURZEL, 'src/js/site.js'), 'utf8');
  const cssName = `site.${hash(css)}.css`;
  const jsName = `site.${hash(js)}.js`;
  await writeFile(path.join(ZIEL, 'assets', cssName), css);
  await writeFile(path.join(ZIEL, 'assets', jsName), js);
  await cp(path.join(WURZEL, 'src/fonts'), path.join(ZIEL, 'fonts'), { recursive: true });
  await cp(path.join(WURZEL, 'src/static'), ZIEL, { recursive: true });
  return { css: `/assets/${cssName}`, js: `/assets/${jsName}` };
}

function sitemap(ctx, seiten, datum) {
  const urls = seiten
    .filter((s) => s.indexieren)
    .map((s) => `  <url>\n    <loc>${ctx.basisUrl}${s.pfad}</loc>\n    <lastmod>${datum}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function robots(ctx) {
  if (ctx.modus !== 'live') return '# Vorschau – nicht indexieren\nUser-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\n\nSitemap: ${ctx.basisUrl}/sitemap.xml\n`;
}

function manifest(ctx) {
  return JSON.stringify({
    name: ctx.betrieb.name,
    short_name: ctx.betrieb.name,
    lang: ctx.texte.sprache,
    start_url: '/',
    display: 'browser',
    background_color: '#171614',
    theme_color: '#171614',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2);
}

const CSP = "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";

function headersDatei(ctx) {
  // Für Netlify und Cloudflare Pages; wird auch vom lokalen Vorschau-Server gelesen.
  return `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Content-Security-Policy: ${CSP}
  Strict-Transport-Security: max-age=31536000
${ctx.modus === 'live' ? '' : '  X-Robots-Tag: noindex, nofollow\n'}
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/bilder/*
  Cache-Control: public, max-age=31536000, immutable
`;
}

function htaccess(ctx) {
  // Für Apache-Hosting (z. B. viele österreichische Webhoster).
  return `# ${ctx.betrieb.name} – Apache-Konfiguration (wird beim Build erzeugt)
Options -MultiViews -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
  RewriteEngine On

  # HTTPS erzwingen
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !=https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Optional: einheitlich mit www – Domain anpassen und die zwei Zeilen aktivieren
  # RewriteCond %{HTTP_HOST} ^beispiel\\.at$ [NC]
  # RewriteRule ^ https://www.beispiel.at%{REQUEST_URI} [L,R=301]

  # /seite.html → /seite und /index → /
  RewriteCond %{THE_REQUEST} \\s/+([^?\\s]*?)\\.html[\\s?] [NC]
  RewriteRule ^ /%1 [R=301,L]
  RewriteRule ^index$ / [R=301,L]

  # Saubere Adressen: /speisekarte liefert speisekarte.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.+?)/?$ $1.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  Header always set Content-Security-Policy "${CSP}"
  Header always set Strict-Transport-Security "max-age=31536000" env=HTTPS
${ctx.modus === 'live' ? '' : '  Header always set X-Robots-Tag "noindex, nofollow"\n'}  <FilesMatch "\\.(woff2|avif|webp|jpg|png|svg|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "^site\\.[0-9a-f]+\\.(css|js)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json application/manifest+json application/xml image/svg+xml text/plain
</IfModule>

<IfModule mod_mime.c>
  AddType font/woff2 .woff2
  AddType image/avif .avif
  AddType application/manifest+json .webmanifest
</IfModule>
`;
}

async function main() {
  const inhalte = await ladeInhalte(WURZEL);
  const probleme = await sammleProbleme(inhalte, WURZEL);

  let basisUrl;
  if (modus === 'live') {
    const domainFehler = pruefeDomain(inhalte.betrieb.domain);
    const blockierend = probleme.filter((p) => p.blockiert);
    if (domainFehler && !blockierend.some((p) => p.ort === 'Endgültige Domain')) blockierend.unshift({ datei: 'betrieb.json', ort: 'Domain', text: domainFehler });
    if (blockierend.length) {
      console.error(`\n✖ Live-Version nicht erstellt: ${blockierend.length} Angaben fehlen oder sind noch zu prüfen.\n`);
      for (const p of blockierend) console.error(`  • inhalte/${p.datei} – ${p.ort}: ${p.text}`);
      console.error('\nVorschau mit Platzhaltern: npm run build\n');
      process.exit(1);
    }
    basisUrl = inhalte.betrieb.domain;
  } else {
    basisUrl = (process.env.SITE_URL || VORSCHAU_DOMAIN).replace(/\/$/, '');
  }

  await rm(ZIEL, { recursive: true, force: true });
  await mkdir(ZIEL, { recursive: true });
  const assets = await kopiereAssets();
  const bildDaten = await verarbeiteBilder({ bilder: inhalte.bilder, wurzel: WURZEL, ziel: ZIEL, modus });
  const fotoOg = await ogBildAusFoto({ bilder: inhalte.bilder, wurzel: WURZEL, ziel: ZIEL });
  const ogBild = fotoOg
    ? { ...fotoOg, alt: inhalte.bilder.hero.alt }
    : { url: '/og-bild.png', breite: 1200, hoehe: 630, typ: 'image/png', alt: `${inhalte.betrieb.name} – Yaprak Döner, Burger und Pizza in Salzburg` };

  const heute = new Date();
  const ctx = {
    ...inhalte,
    modus,
    basisUrl,
    assets,
    bildDaten,
    ogBild,
    probleme,
    jahr: heute.getFullYear(),
  };

  const seiten = [
    { datei: 'index.html', seite: startseite(ctx) },
    { datei: 'speisekarte.html', seite: speisekarte(ctx) },
    { datei: 'impressum.html', seite: impressum(ctx) },
    { datei: 'datenschutz.html', seite: datenschutz(ctx) },
    { datei: '404.html', seite: fehlerseite(ctx) },
  ];
  if (modus === 'vorschau') seiten.push({ datei: 'offene-punkte.html', seite: offenePunkte(ctx) });

  for (const { datei, seite } of seiten) {
    await writeFile(path.join(ZIEL, datei), seitenGeruest(ctx, seite));
  }

  const datum = heute.toISOString().slice(0, 10);
  await writeFile(path.join(ZIEL, 'sitemap.xml'), sitemap(ctx, seiten.map((s) => s.seite), datum));
  await writeFile(path.join(ZIEL, 'robots.txt'), robots(ctx));
  await writeFile(path.join(ZIEL, 'site.webmanifest'), manifest(ctx));
  await writeFile(path.join(ZIEL, '_headers'), headersDatei(ctx));
  await writeFile(path.join(ZIEL, '.htaccess'), htaccess(ctx));

  const dateien = (await readdir(ZIEL)).length;
  const blockierend = probleme.filter((p) => p.blockiert).length;
  const fotos = probleme.filter((p) => p.art === 'bild').length;
  console.log(`✔ ${modus === 'live' ? 'Live-Version' : 'Vorschau'} erstellt in dist/ (${seiten.length} Seiten, ${dateien} Einträge, Basis-URL ${basisUrl})`);
  if (modus === 'vorschau') {
    console.log(`  ${blockierend} offene Pflichtangaben, ${fotos} fehlende Fotos – Übersicht: /offene-punkte`);
  } else if (fotos) {
    console.warn(`  Hinweis: ${fotos} Fotos fehlen noch; an ihrer Stelle erscheinen neutrale Flächen.`);
  }
}

main().catch((fehler) => {
  console.error(`\n✖ ${fehler.message}\n`);
  process.exit(1);
});
