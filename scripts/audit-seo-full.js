const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const BASE = 'https://vozvratidengi.ru';

function walk(dir, ext) {
  const out = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        out.push(...walk(p, ext));
      } else if (entry.isFile() && (!ext || entry.name.endsWith(ext))) {
        out.push(p);
      }
    }
  } catch (e) {}
  return out;
}

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1].replace(/<\/?[^>]+>/g, '').trim() : null;
}

function extractFirst(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

// Все HTML: корневые .html + папки с index.html
const rootHtml = fs.readdirSync(root).filter((f) => f.endsWith('.html')).map((f) => path.join(root, f));
const dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.'));
const indexFiles = [];
for (const d of dirs) {
  const indexPath = path.join(root, d.name, 'index.html');
  if (fs.existsSync(indexPath)) indexFiles.push(indexPath);
}
const allHtml = [...rootHtml, ...indexFiles];

function pathToUrl(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') return BASE + '/';
  if (rel.endsWith('/index.html')) return BASE + '/' + rel.slice(0, -11) + '/';
  return BASE + '/' + rel;
}

const rows = [];
const byTitle = {};
const byDesc = {};

for (const fp of allHtml) {
  const html = fs.readFileSync(fp, 'utf8');
  const rel = path.relative(root, fp).replace(/\\/g, '/');
  const expectedUrl = pathToUrl(fp);

  const title = extractFirst(html, /<title>([\s\S]*?)<\/title>/i);
  const desc = extractFirst(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canon = extractFirst(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const ogTitle = extractFirst(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i);
  const ogDesc = extractFirst(html, /<meta\s+property="og:description"\s+content="([^"]*)"/i);
  const h1 = extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const hasSchema = (html.match(/type="application\/ld\+json"/g) || []).length > 0;
  const hasOgImage = /<meta\s+property="og:image"\s+content="[^"]+"/i.test(html);
  const hasTwCard = /<meta\s+name="twitter:card"\s+content="[^"]+"/i.test(html);

  const issues = [];

  if (!title) issues.push('нет <title>');
  else {
    const len = title.length;
    if (len < 30) issues.push(`title короткий: ${len} симв. (рекоменд. 50–60)`);
    else if (len > 70) issues.push(`title длинный: ${len} симв. (рекоменд. до 70)`);
  }

  if (!desc) issues.push('нет meta description');
  else {
    const len = desc.length;
    if (len < 100) issues.push(`description короткий: ${len} симв. (рекоменд. 150–160)`);
    else if (len > 165) issues.push(`description длинный: ${len} симв. (рекоменд. до 160)`);
  }

  if (!canon && rel !== 'thank-you/index.html') issues.push('нет canonical');
  else if (canon && canon !== expectedUrl) issues.push(`canonical не совпадает с URL: ${canon}`);

  if (rel !== 'thank-you/index.html' && rel !== 'privacy.html' && rel !== 'offer.html' && rel !== 'terms.html') {
    if (!ogTitle) issues.push('нет og:title');
    if (!ogDesc) issues.push('нет og:description');
    if (!hasOgImage) issues.push('нет og:image');
    if (!hasTwCard) issues.push('нет twitter:card');
  }

  if (!h1 && !/noindex|thank-you|privacy|offer|terms/i.test(rel)) issues.push('нет H1');

  if (title) {
    byTitle[title] = (byTitle[title] || []).concat(rel);
  }
  if (desc) {
    byDesc[desc] = (byDesc[desc] || []).concat(rel);
  }

  rows.push({
    file: rel,
    url: expectedUrl,
    title,
    titleLen: title ? title.length : 0,
    desc,
    descLen: desc ? desc.length : 0,
    canonical: canon,
    h1: h1 ? (h1.length > 60 ? h1.slice(0, 57) + '...' : h1) : null,
    schema: hasSchema,
    og: !!ogTitle && !!ogDesc && hasOgImage,
    twitter: hasTwCard,
    issues,
  });
}

// Отчёт
const lines = [];
lines.push('=== ПОЛНАЯ ПРОВЕРКА SEO (title, description, canonical, OG, H1) ===\n');

// 1. Страницы с замечаниями
const withIssues = rows.filter((r) => r.issues.length > 0);
if (withIssues.length) {
  lines.push('--- Страницы с замечаниями ---');
  for (const r of withIssues) {
    lines.push(`\n${r.file}`);
    lines.push(`  URL: ${r.url}`);
    if (r.title) lines.push(`  Title (${r.titleLen}): ${r.title}`);
    if (r.desc) lines.push(`  Description (${r.descLen}): ${r.desc.slice(0, 80)}${r.desc.length > 80 ? '...' : ''}`);
    for (const i of r.issues) lines.push(`  ⚠ ${i}`);
  }
  lines.push('');
} else {
  lines.push('Страниц с замечаниями не найдено.\n');
}

// 2. Дубликаты title
const duplicateTitles = Object.entries(byTitle).filter(([, files]) => files.length > 1);
if (duplicateTitles.length) {
  lines.push('--- Дубликаты Title (желательно сделать уникальными) ---');
  for (const [t, files] of duplicateTitles) {
    lines.push(`  "${t.slice(0, 60)}${t.length > 60 ? '...' : ''}"`);
    for (const f of files) lines.push(`    - ${f}`);
  }
  lines.push('');
}

// 3. Дубликаты description
const duplicateDescs = Object.entries(byDesc).filter(([, files]) => files.length > 1);
if (duplicateDescs.length) {
  lines.push('--- Дубликаты Description (желательно сделать уникальными) ---');
  for (const [d, files] of duplicateDescs) {
    lines.push(`  "${d.slice(0, 55)}${d.length > 55 ? '...' : ''}"`);
    for (const f of files) lines.push(`    - ${f}`);
  }
  lines.push('');
}

// 4. Сводка по длинам
lines.push('--- Сводка: длина Title ---');
const shortTitle = rows.filter((r) => r.title && r.title.length < 30);
const longTitle = rows.filter((r) => r.title && r.title.length > 70);
const okTitle = rows.filter((r) => r.title && r.title.length >= 30 && r.title.length <= 70);
lines.push(`  Короткий (<30): ${shortTitle.length}`);
lines.push(`  Норма (30–70): ${okTitle.length}`);
lines.push(`  Длинный (>70): ${longTitle.length}`);

lines.push('\n--- Сводка: длина Description ---');
const shortDesc = rows.filter((r) => r.desc && r.desc.length < 100);
const longDesc = rows.filter((r) => r.desc && r.desc.length > 165);
const okDesc = rows.filter((r) => r.desc && r.desc.length >= 100 && r.desc.length <= 165);
lines.push(`  Короткий (<100): ${shortDesc.length}`);
lines.push(`  Норма (100–165): ${okDesc.length}`);
lines.push(`  Длинный (>165): ${longDesc.length}`);

// 5. Отсутствующие canonical / OG на важных страницах
const noCanon = rows.filter((r) => !r.canonical && !/thank-you|privacy|offer|terms/.test(r.file));
if (noCanon.length) {
  lines.push('\n--- Страницы без canonical ---');
  noCanon.forEach((r) => lines.push(`  ${r.file}`));
}

const noOg = rows.filter((r) => !r.og && !/thank-you|privacy|offer|terms/.test(r.file));
if (noOg.length) {
  lines.push('\n--- Страницы без полного OG (og:title + og:description + og:image) ---');
  noOg.forEach((r) => lines.push(`  ${r.file}`));
}

const noH1 = rows.filter((r) => !r.h1 && !/thank-you|privacy|offer|terms/.test(r.file));
if (noH1.length) {
  lines.push('\n--- Страницы без H1 ---');
  noH1.forEach((r) => lines.push(`  ${r.file}`));
}

lines.push('\n=== КОНЕЦ ОТЧЁТА ===');

const report = lines.join('\n');
console.log(report);

// Сохраняем в файл
const reportPath = path.join(root, 'SEO-AUDIT-FULL.txt');
fs.writeFileSync(reportPath, report, 'utf8');
console.log('\nОтчёт сохранён: SEO-AUDIT-FULL.txt');
