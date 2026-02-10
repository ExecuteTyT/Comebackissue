const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const alfaPath = path.join(root, 'vozvrat-strahovki-alfa-bank', 'index.html');
let html = fs.readFileSync(alfaPath, 'utf8');

const banks = [
  {
    slug: 'tinkoff',
    name: 'Тинькофф',
    nameGen: 'Тинькофф',
    nameLoc: 'Тинькофф',
    nameInstr: 'Тинькофф',
    insurer: 'Тинькофф Страхование',
    appName: 'приложение Тинькофф',
    pao: 'ПАО «Тинькофф Банк»',
    ao: 'АО «Тинькофф Страхование»',
    avgReturn: '68 000',
    pct: '74',
    successPct: '91',
    keywords: 'возврат страховки тинькофф, как вернуть страховку в тинькофф, тинькофф страхование возврат',
  },
  {
    slug: 'sovkombank',
    name: 'Совкомбанк',
    nameGen: 'Совкомбанка',
    nameLoc: 'Совкомбанке',
    nameInstr: 'Совкомбанка',
    insurer: 'Совкомбанк Страхование',
    appName: 'приложение Совкомбанка',
    pao: 'ПАО «Совкомбанк»',
    ao: 'АО «Совкомбанк Страхование»',
    avgReturn: '65 000',
    pct: '72',
    successPct: '90',
    keywords: 'возврат страховки совкомбанк, как вернуть страховку в совкомбанке, совкомбанк страхование возврат',
  },
  {
    slug: 'rshb',
    name: 'Россельхозбанк',
    nameGen: 'Россельхозбанка',
    nameLoc: 'Россельхозбанке',
    nameInstr: 'Россельхозбанка',
    insurer: 'РСХБ Страхование',
    appName: 'личный кабинет Россельхозбанка',
    pao: 'ПАО «Россельхозбанк»',
    ao: 'АО «РСХБ Страхование»',
    avgReturn: '64 000',
    pct: '71',
    successPct: '89',
    keywords: 'возврат страховки россельхозбанк, как вернуть страховку в россельхозбанке, рсхб страхование возврат',
  },
  {
    slug: 'pochta-bank',
    name: 'Почта Банк',
    nameGen: 'Почта Банка',
    nameLoc: 'Почта Банке',
    nameInstr: 'Почта Банка',
    insurer: 'Почта Страхование',
    appName: 'приложение Почта Банка',
    pao: 'ПАО «Почта Банк»',
    ao: 'АО «Почта Страхование»',
    avgReturn: '63 000',
    pct: '70',
    successPct: '88',
    keywords: 'возврат страховки почта банк, как вернуть страховку в почта банке, почта банк страхование возврат',
  },
  {
    slug: 'gazprombank',
    name: 'Газпромбанк',
    nameGen: 'Газпромбанка',
    nameLoc: 'Газпромбанке',
    nameInstr: 'Газпромбанка',
    insurer: 'Газпромбанк Страхование',
    appName: 'приложение Газпромбанка',
    pao: 'ПАО «Газпромбанк»',
    ao: 'АО «Газпромбанк Страхование»',
    avgReturn: '66 000',
    pct: '73',
    successPct: '90',
    keywords: 'возврат страховки газпромбанк, как вернуть страховку в газпромбанке, газпромбанк страхование возврат',
  },
];

banks.forEach((b) => {
  let content = html
    .replace(/vozvrat-strahovki-alfa-bank/g, `vozvrat-strahovki-${b.slug}`)
    .replace(/Альфа-Банка/g, b.nameGen)
    .replace(/Альфа-Банке/g, b.nameLoc)
    .replace(/Альфа-Банку/g, b.nameGen)
    .replace(/Альфа-Банком/g, b.nameInstr)
    .replace(/Альфа-Банк/g, b.name)
    .replace(/альфа банк, как вернуть страховку в альфа банке, альфастрахование возврат/g, b.keywords)
    .replace(/АльфаСтрахование/g, b.insurer)
    .replace(/приложение Альфа-Банка/g, b.appName)
    .replace(/ПАО «Альфа-Банк»/g, b.pao)
    .replace(/АО «АльфаСтрахование»/g, b.ao)
    .replace(/РАССЧИТАТЬ ВОЗВРАТ ИЗ АЛЬФА-БАНКА/g, `РАССЧИТАТЬ ВОЗВРАТ ИЗ ${b.name.toUpperCase()}`)
    .replace(/СКАЧАТЬ БЛАНК ДЛЯ АЛЬФА-БАНКА/g, `СКАЧАТЬ БЛАНК ДЛЯ ${b.name.toUpperCase()}`)
    .replace(/образец заявления для Альфа-Банка/g, `образец заявления для ${b.name}`)
    .replace(/70 000/g, b.avgReturn)
    .replace(/76%/g, `${b.pct}%`)
    .replace(/93%/g, `${b.successPct}%`);
  const outDir = path.join(root, `vozvrat-strahovki-${b.slug}`);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), content, 'utf8');
  console.log('Created vozvrat-strahovki-' + b.slug);
});

console.log('Done.');
