// Speisekarte „/speisekarte“
import { html } from '../lib/html.mjs';
import { icon, txt, platzhalterBlock, telefonLink } from '../lib/bausteine.mjs';
import { formatPreis, marker, ohneMarker, telLink } from '../lib/daten.mjs';

function preis(ctx, wert) {
  if (typeof wert === 'number') return html`${formatPreis(wert)}`;
  if (ctx.modus === 'live') throw new Error('Preis fehlt in Live-Version');
  return html`<mark class="ph ph--offen ph--klein"><span class="ph__label">Preis offen</span></mark>`;
}

function allergene(ctx, g) {
  const { karte, texte } = ctx;
  const s = texte.speisekarte;
  if (!Array.isArray(g.allergene)) {
    if (ctx.modus === 'live') throw new Error('Allergene fehlen in Live-Version');
    return html`<span class="gericht__allergene"><mark class="ph ph--offen ph--klein"><span class="ph__label">Allergene offen</span></mark></span>`;
  }
  if (g.allergene.length === 0) return html`<span class="gericht__allergene">${s.allergene_keine}</span>`;
  const namen = g.allergene.map((a) => karte.allergene[a]).join(', ');
  return html`<span class="gericht__allergene"><span class="visually-hidden">${s.allergene_label}: ${namen}</span><span aria-hidden="true">${s.allergene_label}: ${g.allergene.join(' · ')}</span></span>`;
}

function gericht(ctx, g) {
  const s = ctx.texte.speisekarte;
  const mehrerePreise = Array.isArray(g.preis);
  return html`<li class="gericht" id="gericht-${g.id}">
  <div class="gericht__kopf">
    <h3 class="gericht__name">${g.name}${(g.kennzeichnung || []).map((k) => html` <span class="gericht__tag gericht__tag--${k}">${k === 'scharf' ? icon('scharf', 'icon icon--klein') : ''}${k}</span>`)}</h3>
    ${mehrerePreise ? '' : html`<p class="gericht__preis"><span class="visually-hidden">Preis: </span>${preis(ctx, g.preis)}</p>`}
  </div>
  ${g.beschreibung ? html`<p class="gericht__beschreibung">${txt(ctx, g.beschreibung)}</p>` : ''}
  ${mehrerePreise ? html`<dl class="gericht__groessen">${g.preis.map((v) => html`<div><dt>${v.bezeichnung}</dt><dd>${preis(ctx, v.preis)}</dd></div>`)}</dl>` : ''}
  ${(g.optionen || []).map((o) => html`<p class="gericht__option"><span class="gericht__option-label">${s.menue_option}:</span> ${o.bezeichnung} <span class="gericht__aufpreis">${typeof o.aufpreis === 'number' ? `+ ${formatPreis(o.aufpreis)}` : preis(ctx, o.aufpreis)}</span></p>`)}
  <p class="gericht__meta">${allergene(ctx, g)}</p>
</li>`;
}

export function speisekarte(ctx) {
  const { karte, texte, betrieb } = ctx;
  const s = texte.speisekarte;

  const entwurfHinweis = !karte.bestaetigt && ctx.modus === 'vorschau'
    ? platzhalterBlock(ctx, 'Entwurf: Gerichte und Beschreibungen stammen aus den öffentlichen Einträgen auf Wolt und Lieferando (Stand 13.11.2026). Preise und Allergene folgen nach Bestätigung durch den Betrieb – Plattformpreise können vom Lokal abweichen.')
    : '';

  const kopf = html`<section class="seitenkopf thema-dunkel" aria-labelledby="karte-titel">
  <div class="container">
    <h1 class="seitenkopf__titel" id="karte-titel"><span class="dachzeile">${s.dachzeile}</span> ${s.ueberschrift}</h1>
    <p class="seitenkopf__text">${s.text}</p>
    <p class="seitenkopf__stand">${s.stand}: ${txt(ctx, karte.stand)}${karte.pdf ? html` · <a href="${karte.pdf}" download>${s.pdf}</a>` : ''}</p>
    ${entwurfHinweis}
  </div>
</section>`;

  const navigation = html`<nav class="kat-nav" aria-label="${s.kategorien_label}">
  <ul class="kat-nav__liste">${karte.kategorien.map((k) => html`<li><a href="#${k.id}">${k.name}</a></li>`)}<li><a href="#allergene">${s.allergene_label}</a></li></ul>
</nav>`;

  const kategorien = karte.kategorien.map((k) => html`<section class="kategorie" id="${k.id}" aria-labelledby="kat-${k.id}">
  <h2 class="kategorie__titel" id="kat-${k.id}">${k.name}</h2>
  ${k.intro ? html`<p class="kategorie__intro">${txt(ctx, k.intro)}</p>` : ''}
  ${k.zusatz ? (marker(k.zusatz) === 'offen' ? platzhalterBlock(ctx, ohneMarker(k.zusatz)) : html`<p class="kategorie__intro">${txt(ctx, k.zusatz)}</p>`) : ''}
  <ul class="gerichte">${k.gerichte.map((g) => gericht(ctx, g))}</ul>
</section>`);

  const legende = html`<section class="kategorie allergene" id="allergene" aria-labelledby="allergene-titel">
  <h2 class="kategorie__titel" id="allergene-titel">${s.allergene_ueberschrift}</h2>
  <p class="kategorie__intro">${s.allergene_text}</p>
  <dl class="allergene__liste">${Object.entries(karte.allergene).map(([code, name]) => html`<div><dt>${code}</dt><dd>${name}</dd></div>`)}</dl>
  <p class="allergene__frage">${s.allergene_frage} ${telefonLink(ctx)}</p>
</section>`;

  const cta = html`<section class="abschnitt abschnitt--schmal thema-dunkel" aria-labelledby="karte-cta-titel">
  <div class="container band band--ohne-icon">
    <div class="band__text">
      <h2 class="band__titel" id="karte-cta-titel">${s.cta_ueberschrift}</h2>
      <p>${s.cta_text}</p>
    </div>
    <div class="knopfreihe">
      <a class="btn btn--gold" href="/#bestellen" data-dialog-open="bestellen">${icon('tasche')}<span>${texte.navigation.online_bestellen}</span></a>
      <a class="btn btn--rand-hell" href="${telLink(betrieb)}">${icon('telefon')}<span>${texte.aktionsleiste.anrufen}</span></a>
    </div>
  </div>
</section>`;

  return {
    pfad: '/speisekarte',
    aktiv: 'speisekarte',
    titel: s.titel,
    beschreibung: s.beschreibung,
    indexieren: true,
    kanonisch: true,
    inhalt: html`${kopf}
<div class="karte-layout thema-hell">
  <div class="container karte-layout__raster">
    ${navigation}
    <div class="karte-layout__inhalt">${kategorien}${legende}</div>
  </div>
</div>
${cta}`,
  };
}
