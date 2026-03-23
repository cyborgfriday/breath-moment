/**
 * prepare-ext.mjs
 * Post-build script: cleans up Next.js output so Chrome Extension can load it.
 *
 * Problems solved:
 *  1. Chrome forbids root files/dirs starting with "_" → rename _next/ → ext_assets/
 *  2. Next.js leaves __next.*.txt metadata files → delete them
 *  3. _not-found/ and 404/ are useless in an extension → delete them
 *  4. Chrome MV3 CSP blocks inline <script> → extract to external .js files
 */

import { readFileSync, writeFileSync, renameSync, rmSync, readdirSync, mkdirSync, copyFileSync } from "fs";
import { join, resolve } from "path";

const OUT = resolve(process.cwd(), "breath-moment");

// ── 1. Replace all /_next/ references in HTML and JS/CSS files ───────────────
function replaceInFile(filePath) {
  const original = readFileSync(filePath, "utf8");
  const updated = original.replaceAll("/_next/", "/ext_assets/");
  if (updated !== original) {
    writeFileSync(filePath, updated, "utf8");
    console.log(`  patched: ${filePath.replace(OUT, "out")}`);
  }
}

function walkAndPatch(dir, exts) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndPatch(full, exts);
    } else if (exts.some(e => entry.name.endsWith(e))) {
      replaceInFile(full);
    }
  }
}

console.log("🔧 Patching /_next/ references → /ext_assets/ ...");
walkAndPatch(OUT, [".html", ".js", ".css", ".json"]);

// ── 2. Rename _next/ → ext_assets/ ──────────────────────────────────────────
console.log("📁 Renaming _next/ → ext_assets/ ...");
try { renameSync(join(OUT, "_next"), join(OUT, "ext_assets")); } catch {}

// ── 3. Remove files Chrome can't handle and unneeded extras ─────────────────
const toDelete = [
  // Next.js metadata
  "__next.__PAGE__.txt",
  "__next._full.txt",
  "__next._head.txt",
  "__next._index.txt",
  "__next._tree.txt",
  "index.txt",
  // Unused pages
  "404.html",
  "_not-found",
  "404",
  // Unused assets from create-next-app template
  "images",
  "file.svg",
  "globe.svg",
  "next.svg",
  "vercel.svg",
  "window.svg",
  "favicon.ico",
];

console.log("🗑  Removing unused files ...");
for (const name of toDelete) {
  const p = join(OUT, name);
  try {
    rmSync(p, { recursive: true, force: true });
    console.log(`  removed: ${name}`);
  } catch {
    // already gone, fine
  }
}

// ── 4. Extract inline <script> → external files (MV3 CSP requires no inline JS) ──
console.log("📜 Extracting inline scripts → external files ...");

function extractInlineScripts(htmlPath) {
  let html = readFileSync(htmlPath, "utf8");

  // Match inline <script> tags (no src attribute), capturing optional attributes and body
  // Also handle nonce attributes that Chrome extension CSP ignores anyway
  const inlineScriptRe = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;

  const inlineDir = join(OUT, "ext_assets", "inline");
  mkdirSync(inlineDir, { recursive: true });

  let idx = 0;
  html = html.replace(inlineScriptRe, (match, body) => {
    const trimmed = body.trim();
    if (!trimmed) return match; // empty script tag, leave it
    const fileName = `inline_${idx++}.js`;
    const filePath = join(inlineDir, fileName);
    writeFileSync(filePath, trimmed, "utf8");
    console.log(`  extracted: ext_assets/inline/${fileName} (${trimmed.length} chars)`);
    return `<script src="/ext_assets/inline/${fileName}"></script>`;
  });

  writeFileSync(htmlPath, html, "utf8");
}

extractInlineScripts(join(OUT, "index.html"));

// ── 5. Copy landing page → 開始使用.html (for zip distribution) ──────────────
console.log("🌐 Copying landing page → 開始使用.html ...");
const ROOT = resolve(process.cwd());
copyFileSync(join(ROOT, "index.html"), join(ROOT, "Start Here · 開始使用.html"));
console.log("  copied: Start Here · 開始使用.html");

console.log("✅ Extension output ready in breath-moment/");
console.log("📦 To share: zip 'Start Here · 開始使用.html' + breath-moment/ together");
