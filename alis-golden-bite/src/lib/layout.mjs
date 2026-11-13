// Grundgerüst jeder Seite: Kopf, Navigation, Dialoge, Aktionsleiste und Fußzeile.
import { html, raw, attr } from './html.mjs';
import { icon, wortmarke, adresseZeilen, telefonLink, oeffnungszeitenTabelle, anbieterOptionen, bestellButtonText, txt, zeitenDaten } from './bausteine.mjs';
import { telLink } from './daten.mjs';

function absolut(ctx, pfad) {
  return `${ctx.basisUrl}${pfad}`;
}

function kopfMeta(ctx, seite) {
  const { texte, betrieb } = ctx;
  const og = ctx.ogBild;
  return html`
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${seite.titel}</title>
<meta name="description" content="${seite.beschreibung}">
${seite.indexieren && ctx.modus === 'live' ? '' : raw('<meta name="robots" content="noindex, nofollow">\n')}${seite.kanonisch ? html`<link rel="canonical" href="${absolut(ctx, seite.pfad)}">` : ''}
<meta name="theme-color" content="#171614">
<meta name="format-detection" content="telephone=no">
<link rel="preload" href="/fonts/barlow-condensed-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/dm-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
${seite.vorladen || ''}
<link rel="stylesheet" href="${ctx.assets.css}">
<script src="${ctx.assets.js}" defer></script>
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${betrieb.name}">
<meta property="og:locale" content="${texte.og_locale}">
<meta property="og:title" content="${seite.ogTitel || seite.titel}">
<meta property="og:description" content="${seite.beschreibung}">
<meta property="og:url" content="${absolut(ctx, seite.pfad)}">
<meta property="og:image" content="${absolut(ctx, og.url)}">
<meta property="og:image:type" content="${og.typ}">
<meta property="og:image:width" content="${og.breite}">
<meta property="og:image:height" content="${og.hoehe}">
<meta property="og:image:alt" content="${og.alt}">
<meta name="twitter:card" content="summary_large_image">
${seite.jsonld ? raw(`<script type="application/ld+json">${JSON.stringify(seite.jsonld, null, 1).replace(/</g, '\\u003c')}</script>`) : ''}`;
}

function vorschauBanner(ctx) {
  if (ctx.modus !== 'vorschau') return '';
  const blockierend = ctx.probleme.filter((p) => p.blockiert).length;
  return html`<div class="vorschau-banner" role="note">
  <div class="container"><strong>Vorschau – nicht veröffentlichen.</strong> Gelb markierte Stellen sind Platzhalter oder noch zu prüfen. <a href="/offene-punkte">${blockierend} offene Punkte ansehen</a></div>
</div>`;
}

function kopfzeile(ctx, aktiv) {
  const { texte } = ctx;
  const n = texte.navigation;
  const istStart = aktiv === 'start';
  const bestellHref = istStart ? '#bestellen' : '/#bestellen';
  const links = [
    { id: 'speisekarte', href: '/speisekarte', text: n.speisekarte },
    { id: 'bestellung', href: bestellHref, text: n.bestellung },
    { id: 'kontakt', href: istStart ? '#kontakt' : '/#kontakt', text: n.kontakt },
  ];
  return html`<header class="kopf">
  <div class="container kopf__innen">
    <a class="kopf__marke" href="/"${attr('aria-current', istStart ? 'page' : null)}><span class="visually-hidden">${ctx.betrieb.name} – ${n.startseite}</span><span aria-hidden="true">${wortmarke(ctx)}</span></a>
    <nav class="kopf__nav" aria-label="Hauptnavigation">
      <ul>${links.map((l) => html`<li><a href="${l.href}"${attr('aria-current', aktiv === l.id ? 'page' : null)}>${l.text}</a></li>`)}</ul>
    </nav>
    <a class="btn btn--gold btn--klein kopf__bestellen" href="${bestellHref}" data-dialog-open="bestellen">${icon('tasche')}<span>${n.online_bestellen}</span></a>
    <a class="kopf__menue" href="#fuss-navigation" data-dialog-open="navigation">${icon('menue')}<span>${n.menue_oeffnen}</span></a>
  </div>
</header>`;
}

function navigationsDialog(ctx, aktiv) {
  const { texte } = ctx;
  const n = texte.navigation;
  const istStart = aktiv === 'start';
  return html`<dialog class="dialog dialog--nav" id="dialog-navigation" aria-labelledby="dialog-navigation-titel">
  <div class="dialog__panel">
    <div class="dialog__kopf">
      <h2 class="visually-hidden" id="dialog-navigation-titel">Navigation</h2>
      <span aria-hidden="true">${wortmarke(ctx)}</span>
      <button class="dialog__schliessen" type="button" data-dialog-close>${icon('schliessen')}<span>${n.schliessen}</span></button>
    </div>
    <nav aria-label="Hauptnavigation">
      <ul class="dialog-nav">
        <li><a href="/"${attr('aria-current', istStart ? 'page' : null)}>${n.startseite}</a></li>
        <li><a href="/speisekarte"${attr('aria-current', aktiv === 'speisekarte' ? 'page' : null)}>${n.speisekarte}</a></li>
        <li><a href="${istStart ? '#bestellen' : '/#bestellen'}">${n.bestellung}</a></li>
        <li><a href="${istStart ? '#kontakt' : '/#kontakt'}">${n.kontakt}</a></li>
      </ul>
    </nav>
    <div class="dialog__aktionen">
      <a class="btn btn--gold" href="${istStart ? '#bestellen' : '/#bestellen'}" data-dialog-open="bestellen">${icon('tasche')}<span>${n.online_bestellen}</span></a>
      <a class="btn btn--rand-hell" href="${telLink(ctx.betrieb)}">${icon('telefon')}<span>${texte.aktionsleiste.anrufen}</span></a>
    </div>
    <address class="dialog__adresse">${ctx.betrieb.name}<br>${adresseZeilen(ctx)}</address>
  </div>
</dialog>`;
}

function bestellDialog(ctx) {
  const { betrieb, texte } = ctx;
  return html`<dialog class="dialog dialog--bestellen" id="dialog-bestellen" aria-labelledby="dialog-bestellen-titel" aria-describedby="dialog-bestellen-text">
  <div class="dialog__panel">
    <div class="dialog__kopf">
      <h2 class="dialog__titel" id="dialog-bestellen-titel">${texte.navigation.online_bestellen}</h2>
      <button class="dialog__schliessen" type="button" data-dialog-close>${icon('schliessen')}<span>${texte.navigation.schliessen}</span></button>
    </div>
    <p id="dialog-bestellen-text">${texte.startseite.bestellen.text}</p>
    <ul class="anbieter-liste">${betrieb.bestellen.anbieter.map((a) => html`<li>
      <a class="anbieter-link" href="${a.url}">
        <span class="anbieter-link__name">${bestellButtonText(ctx, a)}</span>
        ${icon('extern', 'icon anbieter-link__icon')}
      </a>
      ${anbieterOptionen(ctx, a)}
    </li>`)}</ul>
    <p class="dialog__hinweis">${betrieb.bestellen.hinweis}</p>
    <p class="dialog__alternativ">${texte.startseite.bestellen.lokal_titel}: ${betrieb.adresse.strasse} · ${telefonLink(ctx)}</p>
  </div>
</dialog>`;
}

function aktionsleiste(ctx, aktiv) {
  const { texte, betrieb } = ctx;
  const a = texte.aktionsleiste;
  return html`<nav class="aktionsleiste" aria-label="Schnellzugriff">
  <a class="aktionsleiste__item aktionsleiste__item--gold" href="${aktiv === 'start' ? '#bestellen' : '/#bestellen'}" data-dialog-open="bestellen">${icon('tasche')}<span>${a.bestellen}</span></a>
  <a class="aktionsleiste__item" href="/speisekarte"${attr('aria-current', aktiv === 'speisekarte' ? 'page' : null)}>${icon('karte')}<span>${a.speisekarte}</span></a>
  <a class="aktionsleiste__item" href="${telLink(betrieb)}">${icon('telefon')}<span>${a.anrufen}</span></a>
</nav>`;
}

function fusszeile(ctx, aktiv) {
  const { texte, betrieb } = ctx;
  const n = texte.navigation;
  const istStart = aktiv === 'start';
  return html`<footer class="fuss thema-dunkel">
  <div class="container fuss__raster">
    <div class="fuss__marke">
      <a class="fuss__logo" href="/"><span class="visually-hidden">${betrieb.name} – ${n.startseite}</span><span aria-hidden="true">${wortmarke(ctx, { gross: true })}</span></a>
      <p>${texte.allgemein.fusszeile_text}</p>
    </div>
    <div class="fuss__block">
      <h2 class="fuss__titel">${n.kontakt}</h2>
      <address>${betrieb.name}<br>${adresseZeilen(ctx)}<br>${betrieb.adresse.land}</address>
      <p>${telefonLink(ctx)}</p>
      ${betrieb.email && !String(betrieb.email).startsWith('OFFEN') ? html`<p><a href="mailto:${betrieb.email}">${betrieb.email}</a></p>` : ''}
    </div>
    <div class="fuss__block">
      <h2 class="fuss__titel">${texte.startseite.kontakt.zeiten_titel}</h2>
      ${oeffnungszeitenTabelle(ctx, { kompakt: true })}
    </div>
    <nav class="fuss__block" id="fuss-navigation" aria-label="Fußzeile">
      <h2 class="fuss__titel">Seiten</h2>
      <ul class="fuss__links">
        <li><a href="/speisekarte"${attr('aria-current', aktiv === 'speisekarte' ? 'page' : null)}>${n.speisekarte}</a></li>
        <li><a href="${istStart ? '#bestellen' : '/#bestellen'}">${n.online_bestellen}</a></li>
        <li><a href="${istStart ? '#kontakt' : '/#kontakt'}">${n.kontakt}</a></li>
        <li><a href="/impressum"${attr('aria-current', aktiv === 'impressum' ? 'page' : null)}>${texte.allgemein.impressum}</a></li>
        <li><a href="/datenschutz"${attr('aria-current', aktiv === 'datenschutz' ? 'page' : null)}>${texte.allgemein.datenschutz}</a></li>
      </ul>
    </nav>
  </div>
  <div class="container fuss__unten">
    <p>© ${ctx.jahr} ${betrieb.name}</p>
    <p class="fuss__recht"><a href="/impressum">${texte.allgemein.impressum}</a><a href="/datenschutz">${texte.allgemein.datenschutz}</a></p>
  </div>
</footer>`;
}

export function seitenGeruest(ctx, seite) {
  const zeiten = zeitenDaten(ctx);
  return `<!doctype html>
<html lang="${ctx.texte.sprache}">
<head>${kopfMeta(ctx, seite)}
</head>
<body class="seite seite--${seite.aktiv}"${zeiten ? ` data-zeiten="${zeiten.replace(/"/g, '&quot;')}"` : ''}>
<a class="skip-link" href="#inhalt">${ctx.texte.navigation.zum_inhalt}</a>
${vorschauBanner(ctx)}
${kopfzeile(ctx, seite.aktiv)}
<main id="inhalt" tabindex="-1">
${seite.inhalt}
</main>
${fusszeile(ctx, seite.aktiv)}
${aktionsleiste(ctx, seite.aktiv)}
${navigationsDialog(ctx, seite.aktiv)}
${bestellDialog(ctx)}
</body>
</html>
`;
}

export { txt };
