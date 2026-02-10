const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const base = (slug, title, description, headline, breadcrumbName, body) => `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <title>${title} | vozvratidengi.ru</title>
    <link rel="canonical" href="https://vozvratidengi.ru/blog/${slug}/">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://vozvratidengi.ru/blog/${slug}/">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="https://vozvratidengi.ru/assets/reviews/review-1.jpeg">
    <meta property="og:site_name" content="vozvratidengi.ru">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <link rel="icon" type="image/svg+xml" href="../../assets/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={theme:{extend:{colors:{primary:'#1E3A8A',secondary:'#F97316',success:'#10B981'},fontFamily:{heading:['Montserrat','sans-serif'],body:['Inter','sans-serif']}}}}</script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css">
    <link rel="stylesheet" href="../../src/css/style.css">
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Article","headline":"${headline.replace(/"/g, '\\"')}","description":"${description.replace(/"/g, '\\"')}","author":{"@type":"Organization","name":"vozvratidengi.ru"},"publisher":{"@type":"Organization","name":"vozvratidengi.ru","logo":{"@type":"ImageObject","url":"https://vozvratidengi.ru/assets/logo-main.svg"}},"datePublished":"2025-02-09","dateModified":"2025-02-09"}
    </script>
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Главная","item":"https://vozvratidengi.ru/"},{"@type":"ListItem","position":2,"name":"Блог","item":"https://vozvratidengi.ru/blog/"},{"@type":"ListItem","position":3,"name":"${breadcrumbName.replace(/"/g, '\\"')}"}]}
    </script>
</head>
<body class="font-body text-textDark">
    <header id="header" class="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div class="container mx-auto px-6 lg:px-16">
            <nav class="flex items-center justify-between h-20">
                <a href="/" class="flex items-center flex-shrink-0">
                    <img src="../../assets/logo-main.svg" alt="Возврат страховки" class="h-16 w-auto">
                    <span class="text-xl font-heading font-bold text-primary uppercase ml-2">ВОЗВРАТ СТРАХОВКИ</span>
                </a>
                <ul class="hidden lg:flex items-center space-x-6">
                    <li><a href="/" class="hover:text-primary transition">Главная</a></li>
                    <li><a href="/uslugi/" class="hover:text-primary transition">Услуги</a></li>
                    <li><a href="/vozvrat-strahovki-dosrochno/" class="hover:text-primary transition">Досрочное погашение</a></li>
                    <li><a href="/kalkulyator/" class="hover:text-primary transition">Калькулятор</a></li>
                    <li><a href="/blog/" class="hover:text-primary transition">Блог</a></li>
                    <li><a href="/contacts/" class="hover:text-primary transition">Контакты</a></li>
                </ul>
                <a href="tel:+79061231522" class="text-primary font-bold">+7 906 123-15-22</a>
                <button onclick="openModal()" class="hidden lg:block bg-secondary text-white px-5 py-2 rounded-lg">Консультация</button>
            </nav>
        </div>
    </header>
    <main class="pt-24 pb-16">
        <div class="container mx-auto px-6 lg:px-16 max-w-4xl">
            <nav aria-label="breadcrumb" class="mb-6 text-sm text-gray-500">
                <a href="/" class="hover:text-secondary">Главная</a> &rarr; <a href="/blog/" class="hover:text-secondary">Блог</a> &rarr; <span class="text-primary font-semibold">${breadcrumbName}</span>
            </nav>
            <article>
                <h1 class="font-heading font-bold text-3xl md:text-4xl mb-6">${headline}</h1>
                ${body}
            </article>
            <section class="mt-12 p-8 bg-primary text-white rounded-2xl text-center">
                <h2 class="font-heading font-bold text-2xl mb-4">Бесплатная консультация по возврату страховки</h2>
                <p class="mb-6">Узнайте точную сумму возврата и сроки. Работаем без предоплаты.</p>
                <button onclick="openModal()" class="bg-secondary hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition">Оставить заявку</button>
            </section>
        </div>
    </main>
    <footer class="bg-gray-900 text-gray-400 py-8">
        <div class="container mx-auto px-6 text-center text-sm">© 2025 vozvratidengi.ru</div>
    </footer>
    <div id="modal" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-50 px-4">
        <div class="bg-white rounded-3xl p-8 max-w-md w-full relative" onclick="event.stopPropagation()">
            <button onclick="closeModal()" class="absolute top-4 right-4 text-2xl">&times;</button>
            <h2 class="text-2xl font-bold mb-4 text-center">Бесплатная консультация</h2>
            <form id="modal-form" onsubmit="handleFormSubmit(event, 'modal')" class="space-y-4">
                <input type="text" name="name" placeholder="Ваше имя" required class="w-full h-12 px-4 border rounded-lg">
                <input type="tel" name="phone" id="modal-phone" placeholder="Телефон" required class="w-full h-12 px-4 border rounded-lg">
                <input type="checkbox" id="c" required><label for="c">Согласие с политикой конфиденциальности</label>
                <button type="submit" class="w-full bg-secondary text-white font-bold py-3 rounded-lg">Отправить</button>
            </form>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>
    <script>AOS.init({ once: true });</script>
    <script src="../../src/js/main.js"></script>
    <script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=105345372','ym');ym(105345372,'init',{webvisor:true});</script>
</body>
</html>`;

const articles = [
  {
    slug: 'kak-vernut-strahovku-dosrochno-2025',
    title: 'Как вернуть страховку при досрочном погашении в 2025',
    description: 'Пошаговая инструкция возврата страховки при досрочном погашении кредита. Закон, формула расчёта, образец заявления. Без предоплаты.',
    headline: 'Как вернуть страховку при досрочном погашении в 2025',
    breadcrumbName: 'Возврат при досрочном погашении',
    body: `
    <p class="text-gray-700 leading-relaxed mb-4">Досрочно погасили кредит и платили за страховку? Вы вправе вернуть часть страховой премии за неиспользованный период. В 2025 году правила не изменились: <a href="/vozvrat-strahovki-dosrochno/" class="text-primary hover:text-secondary font-medium">возврат страховки при досрочном погашении</a> регулируется статьёй 958 ГК РФ и Указанием ЦБ № 3854-У.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Кто может вернуть страховку</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Любой заемщик, оформивший кредит со страховкой жизни, КАСКО или иной навязанной услугой и затем погасивший кредит досрочно. Не важно, прошло 3 месяца или 2 года — срок исковой давности 3 года.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Формула расчёта</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Возврат = (Сумма страховки ÷ Срок кредита в месяцах) × Неиспользованные месяцы. Удобно посчитать в нашем <a href="/kalkulyator/" class="text-primary hover:text-secondary font-medium">калькуляторе возврата страховки</a>. При отказе банка можно взыскать через суд с неустойкой и процентами.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Что делать по шагам</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Соберите кредитный и страховой договоры, справку о досрочном погашении. Напишите заявление в банк или страховую — образцы есть в разделе <a href="/zajavlenie-na-vozvrat-strahovki/" class="text-primary hover:text-secondary font-medium">«Заявление на возврат страховки»</a>. Срок ответа по закону — 10 рабочих дней. Если откажут — мы поможем взыскать через суд без предоплаты.</p>
    <img src="../../assets/reviews/review-1.jpeg" alt="Возврат страховки при досрочном погашении кредита" class="w-full rounded-xl my-6" loading="lazy" width="800" height="450">
    `
  },
  {
    slug: 'zajavlenie-na-vozvrat-obrazec',
    title: 'Заявление на возврат страховки: образец 2025',
    description: 'Универсальный образец заявления на возврат страховки по кредиту. Как написать, куда подавать, образцы для Сбербанка, ВТБ, Альфа.',
    headline: 'Заявление на возврат страховки: образец 2025',
    breadcrumbName: 'Образец заявления',
    body: `
    <p class="text-gray-700 leading-relaxed mb-4">Правильно составленное заявление ускоряет возврат. В нём указывают ФИО, реквизиты договора страхования и кредита, сумму страховки, требование о возврате и реквизиты счёта. Готовые бланки для разных банков можно <a href="/zajavlenie-na-vozvrat-strahovki/" class="text-primary hover:text-secondary font-medium">скачать на нашем сайте</a>.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Куда подавать заявление</h2>
    <p class="text-gray-700 leading-relaxed mb-4">В банк (если страховка оформлялась через банк) или напрямую в страховую компанию. Подать можно лично, заказным письмом с уведомлением или через личный кабинет — например, <a href="/vozvrat-strahovki-sberbank/" class="text-primary hover:text-secondary font-medium">Сбербанк</a> и <a href="/vozvrat-strahovki-vtb/" class="text-primary hover:text-secondary font-medium">ВТБ</a> принимают заявления онлайн.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Сроки ответа</h2>
    <p class="text-gray-700 leading-relaxed mb-4">По закону — 10 рабочих дней. На практике ответ часто приходит через 30–60 дней. При отказе можно подать претензию и затем иск. Мы ведём дела без предоплаты.</p>
    <img src="../../assets/reviews/review-2.jpeg" alt="Образец заявления на возврат страховки" class="w-full rounded-xl my-6" loading="lazy" width="800" height="450">
    `
  },
  {
    slug: 'srok-iskovoj-davnosti-vozvrat',
    title: 'Срок исковой давности по возврату страховки',
    description: 'Срок исковой давности при возврате навязанной страховки — 3 года. С какого момента считать, что делать если срок истёк.',
    headline: 'Срок исковой давности по возврату страховки',
    breadcrumbName: 'Срок исковой давности',
    body: `
    <p class="text-gray-700 leading-relaxed mb-4">По общему правилу срок исковой давности по требованиям потребителей — 3 года (ст. 196 ГК РФ). Для возврата страховки течение срока обычно начинается с момента, когда вы узнали о нарушении права (например, отказ банка или момент досрочного погашения).</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Когда можно подать в суд</h2>
    <p class="text-gray-700 leading-relaxed mb-4">В течение 3 лет с даты отказа в возврате или с даты досрочного погашения (если требуете пропорциональный возврат). Даже если кредит погашен 2 года назад — вы ещё в рамках срока. Подробнее об <a href="/vozvrat-strahovki-dosrochno/" class="text-primary hover:text-secondary font-medium">возврате при досрочном погашении</a>.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Восстановление срока</h2>
    <p class="text-gray-700 leading-relaxed mb-4">В исключительных случаях суд может восстановить пропущенный срок. Лучше не затягивать: чем раньше подаёте заявление в банк или иск — тем быстрее получите деньги. <a href="/uslugi/" class="text-primary hover:text-secondary font-medium">Наши услуги</a> — без предоплаты.</p>
    <img src="../../assets/reviews/review-3.jpeg" alt="Срок исковой давности возврат страховки" class="w-full rounded-xl my-6" loading="lazy" width="800" height="450">
    `
  },
  {
    slug: 'navyazali-strahovku-chto-delat',
    title: 'Навязали страховку по кредиту: что делать',
    description: 'Что делать, если при оформлении кредита навязали страховку. Как вернуть деньги, куда жаловаться, пошаговые действия.',
    headline: 'Навязали страховку по кредиту: что делать',
    breadcrumbName: 'Навязали страховку',
    body: `
    <p class="text-gray-700 leading-relaxed mb-4">Навязывание страховки как условия выдачи кредита запрещено Указанием ЦБ № 3854-У. Если вам сказали «без страховки не одобрим» или подключили страховку без явного согласия — вы вправе требовать возврат полной суммы.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Первые шаги</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Сохраните договоры (кредит и страхование), чеки, переписку. Напишите заявление на возврат в банк или страховую — образцы на странице <a href="/zajavlenie-na-vozvrat-strahovki/" class="text-primary hover:text-secondary font-medium">заявление на возврат страховки</a>. Подайте лично или заказным письмом с уведомлением.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Если отказали</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Подайте претензию, затем иск в суд. Судебная практика в большинстве случаев на стороне потребителя. Мы помогаем вернуть страховку в <a href="/vozvrat-strahovki-sberbank/" class="text-primary hover:text-secondary font-medium">Сбербанке</a>, <a href="/vozvrat-strahovki-vtb/" class="text-primary hover:text-secondary font-medium">ВТБ</a>, <a href="/vozvrat-strahovki-alfa-bank/" class="text-primary hover:text-secondary font-medium">Альфа-Банке</a> и других банках без предоплаты.</p>
    <img src="../../assets/reviews/review-1.jpeg" alt="Навязали страховку по кредиту что делать" class="w-full rounded-xl my-6" loading="lazy" width="800" height="450">
    `
  },
  {
    slug: 'otkaz-ot-strahovki-po-kreditu',
    title: 'Отказ от страховки по кредиту: права и порядок',
    description: 'Как отказаться от страховки по кредиту до и после оформления. Период охлаждения 14 дней, возврат 100%.',
    headline: 'Отказ от страховки по кредиту: права и порядок',
    breadcrumbName: 'Отказ от страховки',
    body: `
    <p class="text-gray-700 leading-relaxed mb-4">В течение 14 дней (период охлаждения) вы можете отказаться от договора страхования и вернуть 100% уплаченной суммы. Уведомление направляется в страховую или банк в письменной форме.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">После 14 дней</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Если страховка была навязана — можно оспорить договор и требовать возврат через суд. При <a href="/vozvrat-strahovki-dosrochno/" class="text-primary hover:text-secondary font-medium">досрочном погашении кредита</a> — пропорциональный возврат за неиспользованный срок. Рассчитать сумму можно в <a href="/kalkulyator/" class="text-primary hover:text-secondary font-medium">калькуляторе</a>.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Практические советы</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Все заявления подавайте в двух экземплярах или заказным письмом с описью. Храните копии и уведомления о вручении. При отказе банка обращайтесь к юристам — мы работаем без предоплаты.</p>
    <img src="../../assets/reviews/review-2.jpeg" alt="Отказ от страховки по кредиту" class="w-full rounded-xl my-6" loading="lazy" width="800" height="450">
    `
  },
  {
    slug: 'vozvrat-kasko-avtokredit',
    title: 'Возврат КАСКО при автокредите',
    description: 'Как вернуть КАСКО по автокредиту: при досрочном погашении и при навязывании. Формула расчёта, судебная практика.',
    headline: 'Возврат КАСКО при автокредите',
    breadcrumbName: 'Возврат КАСКО',
    body: `
    <p class="text-gray-700 leading-relaxed mb-4">КАСКО при автокредите часто навязывают или завышают стоимость. Вернуть деньги можно: в период охлаждения — 100%; при досрочном погашении — пропорционально неиспользованному сроку; при навязанности — через суд с неустойкой.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Расчёт суммы возврата КАСКО</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Формула: (Стоимость КАСКО ÷ Срок в месяцах) × Оставшиеся месяцы. Учитываются также проценты и неустойка при судебном взыскании. Используйте <a href="/kalkulyator/" class="text-primary hover:text-secondary font-medium">калькулятор возврата</a> для ориентира.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Куда обращаться</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Заявление — в банк (если КАСКО оформлено через банк) или в страховую. Образец заявления — в разделе <a href="/zajavlenie-na-vozvrat-strahovki/" class="text-primary hover:text-secondary font-medium">заявление на возврат страховки</a>. Мы помогаем взыскать КАСКО по <a href="/uslugi/" class="text-primary hover:text-secondary font-medium">услугам возврата</a> без предоплаты.</p>
    <img src="../../assets/reviews/review-3.jpeg" alt="Возврат КАСКО при автокредите" class="w-full rounded-xl my-6" loading="lazy" width="800" height="450">
    `
  },
  {
    slug: 'bank-otkazyvaet-v-vozvrate',
    title: 'Банк отказывает в возврате страховки: что делать',
    description: 'Банк отказал в возврате страховки — порядок действий. Претензия, суд, судебная практика. Помощь без предоплаты.',
    headline: 'Банк отказывает в возврате страховки: что делать',
    breadcrumbName: 'Банк отказывает в возврате',
    body: `
    <p class="text-gray-700 leading-relaxed mb-4">Отказ банка в возврате страховки — не окончательный. Часто банки ссылаются на «добровольность» или «истёк период охлаждения», но суды в большинстве случаев встают на сторону потребителя при доказанной навязанности.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Шаги после отказа</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Направьте письменную претензию с требованием вернуть деньги и указанием срока (10–14 дней). При повторном отказе — иск в суд. Имеет смысл привлечь юристов: мы ведём дела без предоплаты и получаем вознаграждение только при успехе.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Судебная практика</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Иски к <a href="/vozvrat-strahovki-sberbank/" class="text-primary hover:text-secondary font-medium">Сбербанку</a>, <a href="/vozvrat-strahovki-vtb/" class="text-primary hover:text-secondary font-medium">ВТБ</a>, <a href="/vozvrat-strahovki-alfa-bank/" class="text-primary hover:text-secondary font-medium">Альфа-Банку</a> и другим банкам часто заканчиваются взысканием суммы страховки, неустойки и компенсации. Подробнее — в статье <a href="/blog/vozvrat-strahovki-cherez-sud/">возврат страховки через суд</a>.</p>
    <img src="../../assets/reviews/review-1.jpeg" alt="Банк отказывает в возврате страховки" class="w-full rounded-xl my-6" loading="lazy" width="800" height="450">
    `
  },
  {
    slug: 'vozvrat-strahovki-cherez-sud',
    title: 'Возврат страховки через суд',
    description: 'Взыскание страховки через суд: сроки, расходы, сумма иска. Неустойка, проценты, компенсация. Работаем без предоплаты.',
    headline: 'Возврат страховки через суд',
    breadcrumbName: 'Возврат через суд',
    body: `
    <p class="text-gray-700 leading-relaxed mb-4">Если банк или страховая отказывают в возврате страховки, следующий шаг — иск в суд. По Закону о защите прав потребителей можно взыскать не только сумму страховки, но и неустойку, проценты (ст. 395 ГК РФ), компенсацию морального вреда и штраф 50% в пользу потребителя.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Что взыскивается в суде</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Сумма страховки, неустойка (за каждый день просрочки), проценты за пользование чужими средствами, компенсация морального вреда, штраф за неудовлетворение в добровольном порядке. Итого сумма может превышать изначальную страховку в 2 и более раз.</p>
    <h2 class="font-heading font-bold text-2xl mt-8 mb-4">Сроки и риски</h2>
    <p class="text-gray-700 leading-relaxed mb-4">Рассмотрение дела — обычно 2–6 месяцев. Мы работаем без предоплаты: платите только процент от возвращённой суммы после выигрыша. Оставьте заявку на <a href="/">главной</a> или позвоните +7 906 123-15-22. Подробнее об <a href="/uslugi/" class="text-primary hover:text-secondary font-medium">услугах</a> и <a href="/kak-rabotaet/" class="text-primary hover:text-secondary font-medium">как мы работаем</a>.</p>
    <img src="../../assets/reviews/review-2.jpeg" alt="Возврат страховки через суд" class="w-full rounded-xl my-6" loading="lazy" width="800" height="450">
    `
  }
];

articles.forEach((a) => {
  const dir = path.join(root, 'blog', a.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const html = base(a.slug, a.title, a.description, a.headline, a.breadcrumbName, a.body);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  console.log('Blog:', a.slug);
});

if (!fs.existsSync(path.join(root, 'blog'))) fs.mkdirSync(path.join(root, 'blog'), { recursive: true });
const indexHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Статьи о возврате навязанных страховок по кредитам: досрочное погашение, образцы заявлений, суд, КАСКО.">
    <title>Блог | vozvratidengi.ru</title>
    <link rel="canonical" href="https://vozvratidengi.ru/blog/">
    <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={theme:{extend:{colors:{primary:'#1E3A8A',secondary:'#F97316'},fontFamily:{heading:['Montserrat','sans-serif'],body:['Inter','sans-serif']}}}}</script>
    <link rel="stylesheet" href="../src/css/style.css">
</head>
<body class="font-body text-gray-900">
    <header class="bg-white shadow-sm">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <a href="/" class="font-heading font-bold text-xl text-primary">ВОЗВРАТ СТРАХОВКИ</a>
            <nav class="flex gap-6">
                <a href="/" class="hover:text-primary">Главная</a>
                <a href="/uslugi/" class="hover:text-primary">Услуги</a>
                <a href="/kalkulyator/" class="hover:text-primary">Калькулятор</a>
                <a href="/contacts/" class="hover:text-primary">Контакты</a>
            </nav>
        </div>
    </header>
    <main class="container mx-auto px-6 py-12 max-w-4xl">
        <h1 class="text-3xl font-heading font-bold mb-8">Блог</h1>
        <ul class="space-y-4">
            ${articles.map(a => `<li><a href="/blog/${a.slug}/" class="text-primary hover:text-secondary font-medium text-lg">${a.headline}</a></li>`).join('\n            ')}
        </ul>
    </main>
    <footer class="border-t py-6 text-center text-sm text-gray-500">© 2025 vozvratidengi.ru</footer>
</body>
</html>`;
fs.writeFileSync(path.join(root, 'blog', 'index.html'), indexHtml, 'utf8');
console.log('Blog index created.');
console.log('Done.');