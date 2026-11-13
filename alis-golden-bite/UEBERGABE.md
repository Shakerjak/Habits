# Übergabe: Website Ali’s Golden Bite

Stand: 13.11.2026 · Projektordner `alis-golden-bite/` im Branch `claude/allis-golden-bite-website-jpjs7y`

Die Website ist technisch fertig und vollständig bedienbar. Was vom Betrieb noch bestätigt werden muss, ist in der Vorschau gelb markiert. Die Live-Version lässt sich erst erstellen, wenn diese Angaben eingetragen sind (`npm run build:live` listet sie auf). Vollständige Liste: `npm run offen` oder in der Vorschau unter `/offene-punkte`.

## 1. Benötigte Angaben vom Betreiber

**Pflicht vor dem Livegang**

1. **Speisekarte bestätigen.** Gerichte, Beschreibungen, **Ladenpreise** und **Allergene (A–R)** für alle 33 Positionen (Abgleichtabelle in Abschnitt 6).
   - Für Yaprak Döner, Dürüm, Döner Teller und Iskender Teller fehlen Zutaten, Fleischsorte, Brot und Beilagen.
   - Pizza Huhn Kebab: Belag fehlt. Baklava: Portion fehlt. Double und Triple Cheeseburger: Anzahl der Patties fehlt.
   - Weitere Gerichte ergänzen, die nur im Lokal angeboten werden (z. B. Hähnchen-Döner, Ayran, Tee).
2. **Öffnungszeiten** des Lokals. Die Plattformen widersprechen sich:
   - Wolt: Lieferung täglich 10:00–22:00
   - Lieferando laut Suchindex: Mo–Fr 11:00–23:30, Sa 14:00–23:30, So 17:00–23:30
3. **Impressum**
   - E-Mail-Adresse (Pflichtangabe nach § 5 ECG)
   - Gewerbewortlaut laut GISA-Auszug
   - UID-Nummer, falls vorhanden
   - bestätigen: Inhaber Muhammed Ali Ozan, Einzelunternehmen, GISA-Zahl 39005380 (aus den Händlerangaben auf Wolt), Gewerbebehörde Magistrat Salzburg, Wirtschaftskammer Salzburg
4. **Hosting-Anbieter** mit Anschrift und Speicherdauer der Server-Logs, außerdem ob ein Auftragsverarbeitungsvertrag besteht (für die Datenschutzerklärung).
5. **Endgültige Domain**, z. B. `https://www.…at`.
6. **Bestelloptionen**
   - Bietet Lieferando Lieferung und/oder Abholung an?
   - Kann man telefonisch vorbestellen und abholen?
   - Den Lieferando-Link einmal im Browser öffnen und prüfen. Automatisch ließ er sich nicht laden (Bot-Schutz).
7. **Kurzvorstellung des Betriebs** (2–3 Sätze) sowie Fakten zum Lokal: Sitzplätze, Zahlungsarten, was frisch zubereitet wird.
8. **Bestätigung der Entwurfstexte**, die als „prüfen“ markiert sind:
   - Kurzbeschreibungen der drei vorgestellten Gerichte
   - Hinweise in der Datenschutzerklärung

**Empfohlen (blockiert den Livegang nicht)**

9. **Freigegebene Originalfotos** mit Bildrechten und Bildnachweis:
   - Hauptbild Yaprak Döner (Querformat)
   - Yaprak Döner, Yaprak Dürüm und Ali’s Specialburger (je 4:3)
   - Lokal innen und Spieß bzw. Zubereitung (je Hochformat 4:5)
   - Eingang (4:3)
10. **Logo** als SVG oder PNG, falls vorhanden. Bis dahin steht die typografische Wortmarke mit Bildzeichen.
11. **Google Place-ID** des Unternehmensprofils, damit „Route planen“ und „Google-Bewertungen ansehen“ direkt das Profil öffnen. Derzeit suchen beide Links nach Name und Adresse.
12. **Kennzeichnungen** wie „vegetarisch“, „halal“ oder „hausgemacht“, nur falls zutreffend und belegbar:
    - Wolt kennzeichnet die Vegetarische Pizza als vegetarisch.
    - Wolt beschreibt die Burgersoße als „hausgemacht“.
    - Beides ist auf der Website bewusst noch nicht übernommen.
13. **Aktuelle PDF-Speisekarte** (optional).
14. **foodora:** Ali’s Golden Bite ist auch auf foodora gelistet. Soll ein dritter Bestellbutton dazu?

## 2. Quellenabgleich (13.11.2026)

| Quelle | Ergebnis |
| --- | --- |
| Wolt (`wolt.com/de-at/aut/salzburg/restaurant/alis-golden-bite-5020`) | Abgerufen und geprüft.<br>• Name, Adresse und Telefon stimmen überein.<br>• Lieferung und Abholung werden angeboten.<br>• Karte: Burger, Pizza, Snacks, Baklava, Getränke, zwei Combo-Menüs. Döner-Gerichte sind dort derzeit nicht gelistet.<br>• Händlerangaben: Muhammed Ali Ozan, GISA 39005380. |
| Lieferando (`lieferando.at/speisekarte/alis-golden-bite-siebenstadterstrasse`) | Der Link ist im Suchindex als Seite von Ali’s Golden Bite gelistet. Die Seite selbst blockiert automatisierte Abrufe.<br>Laut Suchindex: Yaprak Döner € 11,00, Yaprak Dürüm € 12,00, Yaprak Döner Teller € 19,50, Iskender Teller € 21,00 sowie abweichende Zeiten. Nicht direkt geprüft. |
| Google Maps und Bewertungen | Automatisch nicht abrufbar (Einwilligungs- und Bot-Prüfung). NAP im Unternehmensprofil bitte von Hand abgleichen. Bewertungen, Sterne und Zitate sind bewusst nicht eingebunden; die Website verlinkt nur das Profil. |

Bewusst nicht übernommen:

- Plattformpreise und -zeiten
- Bewertungen von Wolt, Lieferando und foodora
- Combo-Menüs (vermutlich nur auf Wolt)
- Eigenschaften wie „hausgemacht“ oder „vegetarisch“

Die Plattformpreise stehen nur als Referenz in `speisekarte.json` (Felder mit `_referenz`) und erscheinen nicht auf der Website.

## 3. Durchgeführte Prüfungen

**Automatische Testsuite** (`npm test`, Chromium über Playwright): **140 von 140 bestanden**, sowohl für die Vorschau als auch für einen simulierten Live-Build mit vollständigen Testdaten. Geprüft wurde:

- **Direktaufrufe:** `/`, `/speisekarte`, `/impressum` und `/datenschutz` liefern 200. `/speisekarte.html` leitet per 301 um, unbekannte Adressen liefern die 404-Seite.
- **SEO-Grundlagen:**
  - Sitemap, robots.txt, Favicons, Open-Graph-Bild und Web-Manifest
  - Content-Security-Policy
  - je Seite: Titel, Meta-Beschreibung, Canonical, genau eine H1, keine übersprungenen Überschriftenebenen, keine doppelten IDs
- **Breiten 360, 390, 768 und 1440 px auf allen vier Seiten:**
  - kein horizontales Scrollen
  - Aktionsleiste nur am Handy
  - Fußzeilen- und Rechtslinks nicht verdeckt
  - bei 360 × 640 und 390 × 844 ohne Scrollen sichtbar: Überschrift, beide Buttons, Adresse, Telefon und Öffnungszeiten
- **Tastatur:**
  - jedes Element bei 390 und 1440 px mit sichtbarem Fokusrahmen und nicht verdeckt (WCAG 2.4.11)
  - „Zum Inhalt springen“ funktioniert
- **Navigationsdialog:**
  - öffnet per Enter, der Fokus bleibt im Dialog
  - Escape und der sichtbare Schließen-Button schließen ihn, der Fokus kehrt zurück
  - Ankerlinks schließen den Dialog und springen zum Abschnitt
- **„Online bestellen“:**
  - öffnet per Klick, Enter und Leertaste die Anbieterauswahl
  - Buttons tragen den Anbieternamen und führen zu den geprüften Links
  - Klick auf den Hintergrund oder Escape schließt sie
  - aus der Navigation heraus wechselt der Dialog direkt in die Anbieterauswahl
  - ohne JavaScript führt der Link zum Bestellbereich
- **Links:**
  - alle internen Links und Sprungziele vorhanden
  - Telefonlinks lauten `tel:+436642231637`
  - „Route planen“ und „Google-Bewertungen ansehen“ als Google-Maps-Links
  - Speisekarten-Kategorien landen unterhalb der festen Leisten, die aktive Kategorie ist markiert
- **Bewegung:** Bei „Bewegung reduzieren“ entfallen Animationen und weiches Scrollen.
- **Barrierefreiheit (axe-core 4.14, WCAG 2.0–2.2 A/AA):** keine Verstöße auf allen Seiten, auf der 404-Seite und bei geöffnetem Dialog, jeweils bei 390 und 1440 px.
- **Strukturierte Daten:** JSON-LD `Restaurant` mit Name, Adresse, Telefon, Website, Speisekarten-URL und Küche. Alle Werte stehen sichtbar auf der Seite. Öffnungszeiten und Bilder kommen nur bei bestätigten Angaben dazu.
- **Konsole:** keine JavaScript-Fehler und keine CSP-Verstöße.

**Weitere Prüfungen**

- **Lighthouse 12.8** (lokal, simuliertes Mobilnetz):
  - Vorschau: Performance 99–100, Barrierefreiheit 100, Best Practices 100. SEO 66 nur wegen des absichtlichen `noindex` der Vorschau.
  - Live-Simulation: 100 / 100 / 100 / 100, LCP 1,5 s (Handy), CLS 0, TBT 0–20 ms.
- **Bildpipeline** mit einem vorübergehenden synthetischen Testbild geprüft:
  - AVIF, WebP und JPEG in 480–2400 px, `srcset`/`sizes` mit passender Auswahl je Gerät
  - Einstiegsbild mit `fetchpriority="high"` und Preload, übrige Bilder mit `loading="lazy"`
  - feste Maße, CLS 0, Fotos landen im JSON-LD und als Open-Graph-Bild
  - Testbild danach entfernt
- **Layoutsprünge durch Schriftwechsel:** Mit angeglichenen Ersatzschriften sank CLS am Desktop von 0,058 auf 0.
- **Live-Sperre:** `npm run build:live` bricht mit offenen Angaben ab. Mit vollständigen Testdaten entsteht eine Version ohne Platzhalter und ohne `noindex`, mit Canonicals und Sitemap auf die Domain.

**Nicht durchgeführt bzw. offen**

- **Googles Rich Results Test:** Die Oberfläche ließ sich aus der Entwicklungsumgebung nicht vollständig laden. Ersatzweise wurde das JSON-LD gegen Googles Pflichtfelder für lokale Unternehmen (`name`, `address`) und die empfohlenen Felder geprüft. Den Test nach dem Livegang mit der echten URL durchführen (Abschnitt 5, Schritt 6).
- **Echte Geräte:** iPhone (Safari) und Android (Chrome) sowie ein Screenreader-Durchgang mit VoiceOver oder NVDA. Getestet wurde nur mit Chromium.
- **Lieferando:** Inhalt der Seite und Bestelloptionen (Bot-Schutz).
- **Google-Unternehmensprofil:** Abgleich von Name, Adresse und Telefon.
- **Rechtstexte:** Impressum und Datenschutzerklärung sind Vorlagen auf Basis der bekannten Daten und keine Rechtsberatung. Vor dem Livegang bestätigen bzw. prüfen lassen.

## 4. Pflege durch den Betreiber

Alle veränderlichen Angaben stehen an einer Stelle in `alis-golden-bite/inhalte/`:

- **Preise, Gerichte, Allergene:** `speisekarte.json`
- **Öffnungszeiten, Kontakt, Bestelllinks, Domain, Impressum:** `betrieb.json`
- **Fotos:** `bilder.json` und Ordner `bilder/`
- **Texte und Seitentitel:** `texte.de.json`

Nach einer Änderung `npm run build:live` ausführen und den Inhalt von `dist/` hochladen. Bei Plattformen wie Netlify genügt es, die Änderung zu speichern und zu pushen. Beispiele und Details stehen in der [README](README.md).

Bei jeder Preisänderung `"stand"` in `speisekarte.json` auf das aktuelle Datum setzen.

## 5. Start-Anleitung

Bereits im Projekt umgesetzt:

- `sitemap.xml` und `robots.txt` mit Sitemap-Verweis
- Canonical-Angaben und sprechende URLs
- Favicon, Web-Manifest und Open-Graph-Daten
- JSON-LD `Restaurant`
- HTTPS-Weiterleitung und Sicherheits-Header (`.htaccess` und `_headers`)
- zentrale Domain-Einstellung

Die folgenden Schritte brauchen Kontozugriff bzw. die endgültigen Daten und sind **offen**.

1. **Domain und HTTPS**
   - Domain registrieren oder vorhandene verwenden und im DNS auf den Webspace zeigen lassen.
   - Beim Hoster ein kostenloses TLS-Zertifikat aktivieren (Let’s Encrypt; bei Netlify und Cloudflare automatisch).
   - Entscheiden, ob die Adresse mit oder ohne `www` lautet. Die andere Variante per 301 weiterleiten (Vorlage in `.htaccess`).
2. **Domain eintragen und veröffentlichen**
   - In `inhalte/betrieb.json` bei `domain` z. B. `https://www.beispiel.at` eintragen.
   - `npm run build:live` ausführen und `dist/` hochladen.
   - Kontrolle im Browser: `https://domain/`, `/speisekarte`, `/robots.txt` und `/sitemap.xml` laden, `http://` leitet auf `https://` um.
3. **Google-Unternehmensprofil** ([business.google.com](https://business.google.com))
   - Website: `https://domain/`
   - Link zur Speisekarte: `https://domain/speisekarte`
   - Bestelllinks: Lieferando, Wolt
   - Name, Adresse und Telefonnummer exakt wie auf der Website führen: „Ali’s Golden Bite“, Siebenstädterstraße 3, 5020 Salzburg, +43 664 2231637
   - Öffnungszeiten mit der Website angleichen, Hauptkategorie prüfen, eigene Fotos hochladen
   - Bei der Gelegenheit die Place-ID für `betrieb.json` notieren
4. **Google Search Console** ([search.google.com/search-console](https://search.google.com/search-console))
   - Property vom Typ **Domain** anlegen.
   - Den angezeigten TXT-Eintrag beim Domain- oder DNS-Anbieter eintragen und bestätigen.
5. **Sitemap einreichen:** In der Search Console unter *Sitemaps* `sitemap.xml` eingeben und senden. Der Status sollte „Erfolgreich“ zeigen.
6. **Indexierbarkeit prüfen**
   - *URL-Prüfung* für `https://domain/` und `https://domain/speisekarte` ausführen.
   - *Live-URL testen*: Die Seite muss „indexierbar“ sein. Dann *Indexierung beantragen*.
   - Danach im [Rich Results Test](https://search.google.com/test/rich-results) die Startseiten-URL testen. Erwartet wird „Lokale Unternehmen“ ohne Fehler.
7. **Auswertung**
   - **Search Console → Leistung → Suchergebnisse:**
     - Suchanfragen wie „Yaprak Döner Salzburg“, „Döner Salzburg“ oder „Ali’s Golden Bite Speisekarte“
     - Klicks, Impressionen, Klickrate und Position, filterbar nach Seite, z. B. `/speisekarte`
     - erste Daten nach etwa 2–3 Tagen
   - **Google-Unternehmensprofil → Leistung:**
     - Suchbegriffe, Anrufe, Routenanfragen und Website-Klicks
     - je nach Profil auch Speisekarten- und Bestellklicks
   - **Lieferando- und Wolt-Partnerportale:** Bestellungen je Plattform.
   - Optional: [Bing Webmaster Tools](https://www.bing.com/webmasters), Import direkt aus der Search Console.

Ein Analyse-Tool auf der Website ist dafür nicht nötig. Soll später eines dazukommen, ist es je nach Tool einwilligungspflichtig (siehe README, Abschnitt „Später einwilligungspflichtige Dienste“).

## 6. Preisabgleich (Plattformpreise nur als Referenz)

Ladenpreise in `inhalte/speisekarte.json` bei `preis` eintragen.

| Kategorie | Gericht | Wolt | Lieferando (Suchindex) | Ladenpreis |
| --- | --- | --- | --- | --- |
| Döner & Dürüm | Yaprak Döner | – | € 11,00 | |
| Döner & Dürüm | Yaprak Dürüm | – | € 12,00 | |
| Döner & Dürüm | Yaprak Döner Teller | – | € 19,50 | |
| Döner & Dürüm | Iskender Teller | – | € 21,00 | |
| Burger | Klassik Burger (Menü + € 10,00) | € 10,00 | – | |
| Burger | Ali’s Specialburger (Menü + € 10,00) | € 15,00 | – | |
| Burger | Chilli Cheeseburger (Menü + € 5,00) | € 15,00 | – | |
| Burger | Double Cheeseburger (Menü + € 10,00) | € 15,00 | – | |
| Burger | Triple Cheeseburger (Menü + € 10,00) | € 20,00 | – | |
| Burger | Cheeseburger Menü | € 20,00 | – | |
| Pizza | Margherita | € 10,00 | – | |
| Pizza | Mozzarella | € 11,00 | – | |
| Pizza | Funghi | € 12,00 | – | |
| Pizza | Vegetarische Pizza | € 13,00 | – | |
| Pizza | Salami | € 13,00 | – | |
| Pizza | Sucuk | € 13,00 | – | |
| Pizza | Diavolo | € 13,00 | – | |
| Pizza | Calzone | € 13,50 | – | |
| Pizza | Huhn Kebab | € 15,00 | – | |
| Snacks | Portion Pommes | € 6,50 | – | |
| Snacks | Zwiebelringe 5 / 10 Stück | € 3,50 / € 6,00 | – | |
| Snacks | Chilli Cheese Pommes | € 11,00 | – | |
| Süßes | Baklava | € 4,00 | – | |
| Getränke | Römerquelle still / prickelnd 0,5 l | € 3,60 | – | |
| Getränke | Coca-Cola 0,33 l / 0,5 l | € 3,30 / € 3,60 | – | |
| Getränke | Coca-Cola Zero 0,33 l / 0,5 l | € 3,30 / € 3,60 | – | |
| Getränke | Fanta Orange 0,33 l | € 3,30 | – | |
| Getränke | Mezzo Mix 0,33 l | € 3,30 | – | |
| Getränke | Red Bull 0,25 l | € 3,80 | – | |
| Getränke | Powerade Mountain Blast 0,5 l | € 3,60 | – | |
