/**
 * Copia los íconos por defecto de Leaflet (marker-icon.png, marker-icon-2x.png,
 * marker-shadow.png) desde node_modules a src/assets/leaflet.
 *
 * Se ejecuta automáticamente como script "postinstall" (ver package.json),
 * así no hay que hacerlo a mano cada vez que se clona el repo.
 */
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules', 'leaflet', 'dist', 'images');
const targetDir = path.join(__dirname, '..', 'src', 'assets', 'leaflet');

const files = ['marker-icon.png', 'marker-icon-2x.png', 'marker-shadow.png'];

if (!fs.existsSync(sourceDir)) {
  console.warn('[copy-leaflet-assets] No se encontró leaflet en node_modules todavía, se omite la copia.');
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  const src = path.join(sourceDir, file);
  const dest = path.join(targetDir, file);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[copy-leaflet-assets] Copiado ${file}`);
  } else {
    console.warn(`[copy-leaflet-assets] No se encontró ${file} en ${src}`);
  }
}
