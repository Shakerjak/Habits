// Laden der Inhaltsdateien, Erkennen offener Angaben und Formatierungshilfen.
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

export const WOCHENTAGE = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
const SCHEMA_TAGE = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function ladeInhalte(wurzel) {
  const lies = async (datei) => {
    const pfad = path.join(wurzel, 'inhalte', datei);
    const text = await readFile(pfad, 'utf8');
    try {
      return JSON.parse(text);
    } catch (fehler) {
      throw new Error(`inhalte/${datei} ist kein gültiges JSON: ${fehler.message}\nTipp: Auf fehlende Kommas, Anführungszeichen oder ein Komma nach dem letzten Eintrag achten.`);
    }
  };
  const [betrieb, karte, bilder, texte] = await Promise.all([
    lies('betrieb.json'),
    lies('speisekarte.json'),
    lies('bilder.json'),
    lies('texte.de.json'),
  ]);
  return { betrieb, karte, bilder: bilder.bilder, texte };
}

// ---------- Platzhalter-Markierungen ----------

export function marker(wert) {
  if (typeof wert !== 'string') return null;
  const s = wert.trimStart();
  if (s.startsWith('OFFEN:')) return 'offen';
  if (s.startsWith('PRÜFEN:')) return 'pruefen';
  return null;
}

export function ohneMarker(wert) {
  return typeof wert === 'string' ? wert.replace(/^\s*(OFFEN|PRÜFEN):\s*/, '') : wert;
}

// ---------- Prüfliste offener Angaben ----------

const BEZEICHNUNGEN = {
  domain: 'Endgültige Domain',
  email: 'E-Mail-Adresse',
  'vor_ort.fakten': 'Fakten zum Lokal',
  'vor_ort.vorstellung': 'Vorstellung des Betriebs',
  'bestellen.anbieter.0.optionen': 'Lieferando: Lieferung/Abholung',
  'bestellen.anbieter.1.optionen': 'Wolt: Lieferung/Abholung',
  'bestellen.abholung_im_lokal': 'Telefonisch vorbestellen und abholen',
  'rechtliches.inhaber': 'Impressum: Inhaber',
  'rechtliches.rechtsform': 'Impressum: Rechtsform',
  'rechtliches.gisa_zahl': 'Impressum: GISA-Zahl',
  'rechtliches.gewerbe': 'Impressum: Gewerbewortlaut',
  'rechtliches.uid': 'Impressum: UID-Nummer',
  'rechtliches.firmenbuch': 'Impressum: Firmenbuch',
  'rechtliches.behoerde': 'Impressum: Gewerbebehörde',
  'rechtliches.kammer': 'Impressum: Kammerzugehörigkeit',
  'rechtliches.hosting': 'Datenschutz: Hosting-Anbieter',
  'rechtliches.log_speicherdauer': 'Datenschutz: Speicherdauer Server-Logs',
  'rechtliches.avv_hinweis': 'Datenschutz: Auftragsverarbeitungsvertrag mit Hoster',
  'rechtliches.plattform_hinweis': 'Datenschutz: Datenfluss bei Plattform-Bestellungen',
};

function bezeichnung(pfad) {
  const ohneIndex = pfad.replace(/\.\d+$/, '');
  return BEZEICHNUNGEN[pfad] || BEZEICHNUNGEN[ohneIndex] || pfad.replace(/\./g, ' › ');
}

function durchlaufe(objekt, besuch, pfad = '') {
  if (Array.isArray(objekt)) {
    objekt.forEach((wert, i) => durchlaufe(wert, besuch, pfad ? `${pfad}.${i}` : String(i)));
  } else if (objekt && typeof objekt === 'object') {
    for (const [schluessel, wert] of Object.entries(objekt)) {
      if (schluessel.startsWith('_')) continue;
      durchlaufe(wert, besuch, pfad ? `${pfad}.${schluessel}` : schluessel);
    }
  } else {
    besuch(objekt, pfad);
  }
}

export async function sammleProbleme(inhalte, wurzel) {
  const { betrieb, karte, bilder, texte } = inhalte;
  const probleme = [];
  const neu = (datei, ort, art, text, blockiert = true) => probleme.push({ datei, ort, art, text, blockiert });

  // betrieb.json
  durchlaufe(betrieb, (wert, pfad) => {
    const m = marker(wert);
    if (m) neu('betrieb.json', bezeichnung(pfad), m, ohneMarker(wert));
  });
  if (!betrieb.oeffnungszeiten?.bestaetigt) {
    neu('betrieb.json', 'Öffnungszeiten', 'offen', 'Vom Betrieb bestätigte Öffnungszeiten eintragen und "bestaetigt": true setzen.');
  } else {
    for (const tag of WOCHENTAGE) {
      const fenster = betrieb.oeffnungszeiten.tage?.[tag];
      if (!Array.isArray(fenster)) neu('betrieb.json', `Öffnungszeiten ${tag}`, 'offen', 'Zeiten fehlen ([] für Ruhetag).');
      else for (const f of fenster) if (!Array.isArray(f) || f.length !== 2 || !f.every((z) => /^\d{2}:\d{2}$/.test(z))) neu('betrieb.json', `Öffnungszeiten ${tag}`, 'offen', `Ungültiges Zeitfenster ${JSON.stringify(f)} – Format ["11:00","22:00"].`);
    }
  }
  if (!betrieb.google?.place_id) {
    neu('betrieb.json', 'Google Place-ID', 'hinweis', 'Optional: Place-ID eintragen, damit „Google-Bewertungen ansehen“ und „Route planen“ direkt das Unternehmensprofil öffnen.', false);
  }

  // speisekarte.json
  if (!karte.bestaetigt) neu('speisekarte.json', 'Speisekarte gesamt', 'offen', 'Gerichte, Beschreibungen, Preise und Allergene vom Betrieb bestätigen lassen, dann "bestaetigt": true setzen.');
  if (marker(karte.stand)) neu('speisekarte.json', 'Stand der Karte', marker(karte.stand), ohneMarker(karte.stand));
  for (const kat of karte.kategorien) {
    for (const feld of ['intro', 'zusatz']) {
      const m = marker(kat[feld]);
      if (m) neu('speisekarte.json', `${kat.name} › ${feld === 'intro' ? 'Einleitung' : 'Zusatzinfo'}`, m, ohneMarker(kat[feld]));
    }
    for (const g of kat.gerichte) {
      const ort = `${kat.name} › ${g.name}`;
      const m = marker(g.beschreibung);
      if (m) neu('speisekarte.json', `${ort} › Beschreibung`, m, ohneMarker(g.beschreibung));
      if (Array.isArray(g.preis)) {
        for (const v of g.preis) if (typeof v.preis !== 'number') neu('speisekarte.json', `${ort} › Preis ${v.bezeichnung}`, 'offen', 'Preis fehlt.');
      } else if (typeof g.preis !== 'number') {
        neu('speisekarte.json', `${ort} › Preis`, 'offen', 'Preis fehlt.');
      }
      if (!Array.isArray(g.allergene)) neu('speisekarte.json', `${ort} › Allergene`, 'offen', 'Allergene fehlen ([] wenn keine).');
      else for (const a of g.allergene) if (!karte.allergene[a]) neu('speisekarte.json', `${ort} › Allergene`, 'offen', `Unbekannter Allergen-Buchstabe „${a}“.`);
      for (const o of g.optionen || []) if (typeof o.aufpreis !== 'number') neu('speisekarte.json', `${ort} › ${o.bezeichnung}`, 'offen', 'Aufpreis fehlt.');
      for (const k of g.kennzeichnung || []) if (!['scharf', 'vegetarisch', 'vegan'].includes(k)) neu('speisekarte.json', `${ort} › Kennzeichnung`, 'offen', `Unbekannte Kennzeichnung „${k}“.`);
      if (g._hinweis) neu('speisekarte.json', ort, 'hinweis', g._hinweis, false);
    }
  }

  // bilder.json
  for (const [id, b] of Object.entries(bilder)) {
    if (!b.datei) {
      neu('bilder.json', `Foto „${id}“`, 'bild', `Freigegebenes Originalfoto fehlt (${b.platzhalter}).`, false);
      continue;
    }
    try {
      await access(path.join(wurzel, 'bilder', b.datei));
    } catch {
      neu('bilder.json', `Foto „${id}“`, 'offen', `Datei bilder/${b.datei} nicht gefunden.`);
    }
    if (!b.freigegeben) neu('bilder.json', `Foto „${id}“`, 'offen', 'Bildrechte klären und "freigegeben": true setzen.');
    if (marker(b.alt) || !b.alt) neu('bilder.json', `Foto „${id}“ › Bildbeschreibung`, 'offen', ohneMarker(b.alt) || 'Bildbeschreibung (alt) fehlt.');
  }

  // texte.de.json
  durchlaufe(texte, (wert, pfad) => {
    const m = marker(wert);
    if (m) neu('texte.de.json', pfad.replace(/\./g, ' › '), m, ohneMarker(wert));
  });

  return probleme;
}

// ---------- Formatierung ----------

const euro = new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' });
export const formatPreis = (betrag) => euro.format(betrag);

export function formatZeiten(fenster, texte) {
  if (!fenster || fenster.length === 0) return texte.allgemein.geschlossen;
  return `${fenster.map(([von, bis]) => `${von}–${bis}`).join(', ')} ${texte.allgemein.uhr}`;
}

export function oeffnungszeitenSchema(oeffnungszeiten) {
  if (!oeffnungszeiten?.bestaetigt) return null;
  const gruppen = new Map();
  WOCHENTAGE.forEach((tag, i) => {
    for (const [von, bis] of oeffnungszeiten.tage[tag] || []) {
      const schluessel = `${von}-${bis}`;
      if (!gruppen.has(schluessel)) gruppen.set(schluessel, { von, bis, tage: [] });
      gruppen.get(schluessel).tage.push(SCHEMA_TAGE[i]);
    }
  });
  return [...gruppen.values()].map((g) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: g.tage,
    opens: g.von,
    closes: g.bis,
  }));
}

// ---------- Links ----------

function suchbegriff(betrieb) {
  const a = betrieb.adresse;
  return `${betrieb.name.replace(/’/g, "'")}, ${a.strasse}, ${a.plz} ${a.ort}`;
}

export function mapsLinks(betrieb) {
  const q = encodeURIComponent(suchbegriff(betrieb));
  const pid = betrieb.google?.place_id ? encodeURIComponent(betrieb.google.place_id) : null;
  return {
    profil: `https://www.google.com/maps/search/?api=1&query=${q}${pid ? `&query_place_id=${pid}` : ''}`,
    route: `https://www.google.com/maps/dir/?api=1&destination=${q}${pid ? `&destination_place_id=${pid}` : ''}`,
  };
}

export function telLink(betrieb) {
  return `tel:${betrieb.telefon.link}`;
}
