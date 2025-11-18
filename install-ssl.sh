#!/bin/bash
# Скрипт для установки SSL сертификата Let's Encrypt для вернистраховку.рф

set -e

echo "🔒 Установка SSL сертификата для вернистраховку.рф"
echo ""

# Проверяем, что мы root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Этот скрипт должен быть запущен от root"
    exit 1
fi

# Punycode версии доменов (для Certbot)
DOMAIN_PUNYCODE="xn--80adbkporkockmsy.xn--p1ai"
DOMAIN_WWW_PUNYCODE="www.xn--80adbkporkockmsy.xn--p1ai"

# Кириллические версии (для Nginx)
DOMAIN_CYRILLIC="вернистраховку.рф"
DOMAIN_WWW_CYRILLIC="www.вернистраховку.рф"

echo "📋 Домены для сертификата:"
echo "   - $DOMAIN_PUNYCODE"
echo "   - $DOMAIN_WWW_PUNYCODE"
echo ""

# Шаг 1: Установка Certbot
echo "📦 Установка Certbot..."
if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot установлен"
else
    echo "✅ Certbot уже установлен"
fi

# Шаг 2: Проверка DNS записей
echo ""
echo "🔍 Проверка DNS записей..."
echo "Убедитесь, что A-записи настроены для:"
echo "   - $DOMAIN_PUNYCODE -> 185.154.53.177"
echo "   - $DOMAIN_WWW_PUNYCODE -> 185.154.53.177"
echo ""
read -p "DNS записи настроены? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Настройте DNS записи и запустите скрипт снова"
    exit 1
fi

# Шаг 3: Проверка доступности домена
echo ""
echo "🌐 Проверка доступности домена..."
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN_PUNYCODE" | grep -q "200\|301\|302"; then
    echo "✅ Домен доступен"
else
    echo "⚠️  Домен может быть недоступен. Продолжаем..."
fi

# Шаг 4: Настройка Nginx для Let's Encrypt проверки
echo ""
echo "📝 Настройка Nginx для Let's Encrypt..."
# Создаем директорию для acme-challenge
mkdir -p /var/www/verni-strahovku/.well-known/acme-challenge
chmod -R 755 /var/www/verni-strahovku/.well-known

# Временно обновляем Nginx конфигурацию для поддержки acme-challenge
NGINX_CONFIG="/etc/nginx/sites-available/verni-strahovku.рф"
if [ -f "$NGINX_CONFIG" ]; then
    # Создаем резервную копию
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.acme"
    
    # Проверяем, есть ли уже блок для .well-known
    if ! grep -q "\.well-known/acme-challenge" "$NGINX_CONFIG"; then
        # Добавляем блок для acme-challenge ПЕРЕД location /
        sed -i '/location \/ {/i\
    # Let'\''s Encrypt verification\
    location /.well-known/acme-challenge/ {\
        root /var/www/verni-strahovku;\
        allow all;\
    }\
' "$NGINX_CONFIG"
        
        # Проверяем и перезагружаем Nginx
        if nginx -t; then
            systemctl reload nginx
            echo "✅ Nginx обновлен для Let's Encrypt"
        else
            echo "❌ Ошибка в конфигурации Nginx, восстанавливаем..."
            cp "$NGINX_CONFIG.backup.acme" "$NGINX_CONFIG"
            nginx -t && systemctl reload nginx
        fi
    else
        echo "✅ Nginx уже настроен для Let's Encrypt"
    fi
fi

# Шаг 5: Получение сертификата
echo ""
echo "🔐 Получение SSL сертификата..."
echo "Certbot будет использовать домены в Punycode формате"
echo ""

# Сначала пробуем webroot метод
echo "Попытка 1: Используем webroot метод..."
certbot certonly \
    --webroot \
    --webroot-path=/var/www/verni-strahovku \
    --email admin@вернистраховку.рф \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    -d "$DOMAIN_PUNYCODE" \
    -d "$DOMAIN_WWW_PUNYCODE" \
    2>&1 | tee /tmp/certbot-webroot.log

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo ""
    echo "Попытка 2: Используем standalone метод (потребуется остановить Nginx)..."
    # Останавливаем Nginx временно
    systemctl stop nginx
    
    certbot certonly \
        --standalone \
        --email admin@вернистраховку.рф \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d "$DOMAIN_PUNYCODE" \
        -d "$DOMAIN_WWW_PUNYCODE"
    
    CERTBOT_EXIT=$?
    
    # Запускаем Nginx обратно
    systemctl start nginx
    
    if [ $CERTBOT_EXIT -ne 0 ]; then
        echo "❌ Ошибка при получении сертификата"
        echo "Проверьте логи: /var/log/letsencrypt/letsencrypt.log"
        exit 1
    fi
fi

if [ $? -eq 0 ]; then
    echo "✅ SSL сертификат успешно получен!"
else
    echo "❌ Ошибка при получении сертификата"
    exit 1
fi

# Шаг 5: Обновление конфигурации Nginx
echo ""
echo "📝 Обновление конфигурации Nginx..."

NGINX_CONFIG="/etc/nginx/sites-available/verni-strahovku.рф"

# Создаем резервную копию
cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"

# Создаем новую конфигурацию с HTTPS
cat > "$NGINX_CONFIG" <<EOF
# Редирект HTTP -> HTTPS
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name $DOMAIN_CYRILLIC $DOMAIN_WWW_CYRILLIC;

    # Для Let's Encrypt проверки
    location /.well-known/acme-challenge/ {
        root /var/www/verni-strahovku;
    }

    # Редирект всех остальных запросов на HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN_CYRILLIC $DOMAIN_WWW_CYRILLIC;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_PUNYCODE/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_PUNYCODE/privkey.pem;

    # SSL настройки (современные и безопасные)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN_PUNYCODE/chain.pem;

    # Безопасные заголовки
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Логи
    access_log /var/log/nginx/verni-strahovku-access.log;
    error_log /var/log/nginx/verni-strahovku-error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 10M;

    root /var/www/verni-strahovku;

    # Статические файлы из папки src
    location ^~ /src/ {
        alias /var/www/verni-strahovku/src/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Статические файлы из папки assets
    location ^~ /assets/ {
        alias /var/www/verni-strahovku/assets/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Все остальные запросы проксируем на Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Проверяем конфигурацию
echo "🔍 Проверка конфигурации Nginx..."
if nginx -t; then
    echo "✅ Конфигурация корректна"
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации Nginx"
    echo "Восстанавливаем резервную копию..."
    cp "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONFIG"
    exit 1
fi

# Шаг 7: Настройка автообновления сертификата
echo ""
echo "🔄 Настройка автообновления сертификата..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo "✅ Автообновление настроено"
else
    echo "⚠️  Проблема с автообновлением, но это не критично"
fi

# Шаг 8: Обновление backend/server.js для HTTPS
echo ""
echo "📝 Обновление настроек сервера для HTTPS..."

# Обновляем .env файл (если нужно)
if [ -f /var/www/verni-strahovku/.env ]; then
    # Добавляем FORCE_HTTPS если его нет
    if ! grep -q "FORCE_HTTPS" /var/www/verni-strahovku/.env; then
        echo "" >> /var/www/verni-strahovku/.env
        echo "# HTTPS настройки" >> /var/www/verni-strahovku/.env
        echo "FORCE_HTTPS=true" >> /var/www/verni-strahovku/.env
        echo "✅ Добавлен FORCE_HTTPS=true в .env"
    fi
fi

# Перезапускаем PM2 для применения изменений
echo ""
echo "🔄 Перезапуск приложения..."
cd /var/www/verni-strahovku
pm2 restart verni-strahovku --update-env

echo ""
echo "✅ SSL сертификат успешно установлен!"
echo ""
echo "🌐 Проверьте сайт:"
echo "   - https://$DOMAIN_CYRILLIC"
echo "   - https://$DOMAIN_WWW_CYRILLIC"
echo ""
echo "📋 Полезные команды:"
echo "   - Проверить статус сертификата: sudo certbot certificates"
echo "   - Обновить сертификат вручную: sudo certbot renew"
echo "   - Проверить автообновление: sudo certbot renew --dry-run"
echo ""

