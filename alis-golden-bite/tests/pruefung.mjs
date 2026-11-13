#!/usr/bin/env node
// Automatische Prüfung der gebauten Website (dist/) über den lokalen Vorschau-Server.
//   1. npm run build   2. npm run vorschau (zweites Terminal)   3. npm test
// Prüft: Direktaufrufe, Breiten 360/390/768/1440, horizontales Scrollen, Überdeckung durch die
// Aktionsleiste, Tastaturbedienung und Fokus, Dialoge, Links, Bilder, JSON-LD, Barrierefreiheit (axe-core).
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUSGABE = path.join(WURZEL, 'test-ergebnisse');
const BASIS = process.env.BASIS_URL || 'http://localhost:4173';
const SEITEN = ['/', '/speisekarte', '/impressum', '/datenschutz'];
const BREITEN = [
  { w: 360, h: 640 },
  { w: 390, h: 844 },
  { w: 768, h: 1024 },
  { w: 1440, h: 900 },
];

const betrieb = JSON.parse(await readFile(path.join(WURZEL, 'inhalte/betrieb.json'), 'utf8'));
const axeQuelle = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');

const ergebnisse = [];
function pruefe(name, ok, details = '') {
  ergebnisse.push({ name, ok: Boolean(ok), details });
  console.log(`${ok ? '✔' : '✖'} ${name}${details ? ` – ${details}` : ''}`);
}

await mkdir(AUSGABE, { recursive: true });
const browser = await chromium.launch();
const konsolenFehler = [];

async function neueSeite(breite, hoehe, optionen = {}) {
  const kontext = await browser.newContext({ viewport: { width: breite, height: hoehe }, locale: 'de-AT', ...optionen });
  const seite = await kontext.newPage();
  seite.on('console', (m) => {
    // Die absichtlich aufgerufene 404-Seite meldet ihren Status – das ist kein Fehler.
    if (m.type() === 'error' && !(seite.url().endsWith('/gibt-es-nicht') && m.text().includes('404'))) konsolenFehler.push(`${seite.url()}: ${m.text()}`);
  });
  seite.on('pageerror', (e) => konsolenFehler.push(`${seite.url()}: ${e.message}`));
  return { kontext, seite };
}

// ---------- 1. Direktaufrufe und Dateien ----------
{
  for (const p of SEITEN) {
    const r = await fetch(BASIS + p, { redirect: 'manual' });
    pruefe(`Direktaufruf ${p}`, r.status === 200 && r.headers.get('content-type').includes('text/html'), `Status ${r.status}`);
  }
  const r404 = await fetch(`${BASIS}/gibt-es-nicht`, { redirect: 'manual' });
  const t404 = await r404.text();
  pruefe('Unbekannte Adresse liefert 404-Seite', r404.status === 404 && t404.includes('Seite nicht gefunden'), `Status ${r404.status}`);
  const rHtml = await fetch(`${BASIS}/speisekarte.html`, { redirect: 'manual' });
  pruefe('/speisekarte.html leitet auf /speisekarte um', rHtml.status === 301 && rHtml.headers.get('location') === '/speisekarte', `Status ${rHtml.status} → ${rHtml.headers.get('location')}`);
  for (const d of ['/sitemap.xml', '/robots.txt', '/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/og-bild.png', '/site.webmanifest']) {
    const r = await fetch(BASIS + d);
    pruefe(`Datei ${d}`, r.status === 200, `Status ${r.status}`);
  }
  const sitemap = await (await fetch(`${BASIS}/sitemap.xml`)).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  pruefe('Sitemap enthält alle Seiten', SEITEN.every((p) => locs.includes(p)), locs.join(', '));
  const csp = (await fetch(BASIS + '/')).headers.get('content-security-policy');
  pruefe('Content-Security-Policy gesetzt', Boolean(csp), csp ? 'ja' : 'fehlt');
}

// ---------- 2. Inhalt und SEO je Seite ----------
const alleLinks = new Map();
{
  const { kontext, seite } = await neueSeite(1440, 900);
  for (const p of SEITEN) {
    await seite.goto(BASIS + p, { waitUntil: 'networkidle' });
    const info = await seite.evaluate(() => {
      const meta = (n) => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.getAttribute('content') || null;
      const ebenen = [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map((h) => Number(h.tagName[1]));
      let sprung = null;
      for (let i = 1; i < ebenen.length; i++) if (ebenen[i] > ebenen[i - 1] + 1) sprung = `${ebenen[i - 1]}→${ebenen[i]}`;
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      const doppelt = ids.filter((id, i) => ids.indexOf(id) !== i);
      return {
        titel: document.title,
        beschreibung: meta('description'),
        kanonisch: document.querySelector('link[rel="canonical"]')?.href || null,
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().replace(/\s+/g, ' ')),
        sprung,
        lang: document.documentElement.lang,
        og: ['og:title', 'og:description', 'og:image', 'og:url'].every((n) => meta(n)),
        bilder: [...document.querySelectorAll('img')].map((i) => ({ alt: i.getAttribute('alt'), w: i.getAttribute('width'), h: i.getAttribute('height'), loading: i.loading, prio: i.getAttribute('fetchpriority') })),
        doppelt,
        links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
        text: document.body.innerText,
      };
    });
    alleLinks.set(p, info.links);
    pruefe(`${p}: Titel und Beschreibung`, info.titel && info.beschreibung && info.beschreibung.length >= 70 && info.beschreibung.length <= 170, `„${info.titel}“ (${info.beschreibung?.length} Zeichen Beschreibung)`);
    pruefe(`${p}: Canonical`, info.kanonisch && new URL(info.kanonisch).pathname === p, info.kanonisch);
    pruefe(`${p}: genau eine H1`, info.h1.length === 1, info.h1.join(' | '));
    pruefe(`${p}: Überschriften ohne Ebenensprung`, !info.sprung, info.sprung || 'ok');
    pruefe(`${p}: Sprache de-AT und Open Graph`, info.lang === 'de-AT' && info.og);
    pruefe(`${p}: keine doppelten IDs`, info.doppelt.length === 0, info.doppelt.join(', '));
    pruefe(`${p}: Bilder mit Alt-Text und festen Maßen`, info.bilder.every((b) => b.alt !== null && b.w && b.h), `${info.bilder.length} <img>`);
    const unten = info.bilder.filter((b) => b.prio !== 'high');
    pruefe(`${p}: Bilder unterhalb verzögert geladen`, unten.every((b) => b.loading === 'lazy'), `${unten.length} lazy-Kandidaten`);

    if (p === '/') {
      pruefe('Startseite: Titel laut Vorgabe', info.titel === 'Yaprak Döner in Salzburg | Ali’s Golden Bite');
      pruefe('Startseite: H1 „Yaprak Döner in Salzburg“', info.h1[0] === 'Yaprak Döner in Salzburg');
      const daten = JSON.parse(info.jsonld[0] || '{}');
      const r = (daten['@graph'] || []).find((x) => x['@type'] === 'Restaurant');
      pruefe('JSON-LD: Restaurant vorhanden', Boolean(r));
      if (r) {
        const sichtbar = [r.name, r.telephone, r.address.streetAddress, r.address.postalCode, r.address.addressLocality].every((v) => info.text.includes(v));
        pruefe('JSON-LD: Name, Telefon und Adresse sichtbar auf der Seite', sichtbar);
        pruefe('JSON-LD: Speisekarten-URL', r.hasMenu?.endsWith('/speisekarte'), r.hasMenu);
        const zeitenSichtbar = betrieb.oeffnungszeiten.bestaetigt;
        pruefe('JSON-LD: Öffnungszeiten nur, wenn bestätigt und sichtbar', Boolean(r.openingHoursSpecification) === zeitenSichtbar, zeitenSichtbar ? 'bestätigt' : 'nicht bestätigt → weggelassen');
        await writeFile(path.join(AUSGABE, 'jsonld-startseite.json'), JSON.stringify(daten, null, 2));
      }
    }
  }
  await kontext.close();
}

// ---------- 3. Links ----------
{
  const fehler = [];
  const cache = new Map();
  for (const [seitePfad, links] of alleLinks) {
    for (const href of new Set(links)) {
      if (href.startsWith('tel:')) {
        if (href !== `tel:${betrieb.telefon.link}`) fehler.push(`${seitePfad}: ${href}`);
        continue;
      }
      if (href.startsWith('mailto:')) continue;
      if (/^https?:\/\//.test(href)) continue;
      const url = new URL(href, BASIS + seitePfad);
      const key = url.pathname;
      if (!cache.has(key)) {
        const r = await fetch(BASIS + key);
        cache.set(key, { status: r.status, html: await r.text() });
      }
      const ziel = cache.get(key);
      if (ziel.status !== 200) fehler.push(`${seitePfad}: ${href} → ${ziel.status}`);
      if (url.hash && !ziel.html.includes(`id="${url.hash.slice(1)}"`)) fehler.push(`${seitePfad}: Sprungziel ${href} fehlt`);
    }
  }
  pruefe('Interne Links und Sprungziele erreichbar, Telefonlinks korrekt', fehler.length === 0, fehler.slice(0, 8).join('; ') || `${cache.size} Ziele geprüft`);
  const extern = [...new Set([...alleLinks.values()].flat().filter((h) => /^https?:\/\//.test(h)))];
  const bestell = betrieb.bestellen.anbieter.map((a) => a.url);
  pruefe('Bestelllinks zu Lieferando und Wolt eingebunden', bestell.every((u) => extern.includes(u)), bestell.join(' | '));
  const route = extern.find((h) => h.startsWith('https://www.google.com/maps/dir/'));
  const profil = extern.find((h) => h.startsWith('https://www.google.com/maps/search/'));
  pruefe('„Route planen“ als Google-Maps-Link', Boolean(route), route);
  pruefe('„Google-Bewertungen ansehen“ als Google-Maps-Link', Boolean(profil), profil);
  await writeFile(path.join(AUSGABE, 'externe-links.txt'), extern.join('\n'));
}

// ---------- 4. Breiten: horizontales Scrollen, Aktionsleiste, Überdeckung ----------
for (const { w, h } of BREITEN) {
  const { kontext, seite } = await neueSeite(w, h);
  for (const p of SEITEN) {
    await seite.goto(BASIS + p, { waitUntil: 'networkidle' });
    const name = `${p === '/' ? 'startseite' : p.slice(1)}-${w}`;
    await seite.screenshot({ path: path.join(AUSGABE, `${name}.png`), fullPage: true });
    const r = await seite.evaluate(() => {
      const leiste = document.querySelector('.aktionsleiste');
      const leisteSichtbar = leiste && getComputedStyle(leiste).display !== 'none';
      // Elemente, die breiter als der Bildschirm sind oder Text abschneiden
      const zuBreit = [...document.querySelectorAll('main *, header *, footer *')]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          return b.width > 0 && (b.right > window.innerWidth + 1 || b.left < -1) && !el.closest('.kat-nav__liste') && getComputedStyle(el).position !== 'fixed';
        })
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${el.className}`);
      return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, leisteSichtbar, zuBreit };
    });
    pruefe(`${w}px ${p}: kein horizontales Scrollen`, r.sw <= r.iw && r.zuBreit.length === 0, `${r.sw}/${r.iw} ${r.zuBreit.join(', ')}`);
    if (p === '/') pruefe(`${w}px: Aktionsleiste ${w < 768 ? 'sichtbar' : 'ausgeblendet'}`, r.leisteSichtbar === (w < 768));

    // Rechtliche Links am Seitenende erreichbar und nicht verdeckt
    await seite.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await seite.waitForTimeout(150);
    const verdeckt = await seite.evaluate(() => [...document.querySelectorAll('.fuss a')].filter((a) => {
      a.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      const b = a.getBoundingClientRect();
      const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return !(el === a || a.contains(el));
    }).map((a) => a.textContent.trim()));
    pruefe(`${w}px ${p}: Fußzeilen-Links nicht verdeckt`, verdeckt.length === 0, verdeckt.join(', '));
  }

  // Wichtigste Infos und Aktionen im ersten sichtbaren Bereich (ohne Vorschau-Hinweis)
  if (w < 768) {
    await seite.goto(BASIS + '/', { waitUntil: 'networkidle' });
    await seite.evaluate(() => document.querySelector('.vorschau-banner')?.remove());
    const sichtbar = await seite.evaluate(() => {
      const grenze = document.querySelector('.aktionsleiste').getBoundingClientRect().top;
      const pruef = (sel) => { const e = document.querySelector(sel); const b = e.getBoundingClientRect(); return b.bottom <= grenze && b.top >= 0; };
      return {
        h1: pruef('.hero__titel'),
        buttons: pruef('.hero .knopfreihe'),
        adresse: pruef('.fakten li:nth-child(1)'),
        telefon: pruef('.fakten li:nth-child(2)'),
        zeiten: pruef('.fakten li:nth-child(3)'),
      };
    });
    const fehlt = Object.entries(sichtbar).filter(([, v]) => !v).map(([k]) => k);
    pruefe(`${w}×${h}: Überschrift, Buttons und Kontaktinfos ohne Scrollen sichtbar`, fehlt.length === 0, fehlt.length ? `unterhalb: ${fehlt.join(', ')}` : 'alles sichtbar');
  }
  await kontext.close();
}

// ---------- 5. Tastatur: Fokus sichtbar und nicht verdeckt ----------
for (const { w, h } of [BREITEN[1], BREITEN[3]]) {
  const { kontext, seite } = await neueSeite(w, h);
  for (const p of SEITEN) {
    await seite.goto(BASIS + p, { waitUntil: 'networkidle' });
    const anzahl = await seite.evaluate(() => [...document.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')].filter((e) => e.getClientRects().length && !e.closest('dialog')).length);
    const probleme = [];
    let zuerst = null;
    for (let i = 0; i < anzahl + 2; i++) {
      await seite.keyboard.press('Tab');
      const r = await seite.evaluate(async () => {
        // warten, bis weiches Scrollen zum fokussierten Element abgeschlossen ist
        await new Promise((fertig) => {
          let letzte = -1;
          let gleich = 0;
          const schritt = () => {
            if (scrollY === letzte) { if (++gleich >= 4) return fertig(); } else { gleich = 0; letzte = scrollY; }
            requestAnimationFrame(schritt);
          };
          schritt();
        });
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2;
        const karte = el.closest('.karte');
        const kartenRing = karte && getComputedStyle(karte).outlineStyle !== 'none';
        // bei umbrechenden Links die erste Zeile prüfen
        const b = el.getClientRects()[0] || el.getBoundingClientRect();
        const x = Math.min(Math.max(b.left + b.width / 2, 1), window.innerWidth - 1);
        const y = Math.min(Math.max(b.top + Math.min(b.height / 2, 12), 1), window.innerHeight - 1);
        const oben = document.elementFromPoint(x, y);
        const frei = oben && (oben === el || el.contains(oben) || (karte && karte.contains(oben)));
        return { id: el.outerHTML.slice(0, 80), outline: outline || kartenRing, frei, imBild: b.bottom > 0 && b.top < window.innerHeight };
      });
      if (!r) continue;
      if (zuerst === r.id) break;
      zuerst = zuerst || r.id;
      if (!r.outline) probleme.push(`kein Fokusrahmen: ${r.id}`);
      if (!r.frei || !r.imBild) probleme.push(`verdeckt: ${r.id}`);
    }
    pruefe(`${w}px ${p}: Tastaturfokus sichtbar und nicht verdeckt`, probleme.length === 0, probleme.slice(0, 3).join(' | ') || `${anzahl} Elemente`);
  }
  // Sprunglink
  await seite.goto(BASIS + '/', { waitUntil: 'networkidle' });
  await seite.keyboard.press('Tab');
  const skip = await seite.evaluate(() => document.activeElement.classList.contains('skip-link'));
  await seite.keyboard.press('Enter');
  const imMain = await seite.evaluate(() => document.activeElement.id === 'inhalt');
  pruefe(`${w}px: „Zum Inhalt springen“ als erstes Element und funktionsfähig`, skip && imMain);
  await kontext.close();
}

// ---------- 6. Dialoge ----------
{
  const { kontext, seite } = await neueSeite(390, 844);
  await seite.goto(BASIS + '/', { waitUntil: 'networkidle' });
  const offen = (id) => seite.evaluate((i) => document.getElementById(i).open, id);
  const fokusIn = (id) => seite.evaluate((i) => document.getElementById(i).contains(document.activeElement), id);

  // Navigationsdialog per Tastatur
  await seite.focus('.kopf__menue');
  await seite.keyboard.press('Enter');
  pruefe('Navigation: öffnet per Enter', await offen('dialog-navigation'));
  pruefe('Navigation: Fokus im Dialog', await fokusIn('dialog-navigation'));
  let bleibtDrin = true;
  for (let i = 0; i < 12; i++) {
    await seite.keyboard.press('Tab');
    const drin = await seite.evaluate(() => !document.activeElement || document.activeElement === document.body || document.getElementById('dialog-navigation').contains(document.activeElement));
    if (!drin) bleibtDrin = false;
  }
  pruefe('Navigation: Tab bleibt im geöffneten Dialog', bleibtDrin);
  const schliessenSichtbar = await seite.isVisible('#dialog-navigation .dialog__schliessen');
  pruefe('Navigation: sichtbarer Schließen-Button', schliessenSichtbar);
  await seite.keyboard.press('Escape');
  pruefe('Navigation: schließt mit Escape', !(await offen('dialog-navigation')));
  pruefe('Navigation: Fokus zurück auf Menü-Button', await seite.evaluate(() => document.activeElement.classList.contains('kopf__menue')));
  await seite.click('.kopf__menue');
  await seite.click('#dialog-navigation .dialog__schliessen');
  pruefe('Navigation: schließt mit Schließen-Button', !(await offen('dialog-navigation')));
  await seite.click('.kopf__menue');
  await seite.click('#dialog-navigation a[href="#kontakt"]');
  await seite.waitForTimeout(900);
  const kontaktSichtbar = await seite.evaluate(() => {
    const b = document.getElementById('kontakt').getBoundingClientRect();
    return b.top < window.innerHeight && b.bottom > 0 && location.hash === '#kontakt';
  });
  pruefe('Navigation: Link „Kontakt“ schließt Dialog und springt zum Abschnitt', !(await offen('dialog-navigation')) && kontaktSichtbar);

  // Bestell-Dialog über Leertaste (Link mit Button-Rolle)
  await seite.goto(BASIS + '/', { waitUntil: 'networkidle' });
  await seite.focus('.hero .btn--gold');
  await seite.keyboard.press(' ');
  pruefe('Online bestellen: öffnet Anbieterauswahl (Leertaste)', await offen('dialog-bestellen'));
  const anbieter = await seite.$$eval('#dialog-bestellen .anbieter-link', (as) => as.map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim().replace(/\s+/g, ' ') })));
  const erwartet = betrieb.bestellen.anbieter.map((a) => a.url);
  pruefe('Online bestellen: Anbieter-Buttons mit Namen und geprüften Links', anbieter.length === erwartet.length && anbieter.every((a, i) => a.href === erwartet[i] && a.text.includes(betrieb.bestellen.anbieter[i].name)), anbieter.map((a) => a.text).join(' | '));
  await seite.keyboard.press('Escape');
  pruefe('Online bestellen: Escape schließt, Fokus zurück', !(await offen('dialog-bestellen')) && (await seite.evaluate(() => document.activeElement.matches('.hero .btn--gold'))));

  // Aktionsleiste
  await seite.click('.aktionsleiste__item--gold');
  pruefe('Aktionsleiste „Bestellen“: öffnet Anbieterauswahl', await offen('dialog-bestellen'));
  await seite.mouse.click(195, 30);
  pruefe('Bestell-Dialog: Klick auf Hintergrund schließt', !(await offen('dialog-bestellen')));
  const leiste = await seite.$$eval('.aktionsleiste a', (as) => as.map((a) => a.getAttribute('href')));
  pruefe('Aktionsleiste: Speisekarte und Anrufen verlinkt', leiste.includes('/speisekarte') && leiste.includes(`tel:${betrieb.telefon.link}`), leiste.join(' | '));

  // Aus dem Navigationsdialog direkt zum Bestellen
  await seite.click('.kopf__menue');
  await seite.click('#dialog-navigation [data-dialog-open="bestellen"]');
  pruefe('Navigation → Online bestellen: wechselt in die Anbieterauswahl', !(await offen('dialog-navigation')) && (await offen('dialog-bestellen')));
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(50);
  pruefe('Navigation → Bestellen → Escape: Fokus zurück auf Menü-Button', await seite.evaluate(() => document.activeElement.classList.contains('kopf__menue')));

  // Ohne JavaScript: Links führen zum Abschnitt
  const { kontext: k2, seite: s2 } = await neueSeite(390, 844, { javaScriptEnabled: false });
  await s2.goto(BASIS + '/speisekarte', { waitUntil: 'networkidle' });
  await s2.click('.aktionsleiste__item--gold');
  await s2.waitForLoadState('networkidle');
  pruefe('Ohne JavaScript: „Bestellen“ führt zum Bestellbereich', s2.url().endsWith('/#bestellen'), s2.url());
  await k2.close();
  await kontext.close();

  // Desktop: Kopfzeilen-Button
  const { kontext: k3, seite: s3 } = await neueSeite(1440, 900);
  await s3.goto(BASIS + '/speisekarte', { waitUntil: 'networkidle' });
  await s3.click('.kopf__bestellen');
  pruefe('1440px: Kopfzeilen-Button „Online bestellen“ öffnet Anbieterauswahl', await s3.evaluate(() => document.getElementById('dialog-bestellen').open));
  await s3.keyboard.press('Escape');
  await s3.click('.kat-nav a[href="#pizza"]');
  await s3.waitForTimeout(900);
  const pizza = await s3.evaluate(() => {
    const b = document.getElementById('kat-pizza').getBoundingClientRect();
    const kopf = document.querySelector('.kopf').getBoundingClientRect().bottom;
    return { sichtbar: b.top >= kopf - 1 && b.top < window.innerHeight / 2, aktiv: document.querySelector('.kat-nav a[href="#pizza"]').getAttribute('aria-current') };
  });
  pruefe('Speisekarte: Kategorie anspringen, Überschrift nicht unter der Kopfzeile', pizza.sichtbar, JSON.stringify(pizza));
  pruefe('Speisekarte: aktive Kategorie markiert', pizza.aktiv === 'true');
  await k3.close();

  const { kontext: k4, seite: s4 } = await neueSeite(390, 844);
  await s4.goto(BASIS + '/speisekarte', { waitUntil: 'networkidle' });
  await s4.click('.kat-nav a[href="#getraenke"]');
  await s4.waitForTimeout(900);
  const getraenke = await s4.evaluate(() => {
    const b = document.getElementById('kat-getraenke').getBoundingClientRect();
    const nav = document.querySelector('.kat-nav').getBoundingClientRect().bottom;
    return b.top >= nav - 1 && b.top < window.innerHeight / 2;
  });
  pruefe('390px Speisekarte: Kategorie anspringen, Überschrift unter der Kategorieleiste sichtbar', getraenke);
  await k4.close();
}

// ---------- 7. Bewegung reduzieren ----------
{
  const { kontext, seite } = await neueSeite(390, 844, { reducedMotion: 'reduce' });
  await seite.goto(BASIS + '/', { waitUntil: 'networkidle' });
  const r = await seite.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    transition: getComputedStyle(document.querySelector('.btn')).transitionDuration,
  }));
  pruefe('Reduzierte Bewegung: keine Animationen und kein weiches Scrollen', r.scroll === 'auto' && r.transition.split(',').every((d) => parseFloat(d) < 0.001), JSON.stringify(r));
  await kontext.close();
}

// ---------- 8. Barrierefreiheit mit axe-core (WCAG 2.2 A/AA) ----------
{
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
  const bericht = {};
  for (const { w, h } of [BREITEN[1], BREITEN[3]]) {
    // bypassCSP nur, damit das Prüfskript axe-core in die Seite laden darf
    const { kontext, seite } = await neueSeite(w, h, { bypassCSP: true });
    for (const p of [...SEITEN, '/404']) {
      await seite.goto(BASIS + (p === '/404' ? '/gibt-es-nicht' : p), { waitUntil: 'networkidle' });
      await seite.addScriptTag({ content: axeQuelle });
      const verstoesse = await seite.evaluate(async (t) => (await window.axe.run(document, { runOnly: { type: 'tag', values: t } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, beispiel: v.nodes[0]?.target.join(' ') })), tags);
      bericht[`${w}${p}`] = verstoesse;
      pruefe(`axe ${w}px ${p}: keine WCAG-Verstöße`, verstoesse.length === 0, verstoesse.map((v) => `${v.id} (${v.n}× z. B. ${v.beispiel})`).join('; '));
    }
    // geöffneter Dialog
    await seite.goto(BASIS + '/', { waitUntil: 'networkidle' });
    await seite.click(w < 768 ? '.aktionsleiste__item--gold' : '.kopf__bestellen');
    await seite.waitForTimeout(500); // Einblend-Animation abwarten
    await seite.addScriptTag({ content: axeQuelle });
    const dialog = await seite.evaluate(async (t) => (await window.axe.run('#dialog-bestellen', { runOnly: { type: 'tag', values: t } })).violations.map((v) => `${v.id} ${v.nodes[0]?.target.join(' ')}`), tags);
    pruefe(`axe ${w}px: geöffnete Anbieterauswahl ohne Verstöße`, dialog.length === 0, dialog.join('; '));
    await kontext.close();
  }
  await writeFile(path.join(AUSGABE, 'axe-bericht.json'), JSON.stringify(bericht, null, 2));
}

pruefe('Keine JavaScript-Fehler oder CSP-Verstöße in der Konsole', konsolenFehler.length === 0, konsolenFehler.slice(0, 3).join(' | '));

await browser.close();
const fehlgeschlagen = ergebnisse.filter((e) => !e.ok);
await writeFile(path.join(AUSGABE, 'ergebnis.json'), JSON.stringify({ datum: new Date().toISOString(), basis: BASIS, ergebnisse }, null, 2));
console.log(`\n${ergebnisse.length - fehlgeschlagen.length} von ${ergebnisse.length} Prüfungen bestanden. Bildschirmfotos und Berichte: test-ergebnisse/`);
process.exit(fehlgeschlagen.length ? 1 : 0);
