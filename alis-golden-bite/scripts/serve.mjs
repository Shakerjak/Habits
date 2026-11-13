#!/usr/bin/env node
// Lokaler Vorschau-Server für dist/ mit sauberen Adressen (/speisekarte → speisekarte.html),
// 404-Seite und denselben HTTP-Headern wie in dist/_headers.
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT || 4173);
const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

async function ladeHeaders() {
  try {
    const text = await readFile(path.join(WURZEL, '_headers'), 'utf8');
    const regeln = [];
    let aktuell = null;
    for (const zeile of text.split('\n')) {
      if (!zeile.trim()) continue;
      if (!zeile.startsWith(' ')) {
        aktuell = { muster: zeile.trim(), headers: {} };
        regeln.push(aktuell);
      } else if (aktuell) {
        const i = zeile.indexOf(':');
        aktuell.headers[zeile.slice(0, i).trim()] = zeile.slice(i + 1).trim();
      }
    }
    return regeln;
  } catch {
    return [];
  }
}

async function datei(pfad) {
  try {
    const s = await stat(pfad);
    return s.isFile() ? pfad : null;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(url.pathname);
  if (p.includes('..') || p.split('/').some((s) => s.startsWith('.') && s !== '')) {
    res.writeHead(404).end();
    return;
  }
  // /seite.html → /seite (wie auf dem echten Server)
  if (p.endsWith('.html')) {
    const ziel = p === '/index.html' ? '/' : p.slice(0, -5);
    res.writeHead(301, { Location: ziel + url.search }).end();
    return;
  }
  let gefunden = p === '/' ? path.join(WURZEL, 'index.html') : await datei(path.join(WURZEL, p));
  if (!gefunden && !path.extname(p)) gefunden = await datei(path.join(WURZEL, `${p.replace(/\/$/, '')}.html`));
  let status = 200;
  if (!gefunden) {
    gefunden = path.join(WURZEL, '404.html');
    status = 404;
  }
  const headers = { 'Content-Type': TYPEN[path.extname(gefunden)] || 'application/octet-stream' };
  for (const regel of await ladeHeaders()) {
    const muster = regel.muster.replace(/\*/g, '.*');
    if (new RegExp(`^${muster}$`).test(p)) Object.assign(headers, regel.headers);
  }
  delete headers['Strict-Transport-Security'];
  let inhalt = await readFile(gefunden);
  // Textdateien komprimiert ausliefern, wie es übliche Webhoster tun
  if (/^(text\/|application\/(json|xml|manifest)|image\/svg)/.test(headers['Content-Type']) && /gzip/.test(req.headers['accept-encoding'] || '')) {
    inhalt = gzipSync(inhalt);
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = 'Accept-Encoding';
  }
  res.writeHead(status, headers);
  res.end(inhalt);
});

server.listen(PORT, () => {
  console.log(`Vorschau läuft: http://localhost:${PORT}  (Beenden mit Strg+C)`);
});
