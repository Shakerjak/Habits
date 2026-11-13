// Wiederverwendbare Bausteine für alle Seiten.
import { html, raw, attr } from './html.mjs';
import { marker, ohneMarker, formatZeiten, WOCHENTAGE, telLink, mapsLinks } from './daten.mjs';

// ---------- Icons (eigene, einfache Strich-Icons) ----------

const ICON_PFADE = {
  telefon: '<path d="M6.6 3.5h2.6l1.4 4.1-2 1.3a12 12 0 0 0 6.5 6.5l1.3-2 4.1 1.4v2.6a2.1 2.1 0 0 1-2.3 2.1A17.5 17.5 0 0 1 4.5 5.8a2.1 2.1 0 0 1 2.1-2.3Z"/>',
  ort: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  uhr: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  tasche: '<path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
  karte: '<path d="M6 3.5h12v17H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  menue: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  schliessen: '<path d="M6 6l12 12M18 6 6 18"/>',
  pfeil: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  extern: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  route: '<path d="M4 11.5 20 4l-7.5 16-2-6.5-6.5-2Z"/>',
  sprechblase: '<path d="M4 5.5h16v10H10l-4 3.5v-3.5H4z"/>',
  scharf: '<path d="M14.5 4.5c-.5 1.5.5 2.5 1.5 2.5M8 20c6 0 10-5 9-11-1-2-4-2-5.5 0C10 11 9 13 6.5 14.5 4 16 5 20 8 20Z"/>',
};

export function icon(name, klasse = 'icon') {
  return raw(`<svg class="${klasse}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PFADE[name]}</svg>`);
}

// ---------- Texte mit Platzhalter-Markierung ----------

// Gibt Text aus. „OFFEN:“ und „PRÜFEN:“ werden in der Vorschau sichtbar markiert.
export function txt(ctx, wert) {
  const m = marker(wert);
  if (!m) return html`${wert}`;
  if (ctx.modus === 'live') throw new Error(`Platzhalter in Live-Version: ${wert}`);
  if (m === 'offen') {
    return html`<mark class="ph ph--offen"><span class="ph__label">Platzhalter</span> ${ohneMarker(wert)}</mark>`;
  }
  return html`<span class="ph ph--pruefen">${ohneMarker(wert)} <span class="ph__label">prüfen</span></span>`;
}

export function platzhalterBlock(ctx, text) {
  if (ctx.modus === 'live') throw new Error(`Platzhalter in Live-Version: ${text}`);
  return html`<p class="ph ph--offen ph--block"><span class="ph__label">Platzhalter</span> ${text}</p>`;
}

// Hinweis, der nur in der Vorschau erscheint (z. B. „Vorlage, bitte prüfen“).
export function vorschauHinweis(ctx, text) {
  if (ctx.modus !== 'vorschau') return '';
  return html`<p class="ph ph--pruefen ph--block"><span class="ph__label">Hinweis Vorschau</span> ${text}</p>`;
}

// Zeile einer Definitionsliste; null-Werte entfallen.
export function zeile(ctx, begriff, wert) {
  if (wert === null || wert === undefined || wert === '') return '';
  return html`<div><dt>${begriff}</dt><dd>${typeof wert === 'string' ? txt(ctx, wert) : wert}</dd></div>`;
}

// ---------- Wortmarke ----------

export function wortmarke(ctx, { gross = false } = {}) {
  const { betrieb } = ctx;
  if (betrieb.logo) {
    return html`<img class="logo${gross ? ' logo--gross' : ''}" src="${betrieb.logo}" alt="${betrieb.name}" width="160" height="48">`;
  }
  return html`<span class="wortmarke${gross ? ' wortmarke--gross' : ''}">${zeichen('wortmarke__zeichen')}<span class="wortmarke__schrift"><span class="wortmarke__ali">Ali’s</span><span class="wortmarke__haupt"><span class="wortmarke__gold">Golden</span> Bite</span></span></span>`;
}

// Bildzeichen: goldene Scheibe mit Bissspur (auch Grundlage für Favicon und OG-Bild).
export const ZEICHEN_PFAD = 'M18.62 3.27A13 13 0 1 0 28.98 15.23A4.2 4.2 0 0 1 24.24 9.37A4.6 4.6 0 0 1 18.62 3.27Z';
export function zeichen(klasse) {
  return raw(`<svg class="${klasse}" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false"><path fill="currentColor" d="${ZEICHEN_PFAD}"/></svg>`);
}

// ---------- Bilder ----------

// ratio: '4x3' | 'hero'; sizes: sizes-Attribut; prioritaet: true für das Einstiegsbild.
export function bild(ctx, slot, { sizes = '100vw', ratio = '4x3', prioritaet = false, klasse = '' } = {}) {
  const daten = ctx.bildDaten[slot];
  const info = ctx.bilder[slot];
  const rahmen = `media media--${ratio}${klasse ? ` ${klasse}` : ''}`;
  if (daten) {
    const freigabeHinweis = !daten.freigegeben && ctx.modus === 'vorschau'
      ? html`<span class="ph ph--offen media__badge"><span class="ph__label">Freigabe offen</span></span>`
      : '';
    const alt = marker(info.alt) ? ohneMarker(info.alt) : info.alt;
    return html`<div class="${rahmen}"><picture>${daten.quellen.map((q) => html`<source type="${q.typ}" srcset="${q.srcset}" sizes="${sizes}">`)}<img src="${daten.fallback}" srcset="${daten.jpgSrcset}" sizes="${sizes}" width="${daten.breite}" height="${daten.hoehe}" alt="${alt}"${attr('loading', prioritaet ? 'eager' : 'lazy')}${attr('fetchpriority', prioritaet ? 'high' : null)} decoding="${prioritaet ? 'sync' : 'async'}"></picture>${freigabeHinweis}</div>`;
  }
  if (ctx.modus === 'live') {
    // Ohne Foto: neutrale Fläche im Markenstil, rein dekorativ.
    return html`<div class="${rahmen} media--leer" aria-hidden="true"></div>`;
  }
  return html`<div class="${rahmen} media--platzhalter" role="img" aria-label="Foto-Platzhalter: ${info.platzhalter}">
    <span class="media__ph">
      <span class="media__ph-label">Foto-Platzhalter</span>
      <span class="media__ph-text">${info.platzhalter}</span>
      <span class="media__ph-hinweis">Freigegebenes Originalfoto in bilder/ ablegen</span>
    </span>
  </div>`;
}

// ---------- Öffnungszeiten ----------

export function zeitenDaten(ctx) {
  const oz = ctx.betrieb.oeffnungszeiten;
  if (!oz?.bestaetigt) return null;
  return JSON.stringify(WOCHENTAGE.map((tag) => oz.tage[tag] || []));
}

export function oeffnungszeitenTabelle(ctx, { kompakt = false } = {}) {
  const { betrieb, texte } = ctx;
  const oz = betrieb.oeffnungszeiten;
  if (!oz?.bestaetigt) {
    return platzhalterBlock(ctx, 'Öffnungszeiten vom Betrieb bestätigen. Die Angaben auf Wolt und Lieferando weichen voneinander ab.');
  }
  return html`<table class="zeiten${kompakt ? ' zeiten--kompakt' : ''}">
    <caption class="visually-hidden">${texte.startseite.kontakt.zeiten_titel}</caption>
    <tbody>${WOCHENTAGE.map((tag, i) => html`<tr data-tag="${i}"><th scope="row">${texte.allgemein.wochentage[i]}</th><td>${formatZeiten(oz.tage[tag], texte)}</td></tr>`)}</tbody>
  </table>${oz.hinweis ? html`<p class="zeiten__hinweis">${txt(ctx, oz.hinweis)}</p>` : ''}`;
}

// Kurzinfo „Heute: …“ – wird per JavaScript mit dem aktuellen Wochentag (Europe/Vienna) befüllt.
export function heuteInfo(ctx) {
  const { texte } = ctx;
  if (!ctx.betrieb.oeffnungszeiten?.bestaetigt) {
    return html`<a href="/#kontakt">${texte.startseite.kontakt.zeiten_titel}</a> ${txt(ctx, 'OFFEN: folgen')}`;
  }
  return html`<a href="/#kontakt" data-heute data-label-heute="${texte.allgemein.heute}" data-label-geschlossen="${texte.allgemein.geschlossen}" data-label-uhr="${texte.allgemein.uhr}">${texte.startseite.kontakt.zeiten_titel}</a>`;
}

// ---------- Adresse, Telefon ----------

export function adresseZeilen(ctx) {
  const { betrieb } = ctx;
  return html`${betrieb.adresse.strasse}<br>${betrieb.adresse.plz} ${betrieb.adresse.ort}`;
}

export function telefonLink(ctx, klasse = '') {
  const { betrieb } = ctx;
  return html`<a${attr('class', klasse || null)} href="${telLink(betrieb)}">${betrieb.telefon.anzeige}</a>`;
}

export function routeLink(ctx) {
  return mapsLinks(ctx.betrieb).route;
}

// ---------- Bestellanbieter ----------

export function anbieterOptionen(ctx, anbieter) {
  if (Array.isArray(anbieter.optionen)) {
    return html`<ul class="tags" aria-label="Angebot bei ${anbieter.name}">${anbieter.optionen.map((o) => html`<li class="tag">${o}</li>`)}</ul>`;
  }
  return html`<p class="tags">${txt(ctx, anbieter.optionen)}</p>`;
}

export function bestellButtonText(ctx, anbieter) {
  return ctx.texte.startseite.bestellen.button_vorlage.replace('{anbieter}', anbieter.name);
}
