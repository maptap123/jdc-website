/**
 * download-images.js
 * Downloads all Cloudinary images, compresses them, saves locally,
 * then rewrites all HTML files to use the local paths.
 *
 * Run: node download-images.js
 * Resumable: safe to re-run, already-downloaded images are skipped.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────────────────
const IMAGES_DIR    = path.resolve(__dirname, 'images');
const PROGRESS_FILE = path.resolve(__dirname, 'download_progress.json');
const MAX_WIDTH     = 1920;   // max px wide (portrait images keep aspect ratio)
const JPEG_QUALITY  = 82;
const CONCURRENCY   = 8;      // parallel downloads

const HTML_FILES = [
  'index.html',
  'about.html',
  'quote.html',
  'remodeling.html',
  'remodeling-bathroom.html',
  'remodeling-kitchen.html',
  'remodeling-whole-home.html',
  'remodeling-addition.html',
  'custom-home.html',
  'custom-home-portfolio.html',
  'custom-home-process.html',
  'portfolio-alice.html',
  'portfolio-cameron.html',
  'portfolio-caudill.html',
  'portfolio-cleeter.html',
  'portfolio-drouge.html',
  'portfolio-larkin.html',
  'portfolio-perfect.html',
  'articles.html',
  'articles/_TEMPLATE.html',
  'articles/home-addition-cost-2026.html',
  'articles/how-long-does-a-bathroom-remodel-take.html',
  'articles/how-long-does-a-kitchen-remodel-take.html',
  'articles/how-much-does-a-bathroom-remodel-cost.html',
  'articles/how-much-does-a-kitchen-remodel-cost.html',
  'articles/how-to-choose-a-custom-home-builder.html',
  'articles/how-to-remodel-a-bathroom.html',
];
// ─────────────────────────────────────────────────────────────────────────────

/** Extract the stable path key from any Cloudinary URL (strips transforms + version) */
function getCloudinaryKey(url) {
  try {
    const clean = url.split('?')[0];
    const match = clean.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

/** Find every unique Cloudinary URL referenced in the HTML files */
function extractUniqueUrls() {
  const CLOUDINARY_RE = /https:\/\/res\.cloudinary\.com\/dybuigweq\/image\/upload\/[^\s"'>)\]]+/g;
  const seen = new Map(); // key → first URL seen (to use for download)
  for (const rel of HTML_FILES) {
    const fp = path.resolve(__dirname, rel);
    if (!fs.existsSync(fp)) continue;
    const content = fs.readFileSync(fp, 'utf8');
    for (const match of content.matchAll(CLOUDINARY_RE)) {
      const url = match[0];
      const key = getCloudinaryKey(url);
      if (key && !seen.has(key)) seen.set(key, url);
    }
  }
  return seen; // Map<key, canonicalUrl>
}

/** Download + compress one image to disk */
async function downloadAndCompress(url, key) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  // Normalize extension from the URL pathname
  const urlPath = new URL(url).pathname;
  const ext = path.extname(urlPath).toLowerCase() || '.jpg';

  // Build local save path, preserving folder structure
  const localPath = path.join(IMAGES_DIR, ...key.split('/'));
  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  let processor = sharp(buffer).resize({ width: MAX_WIDTH, withoutEnlargement: true });

  if (ext === '.png') {
    await processor.png({ compressionLevel: 8 }).toFile(localPath);
  } else if (ext === '.webp') {
    await processor.webp({ quality: JPEG_QUALITY }).toFile(localPath);
  } else if (ext === '.gif') {
    fs.writeFileSync(localPath, buffer); // skip processing animated gifs
  } else {
    await processor.jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true }).toFile(localPath);
  }

  return localPath;
}

/** Run async tasks with a max concurrency */
async function withConcurrency(items, fn, limit) {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

/** Replace Cloudinary URLs in all HTML files */
function updateHtmlFiles(keyToLocalUrl) {
  const CLOUDINARY_RE = /https:\/\/res\.cloudinary\.com\/dybuigweq\/image\/upload\/[^\s"'>)\]]+/g;
  let totalReplaced = 0;

  for (const rel of HTML_FILES) {
    const fp = path.resolve(__dirname, rel);
    if (!fs.existsSync(fp)) continue;

    let content = fs.readFileSync(fp, 'utf8');
    let count = 0;

    const updated = content.replace(CLOUDINARY_RE, (match) => {
      const key = getCloudinaryKey(match);
      if (key && keyToLocalUrl[key]) { count++; return keyToLocalUrl[key]; }
      return match;
    });

    if (count > 0) {
      fs.writeFileSync(fp, updated, 'utf8');
      console.log(`  ✓ ${rel} — ${count} URL(s) updated`);
      totalReplaced += count;
    }
  }
  console.log(`\n✅ ${totalReplaced} URLs replaced across HTML files\n`);
}

async function main() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const progress = fs.existsSync(PROGRESS_FILE)
    ? JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
    : {};

  const urlMap = extractUniqueUrls(); // Map<key, url>
  const entries = [...urlMap.entries()];
  console.log(`\n🔍 Found ${entries.length} unique images across ${HTML_FILES.length} HTML files\n`);

  let done = 0, skipped = 0, failed = 0;

  await withConcurrency(entries, async ([key, url], i) => {
    const localPath = path.join(IMAGES_DIR, ...key.split('/'));

    if (progress[key] || fs.existsSync(localPath)) {
      if (!progress[key]) {
        // Already on disk from prior run, record it
        const ext = path.extname(localPath).toLowerCase() || '.jpg';
        progress[key] = `/images/${key}`;
      }
      skipped++;
      done++;
      return;
    }

    try {
      await downloadAndCompress(url, key);
      progress[key] = `/images/${key}`;
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      done++;
      process.stdout.write(`  ✓ [${done}/${entries.length}] ${key}\n`);
    } catch (err) {
      process.stdout.write(`  ✗ [${i + 1}/${entries.length}] FAILED ${key}: ${err.message}\n`);
      failed++;
    }
  }, CONCURRENCY);

  console.log(`\n📦 Download complete — ✓ ${done - skipped} new, ⏭ ${skipped} skipped, ✗ ${failed} failed\n`);

  // Compute image sizes saved
  const totalBytes = Object.keys(progress).reduce((sum, key) => {
    const lp = path.join(IMAGES_DIR, ...key.split('/'));
    return sum + (fs.existsSync(lp) ? fs.statSync(lp).size : 0);
  }, 0);
  console.log(`💾 Total compressed size: ${(totalBytes / 1024 / 1024).toFixed(1)} MB\n`);

  console.log('📝 Updating HTML files…\n');
  updateHtmlFiles(progress);

  console.log('🎉 Done! Next steps:');
  console.log('   git add -A');
  console.log('   git commit -m "feat: migrate images from Cloudinary to local (compressed)"');
  console.log('   git push\n');
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
