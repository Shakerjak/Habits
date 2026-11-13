# Website Ali’s Golden Bite

Statische, schnelle Website für Ali’s Golden Bite, Siebenstädterstraße 3, 5020 Salzburg.
Alle Inhalte stehen in wenigen Dateien im Ordner `inhalte/`. Ein kleines Build-Skript erzeugt daraus fertige HTML-Seiten im Ordner `dist/`, die auf jedem Webspace laufen.

| Adresse | Seite |
| --- | --- |
| `/` | Startseite |
| `/speisekarte` | Speisekarte mit Preisen und Allergenen |
| `/impressum` | Impressum |
| `/datenschutz` | Datenschutzerklärung |

Übergabe, offene Punkte, Prüfprotokoll und Start-Anleitung: [UEBERGABE.md](UEBERGABE.md)

## Schnellstart

Voraussetzung: [Node.js](https://nodejs.org) ab Version 20.

```bash
cd alis-golden-bite
npm install          # einmalig
npm run build        # Vorschau mit gelb markierten Platzhaltern erzeugen
npm run vorschau     # http://localhost:4173 im Browser öffnen
npm run offen        # Liste aller fehlenden und zu prüfenden Angaben
npm run build:live   # Veröffentlichungsversion – klappt erst, wenn nichts mehr offen ist
npm test             # automatische Prüfung (Vorschau-Server muss laufen)
```

## Inhalte pflegen

Alle Änderungen erfolgen in `inhalte/`. Danach `npm run build` (Vorschau) bzw. `npm run build:live` (Veröffentlichung) ausführen und den Inhalt von `dist/` hochladen.

| Was | Datei | Feld |
| --- | --- | --- |
| Preise, Gerichte, Allergene | `inhalte/speisekarte.json` | `preis`, `allergene`, `beschreibung` |
| Öffnungszeiten | `inhalte/betrieb.json` | `oeffnungszeiten` |
| Adresse, Telefon, E-Mail | `inhalte/betrieb.json` | `adresse`, `telefon`, `email` |
| Lieferando- und Wolt-Links | `inhalte/betrieb.json` | `bestellen.anbieter` |
| Impressum, Datenschutz | `inhalte/betrieb.json` | `rechtliches` |
| Domain (für Canonical, Sitemap, Open Graph) | `inhalte/betrieb.json` | `domain` |
| Fotos | `bilder/` und `inhalte/bilder.json` | `datei`, `alt`, `freigegeben` |
| Texte, Seitentitel, Meta-Beschreibungen | `inhalte/texte.de.json` | |

### Markierungen

- `"OFFEN: …"` – Angabe fehlt. Die Vorschau zeigt einen gelben Platzhalter, die Live-Version wird nicht erstellt.
- `"PRÜFEN: …"` – aus öffentlichen Quellen vorausgefüllt. Wert bestätigen und das Präfix `PRÜFEN: ` löschen.
- `null` – Angabe wird nicht verwendet, die Zeile entfällt.

### Beispiele

Preis ändern (`inhalte/speisekarte.json`):

```json
{ "id": "yaprak-doener", "name": "Yaprak Döner", "beschreibung": "Im Fladenbrot mit Salat und Soße", "preis": 11.5, "allergene": ["A", "C", "G"] }
```

`11.5` erscheint als „€ 11,50“. Mehrere Größen: `"preis": [{ "bezeichnung": "5 Stück", "preis": 3.5 }, { "bezeichnung": "10 Stück", "preis": 6 }]`. Allergene mit den österreichischen Buchstaben A–R; `[]` bedeutet „keines der 14 Hauptallergene“.

Öffnungszeiten (`inhalte/betrieb.json`):

```json
"oeffnungszeiten": {
  "bestaetigt": true,
  "tage": {
    "montag": [["11:00", "22:00"]],
    "dienstag": [["11:00", "14:00"], ["17:00", "22:00"]],
    "sonntag": []
  },
  "hinweis": "An Feiertagen abweichende Zeiten möglich."
}
```

`[]` bedeutet Ruhetag. Erst mit `"bestaetigt": true` erscheinen die Zeiten auf der Website und in den strukturierten Daten für Google.

Foto einsetzen: Originaldatei (mind. 2000 px breit) nach `bilder/` kopieren, in `inhalte/bilder.json` beim passenden Platz `"datei": "name.jpg"`, eine echte Bildbeschreibung bei `"alt"` und nach geklärten Bildrechten `"freigegeben": true` eintragen. Der Build erzeugt automatisch AVIF-, WebP- und JPEG-Varianten in mehreren Größen.

Logo: Logodatei nach `src/static/` legen und in `inhalte/betrieb.json` `"logo": "/logo.svg"` eintragen. Ohne Logo erscheint die typografische Wortmarke.

PDF-Speisekarte (optional): Datei als `src/static/speisekarte.pdf` ablegen und in `inhalte/speisekarte.json` `"pdf": "/speisekarte.pdf"` eintragen.

## Veröffentlichen

1. `npm run build:live` – bricht mit einer Liste ab, solange Pflichtangaben fehlen.
2. Den **Inhalt** von `dist/` (inklusive der versteckten Datei `.htaccess`) in das Hauptverzeichnis des Webspace hochladen.

Der Ordner `dist/` funktioniert ohne weitere Einrichtung auf

- Apache-Webspace (viele österreichische Hoster): `.htaccess` sorgt für HTTPS, saubere Adressen ohne `.html`, Kompression, Caching und Sicherheits-Header.
- Netlify oder Cloudflare Pages: Veröffentlichungsordner `alis-golden-bite/dist`, Build-Befehl `npm ci && npm run build:live`; die Datei `_headers` wird automatisch verwendet.
- GitHub Pages (eigenes Repository oder Actions-Workflow; die bestehende Habits-App im Hauptverzeichnis dieses Repositorys bleibt unberührt).

## Technik

- Kein Framework, kein Tracking, keine Cookies, keine externen Ressourcen. Schriften liegen lokal in `src/fonts/` (SIL Open Font License).
- `scripts/build.mjs` erzeugt HTML, Sitemap, robots.txt, Web-Manifest, `.htaccess` und `_headers`.
- `src/seiten/` enthält die Seitenvorlagen, `src/css/site.css` das Design und `src/js/site.js` die Dialoge und die Speisekarten-Navigation (rund 6 KB). Ohne JavaScript bleibt alles über normale Links bedienbar.
- `npm run marke` erzeugt Favicons und das Vorschaubild für soziale Medien (`og-bild.png`) neu. Mit freigegebenem Hauptfoto verwendet der Build automatisch das Foto als Vorschaubild.
- Eine englische Version kann auf derselben Struktur aufbauen: `inhalte/texte.de.json` als `texte.en.json` übersetzen, englische Gerichtsnamen ergänzen und im Build eine zweite Ausgabe unter `/en/` mit `hreflang`-Verweisen erzeugen.

### Später einwilligungspflichtige Dienste

Die Website setzt derzeit keine Cookies und lädt nichts von Dritten. Deshalb ist kein Cookie-Banner nötig. Bei einer eingebetteten Google-Karte, Statistik- oder Werbediensten gilt:

- Vor dem Laden des Dienstes eine wirksame Einwilligung einholen, zum Beispiel per Klick-Platzhalter.
- Der Widerruf muss jederzeit möglich sein.
- Die Content-Security-Policy in `scripts/build.mjs` und die Datenschutzerklärung anpassen.
