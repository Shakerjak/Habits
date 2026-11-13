// Fehlerseite (404) und Übersicht offener Punkte (nur Vorschau).
import { html } from '../lib/html.mjs';
import { icon } from '../lib/bausteine.mjs';

export function fehlerseite(ctx) {
  const { texte, betrieb } = ctx;
  return {
    pfad: '/404',
    aktiv: 'fehler',
    titel: `Seite nicht gefunden | ${betrieb.name}`,
    beschreibung: `Diese Seite gibt es nicht. Zur Startseite oder Speisekarte von ${betrieb.name} in Salzburg.`,
    indexieren: false,
    kanonisch: false,
    inhalt: html`<section class="seitenkopf thema-dunkel" aria-labelledby="seiten-titel">
  <div class="container">
    <p class="dachzeile">Fehler 404</p>
    <h1 class="seitenkopf__titel" id="seiten-titel">Seite nicht gefunden</h1>
    <p class="seitenkopf__text">Diese Adresse gibt es nicht (mehr). Hier geht es weiter:</p>
    <div class="knopfreihe">
      <a class="btn btn--gold" href="/speisekarte">${icon('karte')}<span>${texte.navigation.speisekarte}</span></a>
      <a class="btn btn--rand-hell" href="/">${texte.navigation.startseite}</a>
    </div>
  </div>
</section>`,
  };
}

const ARTEN = {
  offen: 'Fehlt',
  pruefen: 'Prüfen',
  bild: 'Foto',
  hinweis: 'Hinweis',
};

export function offenePunkte(ctx) {
  const gruppen = new Map();
  for (const p of ctx.probleme) {
    if (!gruppen.has(p.datei)) gruppen.set(p.datei, []);
    gruppen.get(p.datei).push(p);
  }
  const blockierend = ctx.probleme.filter((p) => p.blockiert).length;
  return {
    pfad: '/offene-punkte',
    aktiv: 'offen',
    titel: `Offene Punkte (Vorschau) | ${ctx.betrieb.name}`,
    beschreibung: 'Interne Übersicht der fehlenden und zu prüfenden Angaben.',
    indexieren: false,
    kanonisch: false,
    inhalt: html`<section class="seitenkopf seitenkopf--klein thema-dunkel" aria-labelledby="seiten-titel">
  <div class="container">
    <p class="dachzeile">Nur in der Vorschau</p>
    <h1 class="seitenkopf__titel" id="seiten-titel">Offene Punkte</h1>
    <p class="seitenkopf__text">${blockierend} Angaben müssen vor der Veröffentlichung ergänzt oder bestätigt werden. Fotos und Hinweise sind empfohlen, blockieren die Live-Version aber nicht. Alle Angaben werden in den Dateien im Ordner <code>inhalte/</code> gepflegt.</p>
  </div>
</section>
<div class="thema-hell">
  <div class="container text-seite text-seite--breit">
    ${[...gruppen.entries()].map(([datei, liste]) => html`<h2><code>inhalte/${datei}</code> <span class="anzahl">(${liste.length})</span></h2>
    <table class="offen-tabelle">
      <thead><tr><th scope="col">Art</th><th scope="col">Stelle</th><th scope="col">Was ist zu tun?</th></tr></thead>
      <tbody>${liste.map((p) => html`<tr class="offen-tabelle__${p.art}"><td><span class="offen-art offen-art--${p.art}">${ARTEN[p.art]}</span></td><td>${p.ort}</td><td>${p.text}</td></tr>`)}</tbody>
    </table>`)}
  </div>
</div>`,
  };
}
