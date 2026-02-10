const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function has(html, re) {
  return re.test(html);
}

function fileExistsFromUrl(url) {
  // Only validate local absolute paths (/assets/.., /src/..)
  if (!url || !url.startsWith('/')) return null;
  const fp = path.join(root, url.replace(/\//g, path.sep));
  return fs.existsSync(fp);
}

const targets = [
  'vozvrat-strahovki-dosrochno/index.html',
  'vozvrat-strahovki-sberbank/index.html',
  'vozvrat-strahovki-vtb/index.html',
  'vozvrat-strahovki-alfa-bank/index.html',
  'vozvrat-strahovki-tinkoff/index.html',
  'vozvrat-strahovki-sovkombank/index.html',
  'vozvrat-strahovki-rshb/index.html',
  'vozvrat-strahovki-pochta-bank/index.html',
  'vozvrat-strahovki-gazprombank/index.html',
  'zajavlenie-na-vozvrat-strahovki/index.html',
  'blog/index.html',
  ...walk(path.join(root, 'blog'))
    .filter((p) => p.endsWith(path.sep + 'index.html'))
    .map((p) => path.relative(root, p).replace(/\\/g, '/'))
    .filter((p) => p !== 'blog/index.html'),
  'faq/index.html',
  'kalkulyator/index.html',
  'uslugi/index.html',
];

const uniqTargets = Array.from(new Set(targets));

const issues = [];

for (const rel of uniqTargets) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) continue;
  const html = fs.readFileSync(fp, 'utf8');

  const title = extract(html, /<title>([\s\S]*?)<\/title>/i);
  const desc = extract(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canon = extract(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const ogTitle = extract(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i);
  const ogDesc = extract(html, /<meta\s+property="og:description"\s+content="([^"]*)"/i);
  const ogImage = extract(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i);
  const twCard = extract(html, /<meta\s+name="twitter:card"\s+content="([^"]*)"/i);

  const fileIssues = [];
  if (!title) fileIssues.push('missing <title>');
  if (!desc) fileIssues.push('missing meta description');
  if (!canon) fileIssues.push('missing canonical');
  if (!ogTitle) fileIssues.push('missing og:title');
  if (!ogDesc) fileIssues.push('missing og:description');
  if (!ogImage) fileIssues.push('missing og:image');
  if (!twCard) fileIssues.push('missing twitter:card');

  if (title && (title.length < 10 || title.length > 75)) fileIssues.push(`title length ${title.length}`);
  if (desc && (desc.length < 70 || desc.length > 180)) fileIssues.push(`description length ${desc.length}`);

  // Detect broken common local assets
  if (has(html, /assets\/og-image\.jpg/)) fileIssues.push('references assets/og-image.jpg (check exists)');

  // Check favicon png references existence
  const fav32 = extract(html, /href="([^"]*favicon-32x32\.png)"/i);
  const fav16 = extract(html, /href="([^"]*favicon-16x16\.png)"/i);
  if (fav32 && fav32.startsWith('/')) {
    if (!fileExistsFromUrl(fav32)) fileIssues.push(`broken favicon: ${fav32}`);
  }
  if (fav16 && fav16.startsWith('/')) {
    if (!fileExistsFromUrl(fav16)) fileIssues.push(`broken favicon: ${fav16}`);
  }

  // Quick schema presence
  const schemaCount = (html.match(/type="application\/ld\+json"/g) || []).length;
  if (schemaCount === 0) fileIssues.push('no JSON-LD schema found');

  if (fileIssues.length) {
    issues.push({ file: rel, issues: fileIssues });
  }
}

if (!issues.length) {
  console.log('SEO audit: no issues found in targets.');
  process.exit(0);
}

console.log('SEO audit issues:');
for (const it of issues) {
  console.log(`- ${it.file}`);
  for (const i of it.issues) console.log(`  - ${i}`);
}

