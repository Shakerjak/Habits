// Impressum „/impressum“ und Datenschutzerklärung „/datenschutz“
import { html } from '../lib/html.mjs';
import { txt, zeile, vorschauHinweis, telefonLink, adresseZeilen } from '../lib/bausteine.mjs';
import { marker } from '../lib/daten.mjs';

function emailAngabe(ctx) {
  const { email } = ctx.betrieb;
  if (marker(email)) return txt(ctx, email);
  return html`<a href="mailto:${email}">${email}</a>`;
}

function seitenkopf(titel, untertitel) {
  return html`<section class="seitenkopf seitenkopf--klein thema-dunkel" aria-labelledby="seiten-titel">
  <div class="container">
    <h1 class="seitenkopf__titel" id="seiten-titel">${titel}</h1>
    ${untertitel ? html`<p class="seitenkopf__text">${untertitel}</p>` : ''}
  </div>
</section>`;
}

export function impressum(ctx) {
  const { betrieb } = ctx;
  const i = betrieb.rechtliches;
  const nachweise = Object.values(ctx.bilder).filter((b) => b.datei && b.freigegeben && b.fotonachweis).map((b) => b.fotonachweis);
  const eindeutigeNachweise = [...new Set(nachweise)];

  return {
    pfad: '/impressum',
    aktiv: 'impressum',
    titel: `Impressum | ${betrieb.name} Salzburg`,
    beschreibung: `Impressum und Offenlegung von ${betrieb.name}, ${betrieb.adresse.strasse}, ${betrieb.adresse.plz} ${betrieb.adresse.ort}.`,
    indexieren: true,
    kanonisch: true,
    inhalt: html`${seitenkopf('Impressum', 'Informationen nach § 5 E-Commerce-Gesetz (ECG) und Offenlegung nach § 25 Mediengesetz (MedienG)')}
<div class="thema-hell">
  <div class="container text-seite">
    ${vorschauHinweis(ctx, 'Vorlage: Vorausgefüllte Angaben stammen aus den Händlerangaben auf Wolt. Bitte vom Betreiber bestätigen und vor der Veröffentlichung bei Bedarf rechtlich prüfen lassen.')}
    <h2>Medieninhaber und Diensteanbieter</h2>
    <dl class="angaben">
      ${zeile(ctx, 'Unternehmen', betrieb.name)}
      ${zeile(ctx, 'Inhaber', i.inhaber)}
      ${zeile(ctx, 'Rechtsform', i.rechtsform)}
      ${zeile(ctx, 'Anschrift', html`${betrieb.adresse.strasse}, ${betrieb.adresse.plz} ${betrieb.adresse.ort}, ${betrieb.adresse.land}`)}
      ${zeile(ctx, 'Telefon', telefonLink(ctx))}
      ${zeile(ctx, 'E-Mail', emailAngabe(ctx))}
      ${zeile(ctx, 'GISA-Zahl', i.gisa_zahl)}
      ${zeile(ctx, 'UID-Nummer', i.uid)}
      ${zeile(ctx, 'Firmenbuch', i.firmenbuch)}
    </dl>

    <h2>Gewerbe und Aufsicht</h2>
    <dl class="angaben">
      ${zeile(ctx, 'Unternehmensgegenstand', i.gewerbe)}
      ${zeile(ctx, 'Gewerbebehörde', i.behoerde)}
      ${zeile(ctx, 'Kammer', i.kammer)}
      ${zeile(ctx, 'Berufsrecht', html`Gewerbeordnung 1994 (GewO), abrufbar unter <a href="https://www.ris.bka.gv.at">www.ris.bka.gv.at</a>`)}
    </dl>

    <h2>Grundlegende Richtung</h2>
    <p>Information über das Angebot, die Speisekarte, die Öffnungszeiten und die Bestellmöglichkeiten von ${betrieb.name} in Salzburg.</p>

    ${eindeutigeNachweise.length
      ? html`<h2>Bildnachweise</h2><p>${eindeutigeNachweise.join(' · ')}</p>`
      : ctx.modus === 'vorschau'
        ? html`<h2>Bildnachweise</h2><p>${txt(ctx, 'OFFEN: Bildnachweise ergänzen, sobald die Originalfotos freigegeben sind (bilder.json › fotonachweis).')}</p>`
        : ''}

    <h2>Links zu anderen Websites</h2>
    <p>Diese Website verlinkt auf externe Angebote wie Google Maps, Lieferando und Wolt. Für deren Inhalte sind ausschließlich die jeweiligen Anbieter verantwortlich.</p>
  </div>
</div>`,
  };
}

export function datenschutz(ctx) {
  const { betrieb } = ctx;
  const i = betrieb.rechtliches;

  return {
    pfad: '/datenschutz',
    aktiv: 'datenschutz',
    titel: `Datenschutzerklärung | ${betrieb.name} Salzburg`,
    beschreibung: `Datenschutzerklärung von ${betrieb.name} in Salzburg: welche Daten beim Besuch der Website verarbeitet werden und welche Rechte Sie haben.`,
    indexieren: true,
    kanonisch: true,
    inhalt: html`${seitenkopf('Datenschutzerklärung', `Stand: ${betrieb.stand_rechtstexte}`)}
<div class="thema-hell">
  <div class="container text-seite">
    ${vorschauHinweis(ctx, 'Vorlage für eine Website ohne Cookies, Analyse- und Drittdienste. Bitte vor der Veröffentlichung prüfen lassen und bei jeder Erweiterung (z. B. eingebettete Karte, Statistik) anpassen.')}
    <p>Diese Erklärung informiert darüber, welche personenbezogenen Daten beim Besuch dieser Website verarbeitet werden. Grundlage sind die Datenschutz-Grundverordnung (DSGVO), das österreichische Datenschutzgesetz (DSG) und das Telekommunikationsgesetz 2021 (TKG 2021).</p>

    <h2>1. Verantwortlicher</h2>
    <address>${betrieb.name}<br>Inhaber: ${txt(ctx, i.inhaber)}<br>${adresseZeilen(ctx)}, ${betrieb.adresse.land}<br>Telefon: ${telefonLink(ctx)}<br>E-Mail: ${emailAngabe(ctx)}</address>

    <h2>2. Das Wichtigste in Kürze</h2>
    <ul>
      <li>Diese Website setzt keine Cookies und verwendet keine Analyse- oder Werbedienste.</li>
      <li>Schriften und alle anderen Dateien kommen vom eigenen Webserver. Beim Seitenaufruf werden keine Daten an Google oder andere Dritte übertragen.</li>
      <li>Google Maps, Lieferando und Wolt sind nur verlinkt. Daten an diese Anbieter fließen erst, wenn Sie einen solchen Link anklicken.</li>
    </ul>

    <h2>3. Bereitstellung der Website und Server-Logdateien</h2>
    <p>Beim Aufruf der Website verarbeitet unser Hosting-Anbieter (${txt(ctx, i.hosting)}) automatisch Daten, die Ihr Browser übermittelt: IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, übertragene Datenmenge, zuvor besuchte Seite (Referrer) sowie Browser und Betriebssystem.</p>
    <p>Zweck ist die Auslieferung der Website, ihre Sicherheit und die Fehleranalyse. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).</p>
    <p>Speicherdauer: ${txt(ctx, i.log_speicherdauer)}. Danach werden die Daten gelöscht, sofern sie nicht zur Aufklärung eines Sicherheitsvorfalls benötigt werden.</p>
    ${i.avv_hinweis ? html`<p>${txt(ctx, i.avv_hinweis)}</p>` : ''}

    <h2>4. Cookies und Speicherung im Browser</h2>
    <p>Diese Website setzt keine Cookies und speichert keine Informationen in Ihrem Browser. Eine Einwilligung nach § 165 Abs. 3 TKG 2021 ist daher nicht erforderlich. Sollten wir künftig einwilligungspflichtige Dienste einsetzen, holen wir Ihre Einwilligung vor deren Aktivierung ein. Sie können sie jederzeit mit Wirkung für die Zukunft widerrufen.</p>

    <h2>5. Schriftarten</h2>
    <p>Die Schriften Barlow Condensed und DM Sans liegen auf unserem Webserver und werden von dort geladen. Es besteht keine Verbindung zu Servern von Google oder anderen Schriftanbietern.</p>

    <h2>6. Kontakt per Telefon oder E-Mail</h2>
    <p>Wenn Sie uns anrufen oder schreiben, verarbeiten wir Ihre Angaben (zum Beispiel Name, Telefonnummer, E-Mail-Adresse und Ihr Anliegen), um die Anfrage zu bearbeiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn es um eine Bestellung geht, sonst unser berechtigtes Interesse an der Beantwortung (Art. 6 Abs. 1 lit. f DSGVO). Wir löschen die Daten, sobald sie nicht mehr benötigt werden und keine gesetzlichen Aufbewahrungspflichten bestehen.</p>
    <p>Ein Tipp auf die Telefonnummer öffnet nur die Telefon-App Ihres Geräts. Dabei werden keine Daten an uns übertragen.</p>

    <h2>7. Links zu Google Maps, Lieferando und Wolt</h2>
    <p>„Route planen“ und „Google-Bewertungen ansehen“ führen zu Google Maps, einem Dienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Die Bestellbuttons führen zu Lieferando und Wolt. Mit dem Klick verlassen Sie unsere Website; ab dann gelten die Datenschutzbestimmungen des jeweiligen Anbieters:</p>
    <ul>
      <li>Google: <a href="https://policies.google.com/privacy?hl=de">policies.google.com/privacy</a></li>
      <li>Wolt: <a href="https://explore.wolt.com/de-at/aut/privacy">explore.wolt.com/de-at/aut/privacy</a></li>
      <li>Lieferando: Datenschutzerklärung auf lieferando.at</li>
    </ul>
    ${i.plattform_hinweis ? html`<p>${txt(ctx, i.plattform_hinweis)}</p>` : ''}

    <h2>8. Ihre Rechte</h2>
    <p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Wenden Sie sich dafür an die oben genannten Kontaktdaten.</p>
    <p>Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei der Aufsichtsbehörde beschweren. In Österreich ist das die Datenschutzbehörde, Barichgasse 40–42, 1030 Wien, <a href="https://www.dsb.gv.at">www.dsb.gv.at</a>.</p>

    <h2>9. Änderungen</h2>
    <p>Wir passen diese Erklärung an, wenn sich die Website oder die eingesetzten Dienste ändern. Es gilt die jeweils hier veröffentlichte Fassung.</p>
  </div>
</div>`,
  };
}
