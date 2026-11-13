// Startseite „/“
import { html, raw } from '../lib/html.mjs';
import { icon, txt, bild, oeffnungszeitenTabelle, heuteInfo, adresseZeilen, telefonLink, routeLink, anbieterOptionen, bestellButtonText, platzhalterBlock } from '../lib/bausteine.mjs';
import { mapsLinks, telLink, oeffnungszeitenSchema, marker } from '../lib/daten.mjs';

function findeGericht(karte, id) {
  for (const kat of karte.kategorien) {
    const g = kat.gerichte.find((x) => x.id === id);
    if (g) return g;
  }
  throw new Error(`Gericht „${id}“ aus texte.de.json fehlt in speisekarte.json`);
}

export function restaurantJsonLd(ctx) {
  const { betrieb, basisUrl } = ctx;
  const bilder = Object.values(ctx.bildDaten).filter((b) => b.freigegeben).map((b) => `${basisUrl}${b.gross}`);
  const restaurant = {
    '@type': 'Restaurant',
    '@id': `${basisUrl}/#restaurant`,
    name: betrieb.name,
    url: `${basisUrl}/`,
    telephone: betrieb.telefon.anzeige,
    address: {
      '@type': 'PostalAddress',
      streetAddress: betrieb.adresse.strasse,
      postalCode: betrieb.adresse.plz,
      addressLocality: betrieb.adresse.ort,
      addressCountry: betrieb.adresse.laendercode,
    },
    hasMenu: `${basisUrl}/speisekarte`,
    servesCuisine: betrieb.kueche,
  };
  const zeiten = oeffnungszeitenSchema(betrieb.oeffnungszeiten);
  if (zeiten) restaurant.openingHoursSpecification = zeiten;
  if (bilder.length) restaurant.image = bilder;
  if (betrieb.email && !marker(betrieb.email)) restaurant.email = betrieb.email;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${basisUrl}/#website`, name: betrieb.name, url: `${basisUrl}/`, inLanguage: ctx.texte.sprache },
      restaurant,
    ],
  };
}

// „Yaprak Döner in Salzburg“: Zeilenumbruch nur vor „in …“ zulassen.
function heroTitel(text) {
  const teile = text.match(/^(.*) (in .+)$/);
  return teile ? html`${teile[1]} <span class="nowrap">${teile[2]}</span>` : html`${text}`;
}

export function startseite(ctx) {
  const { betrieb, karte, texte } = ctx;
  const t = texte.startseite;
  const maps = mapsLinks(betrieb);

  const heroBild = ctx.bildDaten.hero;
  const vorladen = heroBild
    ? raw(`<link rel="preload" as="image" imagesrcset="${heroBild.quellen[0].srcset}" imagesizes="(min-width: 1024px) 1100px, 100vw" type="${heroBild.quellen[0].typ}" fetchpriority="high">`)
    : '';

  const hero = html`<section class="hero thema-dunkel" aria-labelledby="hero-titel">
  <div class="hero__raster">
    <div class="hero__text">
      <p class="dachzeile">${t.hero.dachzeile}</p>
      <h1 class="hero__titel" id="hero-titel">${heroTitel(t.hero.ueberschrift)}</h1>
      <p class="hero__lead">${t.hero.text}</p>
      <div class="knopfreihe">
        <a class="btn btn--gold btn--gross" href="#bestellen" data-dialog-open="bestellen">${icon('tasche')}<span>${t.hero.button_bestellen}</span></a>
        <a class="btn btn--rand-hell btn--gross" href="/speisekarte">${icon('karte')}<span>${t.hero.button_karte}</span></a>
      </div>
      <ul class="fakten">
        <li>${icon('ort')}<a href="${maps.route}">${betrieb.adresse.strasse}, ${betrieb.adresse.plz} ${betrieb.adresse.ort}</a></li>
        <li>${icon('telefon')}${telefonLink(ctx)}</li>
        <li>${icon('uhr')}<span>${heuteInfo(ctx)}</span></li>
      </ul>
    </div>
    <div class="hero__bild">
      ${bild(ctx, 'hero', { ratio: 'hero', prioritaet: true, sizes: '(min-width: 1024px) 1100px, 100vw' })}
    </div>
  </div>
</section>`;

  const gerichte = html`<section class="abschnitt thema-hell" id="gerichte" aria-labelledby="gerichte-titel">
  <div class="container">
    <div class="abschnitt__kopf">
      <p class="dachzeile">${t.gerichte.dachzeile}</p>
      <h2 class="abschnitt__titel" id="gerichte-titel">${t.gerichte.ueberschrift}</h2>
      <p class="abschnitt__text">${t.gerichte.text}</p>
    </div>
    <ul class="karten">${t.gerichte.auswahl.map((a) => {
      const g = findeGericht(karte, a.gericht);
      return html`<li class="karte">
        ${bild(ctx, a.bild, { sizes: '(min-width: 1240px) 380px, (min-width: 900px) 31vw, (min-width: 600px) 44vw, 100vw' })}
        <div class="karte__text">
          <h3 class="karte__titel"><a class="karte__link" href="/speisekarte#gericht-${g.id}">${g.name}</a></h3>
          <p>${txt(ctx, a.text)}</p>
          <span class="karte__mehr" aria-hidden="true">${t.gerichte.link} ${icon('pfeil')}</span>
        </div>
      </li>`;
    })}</ul>
  </div>
</section>`;

  const vo = betrieb.vor_ort;
  const lokal = html`<section class="abschnitt thema-dunkel lokal" id="lokal" aria-labelledby="lokal-titel">
  <div class="container lokal__raster">
    <div class="lokal__text">
      <p class="dachzeile">${t.lokal.dachzeile}</p>
      <h2 class="abschnitt__titel" id="lokal-titel">${t.lokal.ueberschrift}</h2>
      ${marker(vo.vorstellung) === 'offen' ? platzhalterBlock(ctx, vo.vorstellung.replace(/^OFFEN:\s*/, '')) : html`<p class="abschnitt__text">${txt(ctx, vo.vorstellung)}</p>`}
      <h3 class="lokal__untertitel">${t.lokal.fakten_titel}</h3>
      <ul class="haken-liste">
        ${t.lokal.fakten_fix.map((f) => html`<li>${txt(ctx, f)}</li>`)}
        ${vo.fakten.map((f) => html`<li>${txt(ctx, f)}</li>`)}
      </ul>
    </div>
    <div class="lokal__bilder">
      ${bild(ctx, 'lokal-innen', { ratio: '4x5', sizes: '(min-width: 1240px) 330px, (min-width: 1024px) 27vw, 50vw' })}
      ${bild(ctx, 'lokal-spiess', { ratio: '4x5', sizes: '(min-width: 1240px) 330px, (min-width: 1024px) 27vw, 50vw', klasse: 'lokal__bild-versetzt' })}
    </div>
  </div>
</section>`;

  const bewertungen = html`<section class="abschnitt abschnitt--schmal thema-creme" id="bewertungen" aria-labelledby="bewertungen-titel">
  <div class="container band">
    <span class="band__icon">${icon('sprechblase')}</span>
    <div class="band__text">
      <h2 class="band__titel" id="bewertungen-titel">${t.bewertungen.ueberschrift}</h2>
      <p>${t.bewertungen.text}</p>
    </div>
    <a class="btn btn--rand-dunkel" href="${maps.profil}">${t.bewertungen.button} ${icon('extern')}</a>
  </div>
</section>`;

  const b = t.bestellen;
  const bestellen = html`<section class="abschnitt thema-hell" id="bestellen" aria-labelledby="bestellen-titel">
  <div class="container">
    <div class="abschnitt__kopf">
      <p class="dachzeile">${b.dachzeile}</p>
      <h2 class="abschnitt__titel" id="bestellen-titel">${b.ueberschrift}</h2>
      <p class="abschnitt__text">${b.text}</p>
    </div>
    <ul class="bestell-raster">
      ${betrieb.bestellen.anbieter.map((a) => html`<li class="bestell-karte">
        <h3 class="bestell-karte__name">${a.name}</h3>
        ${anbieterOptionen(ctx, a)}
        <a class="btn btn--gold" href="${a.url}">${bestellButtonText(ctx, a)} ${icon('extern')}</a>
      </li>`)}
      <li class="bestell-karte bestell-karte--lokal thema-dunkel">
        <h3 class="bestell-karte__name">${b.lokal_titel}</h3>
        <p>${b.lokal_text}<br><strong>${betrieb.adresse.strasse}, ${betrieb.adresse.plz} ${betrieb.adresse.ort}</strong></p>
        ${betrieb.bestellen.abholung_im_lokal ? html`<p>${txt(ctx, betrieb.bestellen.abholung_im_lokal)}</p>` : ''}
        <a class="btn btn--rand-hell" href="${telLink(betrieb)}">${icon('telefon')}<span>${b.anrufen}</span></a>
      </li>
    </ul>
    <p class="hinweis">${betrieb.bestellen.hinweis}</p>
  </div>
</section>`;

  const k = t.kontakt;
  const kontakt = html`<section class="abschnitt thema-dunkel" id="kontakt" aria-labelledby="kontakt-titel">
  <div class="container kontakt__raster">
    <div class="kontakt__info">
      <p class="dachzeile">${k.dachzeile}</p>
      <h2 class="abschnitt__titel" id="kontakt-titel">${k.ueberschrift}</h2>
      <div class="kontakt__bloecke">
        <div>
          <h3 class="kontakt__label">${k.adresse_titel}</h3>
          <address>${betrieb.name}<br>${adresseZeilen(ctx)}</address>
        </div>
        <div>
          <h3 class="kontakt__label">${k.telefon_titel}</h3>
          <p>${telefonLink(ctx, 'kontakt__telefon')}</p>
        </div>
        <div class="kontakt__zeiten">
          <h3 class="kontakt__label">${k.zeiten_titel}</h3>
          ${oeffnungszeitenTabelle(ctx)}
        </div>
      </div>
      <div class="knopfreihe">
        <a class="btn btn--gold" href="${routeLink(ctx)}">${icon('route')}<span>${k.route}</span></a>
        <a class="btn btn--rand-hell" href="${telLink(betrieb)}">${icon('telefon')}<span>${k.anrufen}</span></a>
      </div>
    </div>
    <div class="kontakt__bild">
      ${bild(ctx, 'eingang', { sizes: '(min-width: 1024px) 45vw, 100vw' })}
    </div>
  </div>
</section>`;

  return {
    pfad: '/',
    aktiv: 'start',
    titel: t.titel,
    beschreibung: t.beschreibung,
    indexieren: true,
    kanonisch: true,
    vorladen,
    jsonld: restaurantJsonLd(ctx),
    inhalt: html`${hero}${gerichte}${lokal}${bewertungen}${bestellen}${kontakt}`,
  };
}
