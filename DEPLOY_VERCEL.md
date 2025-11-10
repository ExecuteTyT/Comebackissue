# Инструкция по деплою на Vercel

## Подготовка

1. Убедитесь, что у вас установлен Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите в аккаунт Vercel:
```bash
vercel login
```

## Настройка переменных окружения

Перед деплоем необходимо настроить переменные окружения в Vercel:

1. Перейдите в настройки проекта на Vercel
2. Добавьте следующие переменные окружения:

### Обязательные переменные:
- `NODE_ENV=production`
- `EMAIL_HOST` - SMTP сервер для отправки email
- `EMAIL_PORT` - Порт SMTP (обычно 587 или 465)
- `EMAIL_USER` - Email адрес для отправки
- `EMAIL_PASS` - Пароль от email
- `NOTIFICATION_EMAIL` - Email для получения уведомлений
- `TELEGRAM_BOT_TOKEN` - Токен Telegram бота
- `TELEGRAM_CHAT_ID` - ID чата для уведомлений

### Опциональные переменные:
- `ALLOWED_ORIGINS` - Разрешенные домены через запятую
- `RATE_LIMIT_WINDOW_MS` - Окно для rate limiting (по умолчанию 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Максимум запросов (по умолчанию 100)
- `CSRF_SECRET` - Секретный ключ для CSRF защиты

## Деплой

### Первый деплой:
```bash
vercel
```

Следуйте инструкциям:
- Set up and deploy? **Y**
- Which scope? Выберите ваш аккаунт
- Link to existing project? **N** (для первого раза)
- What's your project's name? `verni-strahovku` (или другое имя)
- In which directory is your code located? `./` (текущая директория)

### Последующие деплои:
```bash
vercel --prod
```

Или просто:
```bash
vercel
```

## Проверка деплоя

После деплоя проверьте:
1. Главная страница открывается: `https://your-project.vercel.app`
2. API работает: `https://your-project.vercel.app/api/health`
3. Формы отправляются корректно

## Настройка домена

1. В настройках проекта Vercel перейдите в "Domains"
2. Добавьте ваш домен (например, `verni-strahovku.ru`)
3. Настройте DNS записи согласно инструкциям Vercel

## Обновление переменных окружения

Если нужно обновить переменные окружения:
```bash
vercel env add VARIABLE_NAME
```

Или через веб-интерфейс Vercel в настройках проекта.

## Полезные команды

- `vercel ls` - список деплоев
- `vercel logs` - просмотр логов
- `vercel inspect` - инспекция деплоя
- `vercel remove` - удаление проекта

## Структура проекта для Vercel

- `api/index.js` - Serverless function адаптер
- `vercel.json` - Конфигурация Vercel
- `.vercelignore` - Игнорируемые файлы
- Статические файлы (HTML, CSS, JS, assets) - автоматически обслуживаются

## Примечания

- Vercel автоматически определяет Node.js проект
- Serverless функции имеют ограничение по времени выполнения (10 секунд на бесплатном плане)
- Логи доступны в панели Vercel
- Переменные окружения можно настроить через веб-интерфейс или CLI

