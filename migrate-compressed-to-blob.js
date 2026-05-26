/**
 * migrate-compressed-to-blob.js
 * Downloads Cloudinary images → compresses with sharp → uploads to Vercel Blob
 * Resumable: re-running skips already-uploaded images.
 *
 * Run:
 *   $env:BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_..."
 *   node migrate-compressed-to-blob.js
 */

const { put } = require('@vercel/blob');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────────────────
const MAPPING_FILE  = path.resolve(__dirname, 'blob_mapping.json');
const MAX_WIDTH     = 1920;
const JPEG_QUALITY  = 82;
const CONCURRENCY   = 6;

const HTML_FILES = [
  'index.html', 'about.html', 'quote.html',
  'remodeling.html', 'remodeling-bathroom.html', 'remodeling-kitchen.html',
  'remodeling-whole-home.html', 'remodeling-addition.html',
  'custom-home.html', 'custom-home-portfolio.html', 'custom-home-process.html',
  'portfolio-alice.html', 'portfolio-cameron.html', 'portfolio-caudill.html',
  'portfolio-cleeter.html', 'portfolio-drouge.html', 'portfolio-larkin.html',
  'portfolio-perfect.html', 'articles.html', 'articles/_TEMPLATE.html',
  'articles/home-addition-cost-2026.html',
  'articles/how-long-does-a-bathroom-remodel-take.html',
  'articles/how-long-does-a-kitchen-remodel-take.html',
  'articles/how-much-does-a-bathroom-remodel-cost.html',
  'articles/how-much-does-a-kitchen-remodel-cost.html',
  'articles/how-to-choose-a-custom-home-builder.html',
  'articles/how-to-remodel-a-bathroom.html',
];
// ─────────────────────────────────────────────────────────────────────────────

function getCloudinaryKey(url) {
  try {
    const clean = url.split('?')[0];
    const match = clean.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

function extractUniqueUrls() {
  const RE = /https:\/\/res\.cloudinary\.com\/dybuigweq\/image\/upload\/[^\s"'>)\]]+/g;
  const seen = new Map();
  for (const rel of HTML_FILES) {
    const fp = path.resolve(__dirname, rel);
    if (!fs.existsSync(fp)) continue;
    for (const m of fs.readFileSync(fp, 'utf8').matchAll(RE)) {
      const key = getCloudinaryKey(m[0]);
      if (key && !seen.has(key)) seen.set(key, m[0]);
    }
  }
  return seen;
}

async function downloadAndCompress(url, key) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const ext = path.extname(new URL(url).pathname).toLowerCase() || '.jpg';
  let processor = sharp(buf).resize({ width: MAX_WIDTH, withoutEnlargement: true });

  let compressed, contentType;
  if (ext === '.png') {
    compressed = await processor.png({ compressionLevel: 8 }).toBuffer();
    contentType = 'image/png';
  } else if (ext === '.webp') {
    compressed = await processor.webp({ quality: JPEG_QUALITY }).toBuffer();
    contentType = 'image/webp';
  } else {
    compressed = await processor.jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true }).toBuffer();
    contentType = 'image/jpeg';
  }
  return { compressed, contentType };
}

async function withConcurrency(items, fn, limit) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  }));
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) { console.error('❌ Set BLOB_READ_WRITE_TOKEN env var'); process.exit(1); }

  const mapping = fs.existsSync(MAPPING_FILE)
    ? JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8')) : {};

  const urlMap  = extractUniqueUrls();
  const entries = [...urlMap.entries()];
  console.log(`\n📦 ${entries.length} unique images to migrate\n`);

  let done = 0, skipped = 0, failed = 0;
  const startTime = Date.now();

  await withConcurrency(entries, async ([key, url]) => {
    if (mapping[key]) { skipped++; done++; return; }

    try {
      const { compressed, contentType } = await downloadAndCompress(url, key);
      const blob = await put(`jdc-images/${key}`, compressed, {
        access: 'public', token, contentType, addRandomSuffix: false,
      });
      mapping[key] = blob.url;
      fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
      done++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`  ✓ [${done}/${entries.length}] ${key} (${(compressed.length/1024).toFixed(0)}KB) [${elapsed}s]`);
    } catch (err) {
      console.error(`  ✗ FAILED ${key}: ${err.message}`);
      failed++;
    }
  }, CONCURRENCY);

  console.log(`\n✅ Upload done — ✓ ${done - skipped} new, ⏭ ${skipped} already done, ✗ ${failed} failed`);

  // ── Update HTML files ──────────────────────────────────────────────────────
  console.log('\n📝 Updating HTML files…\n');
  const RE = /https:\/\/res\.cloudinary\.com\/dybuigweq\/image\/upload\/[^\s"'>)\]]+/g;
  let totalReplaced = 0;

  for (const rel of HTML_FILES) {
    const fp = path.resolve(__dirname, rel);
    if (!fs.existsSync(fp)) continue;
    let count = 0;
    const updated = fs.readFileSync(fp, 'utf8').replace(RE, (match) => {
      const key = getCloudinaryKey(match);
      if (key && mapping[key]) { count++; return mapping[key]; }
      return match;
    });
    if (count > 0) {
      fs.writeFileSync(fp, updated, 'utf8');
      console.log(`  ✓ ${rel} — ${count} URL(s) replaced`);
      totalReplaced += count;
    }
  }

  console.log(`\n✅ ${totalReplaced} URLs replaced\n`);
  console.log('🎉 Migration complete! Run:');
  console.log('   git add -A');
  console.log('   git commit -m "migrate: Cloudinary → Vercel Blob (compressed)"');
  console.log('   git push\n');
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
