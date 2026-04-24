// Image Inspector — Background Service Worker v12 (SVG Fix & Syntax Integrity)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FETCH_META' && msg.url) {
    handleFetch(msg.url, msg.getPalette, msg.colorCount).then(sendResponse);
    return true;
  }
  if (msg.type === 'FETCH_IMAGE' && msg.url) {
    handleFetchImage(msg.url).then(sendResponse);
    return true;
  }
  if (msg.type === 'OPEN_LENS' && msg.url) {
    chrome.tabs.create({ url: msg.url });
    return false;
  }
  return false;
});

async function handleFetchImage(url) {
  try {
    // 1. Intentamos obtenerla del caché (muy probable que esté ahí si el usuario la ve)
    let r = await fetch(url, { cache: 'force-cache' });

    // 2. Si el caché falla o no es suficiente, intentamos fetch estándar con cabeceras
    if (!r.ok) {
      r = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        credentials: 'omit'
      });
    }

    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const blob = await r.blob();
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onloadend = () => resolve({ dataUrl: reader.result, mime: blob.type });
      reader.onerror = () => resolve({ error: 'FileReader failed' });
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return { error: e.message };
  }
}

async function handleFetch(url, getPalette, count) {
  let size = null, mime = null, colors = [], exif = null;

  // 1. Get Head Info (Size/Mime)
  try {
    const r = await fetch(url, { method: 'HEAD' });
    size = r.headers.get('content-length') ? parseInt(r.headers.get('content-length'), 10) : null;
    mime = r.headers.get('content-type') ? r.headers.get('content-type').split(';')[0].trim().toLowerCase() : null;
  } catch (_) { }

  // 2. Get Data for Palette/Exif
  try {
    const r = await fetch(url);
    const buffer = await r.arrayBuffer();

    // ── PALETTE EXTRACTION ────────────────────────────────────────────────
    if (getPalette) {
      if (mime === 'image/svg+xml' || url.toLowerCase().endsWith('.svg')) {
        colors = extractSvgColors(new TextDecoder().decode(buffer), count || 3);
      } else {
        try {
          const bitmap = await createImageBitmap(new Blob([buffer]));
          const S = 100;
          const canvas = new OffscreenCanvas(S, S);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bitmap, 0, 0, S, S);
          colors = quantize(ctx.getImageData(0, 0, S, S).data, count || 3);
        } catch (e) { console.warn('Raster palette failed:', e); }
      }
    }

    // ── EXIF ENGINE ───────────────────────────────────────────────────────
    if (mime === 'image/jpeg' || mime === 'image/jpg' || url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) {
      exif = parseExif(buffer);
    }
  } catch (e) { console.warn('Main fetch failed:', e); }

  return { size, mime, colors, exif };
}

function extractSvgColors(svgText, max) {
  const colors = new Set();
  // Buscamos específicamente atributos fill y stroke para evitar IDs o ruidos
  const attrRegex = /(?:fill|stroke)\s*=\s*["']\s*(#(?:[0-9a-fA-F]{3}){1,2}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))\s*["']/gi;
  const styleRegex = /(?:fill|stroke)\s*:\s*(#(?:[0-9a-fA-F]{3}){1,2}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))/gi;

  let match;
  while ((match = attrRegex.exec(svgText)) !== null) addParsedColor(colors, match[1]);
  while ((match = styleRegex.exec(svgText)) !== null) addParsedColor(colors, match[1]);

  // Si no encontramos nada con etiquetas específicas, probamos búsqueda global de hex
  if (colors.size === 0) {
    const hexGlobal = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
    while ((match = hexGlobal.exec(svgText)) !== null) colors.add(match[0].toUpperCase());
  }

  return Array.from(colors).slice(0, max);
}

function addParsedColor(set, val) {
  if (val.startsWith('rgb')) {
    const m = val.match(/\d+/g);
    if (m && m.length >= 3) {
      const hex = '#' + m.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase();
      set.add(hex);
    }
  } else {
    set.add(val.toUpperCase());
  }
}

function parseExif(buffer) {
  const data = new DataView(buffer);
  if (data.byteLength < 2 || data.getUint16(0) !== 0xFFD8) return null;
  let offset = 2;
  while (offset < data.byteLength) {
    const marker = data.getUint16(offset);
    if (marker === 0xFFE1) return readExifData(data, offset + 4);
    if (marker === 0xFFDA || marker === 0xFFD9) break;
    offset += 2 + data.getUint16(offset + 2);
  }
  return null;
}

function readExifData(data, offset) {
  if (data.getUint32(offset) !== 0x45786966) return null;
  const tiffOffset = offset + 6;
  const bigEndian = data.getUint16(tiffOffset) === 0x4D4D;
  const get16 = (o) => data.getUint16(o, !bigEndian);
  const get32 = (o) => data.getUint32(o, !bigEndian);
  if (get16(tiffOffset + 2) !== 0x002A) return null;
  const firstIFD = tiffOffset + get32(tiffOffset + 4);
  const tags = {}, gpsTags = {};
  const TAGS = { 0x010F: 'make', 0x0110: 'model', 0x9003: 'date', 0x829D: 'aperture', 0x013B: 'creator', 0x8298: 'copyright', 0x0112: 'orientation', 0x0131: 'software', 0x010E: 'title', 0xA001: 'colorSpace' };
  function readIFD(ifdOffset, isGPS = false) {
    if (ifdOffset >= data.byteLength) return;
    const numEntries = get16(ifdOffset);
    for (let i = 0; i < numEntries; i++) {
      const entry = ifdOffset + 2 + (i * 12);
      const tag = get16(entry), type = get16(entry + 2), count = get32(entry + 4);
      const valOff = (count * [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8][type] <= 4) ? entry + 8 : tiffOffset + get32(entry + 8);
      const val = readValue(data, type, count, valOff, !bigEndian);
      if (isGPS) gpsTags[tag] = val; else if (TAGS[tag]) tags[TAGS[tag]] = val;
      if (tag === 0x8769) readIFD(tiffOffset + get32(entry + 8));
      if (tag === 0x8825) readIFD(tiffOffset + get32(entry + 8), true);
    }
  }
  try { readIFD(firstIFD); } catch (e) { }
  if (tags.aperture) tags.aperture = `f/${Number(tags.aperture).toFixed(1)}`;
  if (tags.colorSpace) tags.colorSpace = tags.colorSpace === 1 ? 'sRGB' : (tags.colorSpace === 0xFFFF ? 'Uncalibrated' : 'Adobe RGB');
  if (Object.keys(gpsTags).length) tags.gps = formatGPS(gpsTags);
  return Object.keys(tags).length ? tags : null;
}

function readValue(data, type, count, offset, littleEndian) {
  if (offset + 4 > data.byteLength) return null;
  switch (type) {
    case 2: let s = ''; for (let i = 0; i < count - 1; i++) s += String.fromCharCode(data.getUint8(offset + i)); return s.trim();
    case 3: return data.getUint16(offset, littleEndian);
    case 4: return data.getUint32(offset, littleEndian);
    case 5: case 10: const num = data.getUint32(offset, littleEndian), den = data.getUint32(offset + 4, littleEndian); return den === 0 ? 0 : num / den;
    default: return null;
  }
}

function formatGPS(gps) {
  const parseDMS = (dms) => Array.isArray(dms) ? dms[0] + dms[1] / 60 + dms[2] / 3600 : 0;
  let lat = parseDMS(gps[2]); if (gps[1] === 'S') lat = -lat;
  let lon = parseDMS(gps[4]); if (gps[3] === 'W') lon = -lon;
  return lat && lon ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : null;
}

function quantize(data, maxColors) {
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= 128) pixels.push([data[i], data[i + 1], data[i + 2]]);
  if (!pixels.length) return [];
  let boxes = [new VBox(pixels)];
  while (boxes.length < maxColors) {
    boxes.sort((a, b) => b.volume - a.volume);
    const box = boxes.find(b => b.canSplit()); if (!box) break;
    const index = boxes.indexOf(box); const [b1, b2] = box.split(); boxes.splice(index, 1, b1, b2);
  }
  return boxes.map(b => b.avgColor());
}
class VBox {
  constructor(pixels) { this.pixels = pixels; this.update(); }
  update() {
    let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
    for (const p of this.pixels) { if (p[0] < rMin) rMin = p[0]; if (p[0] > rMax) rMax = p[0]; if (p[1] < gMin) gMin = p[1]; if (p[1] > gMax) gMax = p[1]; if (p[2] < bMin) bMin = p[2]; if (p[2] > bMax) bMax = p[2]; }
    this.ranges = [rMax - rMin, gMax - gMin, bMax - bMin]; this.volume = this.ranges[0] * this.ranges[1] * this.ranges[2] * this.pixels.length;
  }
  canSplit() { return this.pixels.length > 1; }
  split() { const axis = this.ranges.indexOf(Math.max(...this.ranges)); this.pixels.sort((a, b) => a[axis] - b[axis]); const m = Math.floor(this.pixels.length / 2); return [new VBox(this.pixels.slice(0, m)), new VBox(this.pixels.slice(m))]; }
  avgColor() { let r = 0, g = 0, b = 0; for (const p of this.pixels) { r += p[0]; g += p[1]; b += p[2]; } const n = this.pixels.length; return `#${((1 << 24) + (Math.round(r / n) << 16) + (Math.round(g / n) << 8) + Math.round(b / n)).toString(16).slice(1).toUpperCase()}`; }
}
