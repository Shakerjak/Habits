// Bildverarbeitung: erzeugt aus den Originalfotos in bilder/ responsive Varianten (AVIF, WebP, JPEG).
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile, access } from 'node:fs/promises';
import path from 'node:path';

const BREITEN = [480, 768, 1024, 1440, 1920, 2400];
const FORMATE = [
  { ext: 'avif', typ: 'image/avif', opts: { quality: 52, effort: 4 } },
  { ext: 'webp', typ: 'image/webp', opts: { quality: 74 } },
  { ext: 'jpg', typ: 'image/jpeg', opts: { quality: 80, mozjpeg: true } },
];

async function existiert(datei) {
  try {
    await access(datei);
    return true;
  } catch {
    return false;
  }
}

async function ladeSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    throw new Error('Für die Bildverarbeitung wird das Paket „sharp“ benötigt. Bitte einmal „npm install“ im Projektordner ausführen.');
  }
}

// Verarbeitet alle freigegebenen (bzw. in der Vorschau alle vorhandenen) Fotos.
// Ergebnis: { [slot]: { breite, hoehe, quellen: [{typ, srcset}], fallback, alt, freigegeben } }
export async function verarbeiteBilder({ bilder, wurzel, ziel, modus }) {
  const ergebnis = {};
  const zuVerarbeiten = Object.entries(bilder).filter(([, b]) => b.datei && (b.freigegeben || modus === 'vorschau'));
  if (zuVerarbeiten.length === 0) return ergebnis;

  const sharp = await ladeSharp();
  const cacheOrdner = path.join(wurzel, '.cache', 'bilder');
  await mkdir(cacheOrdner, { recursive: true });
  await mkdir(path.join(ziel, 'bilder'), { recursive: true });

  for (const [slot, b] of zuVerarbeiten) {
    const quelle = path.join(wurzel, 'bilder', b.datei);
    if (!(await existiert(quelle))) continue;
    const daten = await readFile(quelle);
    const hash = createHash('sha256').update(daten).digest('hex').slice(0, 10);
    const meta = await sharp(daten).rotate().metadata();
    const orientierungGedreht = (meta.orientation || 1) >= 5;
    const breite = orientierungGedreht ? meta.height : meta.width;
    const hoehe = orientierungGedreht ? meta.width : meta.height;
    const breiten = BREITEN.filter((w) => w <= breite);
    if (breiten.length === 0 || breiten[breiten.length - 1] < breite) breiten.push(Math.min(breite, 2400));
    const eindeutig = [...new Set(breiten)].sort((a, c) => a - c);

    const quellen = [];
    for (const format of FORMATE) {
      const eintraege = [];
      for (const w of eindeutig) {
        const name = `${slot}-${hash}-${w}.${format.ext}`;
        const cache = path.join(cacheOrdner, name);
        if (!(await existiert(cache))) {
          let pipeline = sharp(daten).rotate().resize({ width: w, withoutEnlargement: true });
          pipeline = format.ext === 'jpg' ? pipeline.jpeg(format.opts) : pipeline[format.ext](format.opts);
          await writeFile(cache, await pipeline.toBuffer());
        }
        await copyFile(cache, path.join(ziel, 'bilder', name));
        eintraege.push({ url: `/bilder/${name}`, w });
      }
      quellen.push({ typ: format.typ, ext: format.ext, srcset: eintraege.map((e) => `${e.url} ${e.w}w`).join(', '), eintraege });
    }
    const jpg = quellen.find((q) => q.ext === 'jpg').eintraege;
    const mittel = jpg.find((e) => e.w >= 1024) || jpg[jpg.length - 1];
    ergebnis[slot] = {
      breite,
      hoehe,
      quellen: quellen.filter((q) => q.ext !== 'jpg'),
      jpgSrcset: quellen.find((q) => q.ext === 'jpg').srcset,
      fallback: mittel.url,
      gross: jpg[jpg.length - 1].url,
      freigegeben: Boolean(b.freigegeben),
    };
  }
  return ergebnis;
}

// Erzeugt ein Open-Graph-Bild (1200 × 630) aus dem Hauptfoto, falls vorhanden.
export async function ogBildAusFoto({ bilder, wurzel, ziel }) {
  const b = bilder.hero;
  if (!b?.datei || !b.freigegeben) return null;
  const quelle = path.join(wurzel, 'bilder', b.datei);
  if (!(await existiert(quelle))) return null;
  const sharp = await ladeSharp();
  await mkdir(path.join(ziel, 'bilder'), { recursive: true });
  await sharp(quelle).rotate().resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(ziel, 'bilder', 'og-bild.jpg'));
  return { url: '/bilder/og-bild.jpg', breite: 1200, hoehe: 630, typ: 'image/jpeg' };
}
