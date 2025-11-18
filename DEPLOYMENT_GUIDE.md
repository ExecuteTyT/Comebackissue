# Инструкция по деплою на Ubuntu 24.04

## Шаг 1: Подключение к серверу

```bash
ssh root@185.154.53.177
# или
ssh ваш_пользователь@185.154.53.177
```

## Шаг 2: Установка Node.js и npm

```bash
# Обновляем систему (если еще не сделали)
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверяем версии
node --version
npm --version
```

## Шаг 3: Установка необходимых пакетов

```bash
# Устанавливаем nginx, git, и другие утилиты
sudo apt install -y nginx git curl ufw

# Устанавливаем PM2 для управления процессом Node.js
sudo npm install -g pm2
```

## Шаг 4: Настройка файрвола

```bash
# Разрешаем SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## Шаг 5: Клонирование репозитория

```bash
# Создаем директорию для приложения
sudo mkdir -p /var/www/verni-strahovku
sudo chown -R $USER:$USER /var/www/verni-strahovku

# Клонируем репозиторий
cd /var/www/verni-strahovku
git clone https://github.com/ExecuteTyT/Comebackissue.git .

# Или если репозиторий приватный, используйте SSH ключ
# git clone git@github.com:ExecuteTyT/Comebackissue.git .
```

## Шаг 6: Установка зависимостей

```bash
cd /var/www/verni-strahovku
npm install --production
```

## Шаг 7: Настройка переменных окружения

```bash
# Создаем .env файл
nano .env
```

Скопируйте содержимое из вашего локального `.env` файла и настройте для продакшена:

```env
# Порт приложения (будет проксироваться через nginx)
PORT=3000

# Email настройки (Mail.ru)
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
EMAIL_USER=ваш_email@mail.ru
EMAIL_PASS=ваш_пароль_приложения
EMAIL_FROM=ваш_email@mail.ru
EMAIL_TO=ваш_email@mail.ru

# Безопасность
NODE_ENV=production
SESSION_SECRET=сгенерируйте_случайную_строку_здесь
# Для генерации случайной строки: openssl rand -base64 32

# Другие переменные из вашего .env (если есть)
```

Сохраните файл: `Ctrl+O`, `Enter`, `Ctrl+X`

## Шаг 8: Настройка Nginx как reverse proxy

```bash
# Создаем конфигурацию для сайта
sudo nano /etc/nginx/sites-available/verni-strahovku.рф
```

Вставьте следующую конфигурацию:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name вернистраховку.рф www.вернистраховку.рф;

    # Логи
    access_log /var/log/nginx/verni-strahovku-access.log;
    error_log /var/log/nginx/verni-strahovku-error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 10M;

    root /var/www/verni-strahovku;

    # Статические файлы - обслуживаем напрямую через Nginx (быстрее)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webmanifest|xml|txt|map)$ {
        root /var/www/verni-strahovku;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Статические файлы из папки assets
    location /assets/ {
        alias /var/www/verni-strahovku/assets/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Статические файлы из папки src
    location /src/ {
        alias /var/www/verni-strahovku/src/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Все остальные запросы проксируем на Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Активируем конфигурацию:

```bash
# Создаем символическую ссылку
sudo ln -s /etc/nginx/sites-available/verni-strahovku.рф /etc/nginx/sites-enabled/

# Проверяем конфигурацию
sudo nginx -t

# Перезагружаем nginx
sudo systemctl reload nginx
```

## Шаг 9: Настройка SSL сертификата (Let's Encrypt)

```bash
# Устанавливаем Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получаем SSL сертификат (автоматически настроит nginx)
sudo certbot --nginx -d вернистраховку.рф -d www.вернистраховку.рф

# Настройка автообновления сертификата
sudo certbot renew --dry-run
```

## Шаг 10: Запуск приложения через PM2

```bash
cd /var/www/verni-strahovku

# Запускаем приложение
pm2 start backend/server.js --name "verni-strahovku"

# Сохраняем конфигурацию PM2 для автозапуска
pm2 save

# Настраиваем автозапуск PM2 при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет PM2 (обычно что-то вроде sudo env PATH=...)
```

## Шаг 11: Проверка работы

```bash
# Проверяем статус PM2
pm2 status

# Смотрим логи
pm2 logs verni-strahovku

# Проверяем nginx
sudo systemctl status nginx

# Проверяем доступность сайта
curl http://localhost:3000
```

## Шаг 12: Настройка автозапуска и мониторинга

```bash
# PM2 уже настроен на автозапуск, но можно проверить
pm2 list
pm2 info verni-strahovku

# Настройка мониторинга (опционально)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Полезные команды для управления

```bash
# Перезапуск приложения
pm2 restart verni-strahovku

# Остановка приложения
pm2 stop verni-strahovku

# Просмотр логов в реальном времени
pm2 logs verni-strahovku

# Мониторинг ресурсов
pm2 monit

# Обновление кода
cd /var/www/verni-strahovku
git pull origin main
npm install --production
pm2 restart verni-strahovku

# Просмотр логов nginx
sudo tail -f /var/log/nginx/verni-strahovku-access.log
sudo tail -f /var/log/nginx/verni-strahovku-error.log
```

## Решение проблем

### Если сайт не открывается:
1. Проверьте статус PM2: `pm2 status`
2. Проверьте логи: `pm2 logs verni-strahovku`
3. Проверьте nginx: `sudo nginx -t` и `sudo systemctl status nginx`
4. Проверьте порт: `sudo netstat -tlnp | grep 3000`
5. Проверьте файрвол: `sudo ufw status`

### Если проблемы с SSL:
```bash
sudo certbot certificates
sudo certbot renew
```

### Если нужно изменить переменные окружения:
```bash
nano /var/www/verni-strahovku/.env
pm2 restart verni-strahovku
```

## Безопасность

1. **Не храните .env в репозитории** - он уже в .gitignore
2. **Регулярно обновляйте систему**: `sudo apt update && sudo apt upgrade`
3. **Настройте регулярные бэкапы** базы данных (если будет использоваться)
4. **Мониторьте логи** на предмет подозрительной активности

## Готово!

Ваш сайт должен быть доступен по адресу: https://вернистраховку.рф

