/**
 * Копирует DOCX из корня проекта в assets/documents/ с именами для сайта.
 * Запуск: node scripts/copy-docx-to-assets.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'assets', 'documents');

const mapping = [
  ['Сбербанк.docx', 'zajavlenie-sberbank.docx'],
  ['почтабанк страховка.docx', 'zajavlenie-pochta-bank.docx'],
  ['совкомбанк страховка.docx', 'zajavlenie-sovkombank.docx'],
  ['тбанк страховка.docx', 'zajavlenie-tinkoff.docx'],
];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let copied = 0;
for (const [srcName, destName] of mapping) {
  const src = path.join(root, srcName);
  const dest = path.join(outDir, destName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('OK:', srcName, '->', destName);
    copied++;
  } else {
    console.warn('Пропуск (нет файла):', srcName);
  }
}

// Универсальный бланк: копия одного из банковских
const universalSrc = path.join(root, 'Сбербанк.docx');
const universalDest = path.join(outDir, 'zajavlenie-universal.docx');
if (fs.existsSync(universalSrc)) {
  fs.copyFileSync(universalSrc, universalDest);
  console.log('OK: Сбербанк.docx -> zajavlenie-universal.docx');
  copied++;
}

console.log('\nСкопировано файлов:', copied);
