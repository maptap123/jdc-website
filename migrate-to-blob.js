/**
 * migrate-to-blob.js
 * Migrates all Cloudinary images to Vercel Blob and updates HTML files.
 *
 * Usage:
 *   $env:BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_xxxx..."
 *   node migrate-to-blob.js
 *
 * Resumable: safe to re-run; already-uploaded images are skipped.
 */

const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const CLOUDINARY_JSON = './all_cloudinary.json';
const MAPPING_FILE    = './blob_mapping.json';   // progress file (auto-saved)
const DELAY_MS        = 100;                      // ms between uploads

// All HTML files to update (relative to this script)
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
// ────────────────────────────────────────────────────────────────────────────

/**
 * Given any Cloudinary URL (with or without transformation params),
 * returns the stable path key, e.g. "Jobs/Perfect/20250929-AJW_7443.jpg"
 *
 * Cloudinary URL shape:
 *   .../upload/[transforms/]v{digits}/{path}
 */
function getCloudinaryKey(url) {
  try {
    // Strip query string first
    const cleanUrl = url.split('?')[0];
    // Match everything after the version segment
    const match = cleanUrl.match(/\/upload\/(?:[^/]+\/)*v\d+\/(.+)$/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function getContentType(urlOrPath) {
  const ext = path.extname(urlOrPath).toLowerCase();
  const map = {
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.svg':  'image/svg+xml',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
  };
  return map[ext] || 'image/jpeg';
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadImages(token) {
  const allCloudinary = JSON.parse(fs.readFileSync(CLOUDINARY_JSON, 'utf8'));
  const mapping = fs.existsSync(MAPPING_FILE)
    ? JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'))
    : {};

  const entries = Object.entries(allCloudinary);
  let done = 0, skipped = 0, failed = 0;

  console.log(`\n📦 Starting migration of ${entries.length} images…\n`);

  for (const [name, cloudUrl] of entries) {
    const key = getCloudinaryKey(cloudUrl);
    if (!key) {
      console.warn(`  ⚠ Could not parse key for: ${cloudUrl}`);
      failed++;
      continue;
    }

    if (mapping[key]) {
      process.stdout.write(`  ✓ [${++done}/${entries.length}] ${key}\r`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`  ⬇ [${done + 1}/${entries.length}] Downloading: ${name}…\r`);
      const buffer = await downloadBuffer(cloudUrl);

      const blobPath = `jdc-images/${key}`;
      const contentType = getContentType(cloudUrl);

      process.stdout.write(`  ⬆ [${done + 1}/${entries.length}] Uploading:   ${key}…  \r`);
      const blob = await put(blobPath, buffer, {
        access: 'public',
        token,
        contentType,
        addRandomSuffix: false,
      });

      mapping[key] = blob.url;
      // Save progress after every upload so re-runs skip finished work
      fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
      done++;
      console.log(`  ✓ [${done}/${entries.length}] ${key}`);
    } catch (err) {
      console.error(`\n  ✗ Failed: ${name}: ${err.message}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n✅ Upload complete — done: ${done}, skipped (already uploaded): ${skipped}, failed: ${failed}\n`);
  return mapping;
}

function updateHtmlFiles(mapping) {
  // Build a regex that matches any Cloudinary URL for this account
  const CLOUDINARY_RE = /https:\/\/res\.cloudinary\.com\/dybuigweq\/image\/upload\/[^\s"'>)\]]+/g;

  let totalReplaced = 0;

  for (const relPath of HTML_FILES) {
    const filePath = path.resolve(__dirname, relPath);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ File not found, skipping: ${relPath}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let replaced = 0;
    let notFound = [];

    const newContent = content.replace(CLOUDINARY_RE, (match) => {
      const key = getCloudinaryKey(match);
      if (key && mapping[key]) {
        replaced++;
        return mapping[key];
      }
      notFound.push(match);
      return match; // leave unchanged if not in mapping
    });

    if (replaced > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  ✓ ${relPath} — replaced ${replaced} URL(s)`);
      totalReplaced += replaced;
    } else {
      console.log(`  – ${relPath} — no Cloudinary URLs found`);
    }

    if (notFound.length > 0) {
      console.warn(`    ⚠ ${notFound.length} URL(s) had no mapping (left unchanged):`);
      notFound.slice(0, 3).forEach(u => console.warn(`      ${u}`));
      if (notFound.length > 3) console.warn(`      …and ${notFound.length - 3} more`);
    }
  }

  console.log(`\n✅ HTML update complete — ${totalReplaced} total URLs replaced across ${HTML_FILES.length} files\n`);
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error(`
❌ Missing BLOB_READ_WRITE_TOKEN

To get your token:
  1. Go to https://vercel.com/dashboard
  2. Click "Storage" in the left sidebar
  3. Create a Blob store (or open an existing one)
  4. Go to the ".env.local" tab and copy BLOB_READ_WRITE_TOKEN

Then run:
  $env:BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_YOUR_TOKEN_HERE"
  node migrate-to-blob.js
`);
    process.exit(1);
  }

  // Step 1: Upload all images to Vercel Blob
  const mapping = await uploadImages(token);

  // Step 2: Update all HTML files
  console.log('📝 Updating HTML files…\n');
  updateHtmlFiles(mapping);

  console.log('🎉 Done! Next steps:');
  console.log('   1. Review the changes with: git diff');
  console.log('   2. Commit and push: git add -A && git commit -m "migrate: Cloudinary → Vercel Blob"');
  console.log('   3. Delete your Cloudinary account to stop the billing warning');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
