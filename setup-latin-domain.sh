#!/bin/bash
# Скрипт для настройки латинского домена vozvratidengi.ru
# Использование: chmod +x setup-latin-domain.sh && sudo ./setup-latin-domain.sh

set -e

echo "🌐 Настройка домена vozvratidengi.ru..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Домен
DOMAIN="vozvratidengi.ru"
WWW_DOMAIN="www.vozvratidengi.ru"

# Шаг 1: Проверка DNS
echo -e "${YELLOW}🔍 Проверка DNS записей...${NC}"
if nslookup $DOMAIN | grep -q "185.154.53.177"; then
    echo -e "${GREEN}✅ DNS запись для $DOMAIN настроена правильно${NC}"
else
    echo -e "${RED}❌ DNS запись для $DOMAIN не указывает на 185.154.53.177${NC}"
    echo "Настройте A запись для $DOMAIN -> 185.154.53.177"
    exit 1
fi

if nslookup $WWW_DOMAIN | grep -q "185.154.53.177"; then
    echo -e "${GREEN}✅ DNS запись для $WWW_DOMAIN настроена правильно${NC}"
else
    echo -e "${YELLOW}⚠️  DNS запись для $WWW_DOMAIN не настроена (не критично)${NC}"
fi

# Шаг 2: Обновление конфигурации Nginx
echo -e "${YELLOW}⚙️  Настройка Nginx...${NC}"

# Проверяем существующую конфигурацию
if [ -f "/etc/nginx/sites-available/verni-strahovku" ]; then
    # Добавляем латинский домен в существующую конфигурацию HTTP
    if ! grep -q "vozvratidengi.ru" /etc/nginx/sites-available/verni-strahovku; then
        echo "Добавляем $DOMAIN в существующую конфигурацию..."
        # Создаем резервную копию
        sudo cp /etc/nginx/sites-available/verni-strahovku /etc/nginx/sites-available/verni-strahovku.backup.$(date +%Y%m%d_%H%M%S)
        
        # Добавляем домен в server_name (если это HTTP блок)
        sudo sed -i "s/server_name.*;/server_name вернистраховку.рф www.вернистраховку.рф $DOMAIN $WWW_DOMAIN;/" /etc/nginx/sites-available/verni-strahovku
    fi
else
    echo -e "${RED}❌ Конфигурация Nginx не найдена!${NC}"
    exit 1
fi

# Проверяем конфигурацию
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx перезагружен${NC}"
else
    echo -e "${RED}❌ Ошибка в конфигурации Nginx!${NC}"
    exit 1
fi

# Шаг 3: Выпуск SSL сертификата
echo -e "${YELLOW}🔐 Выпуск SSL сертификата для $DOMAIN...${NC}"

# Проверяем, есть ли уже сертификат
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${YELLOW}ℹ️  Сертификат для $DOMAIN уже существует${NC}"
    read -p "Обновить сертификат? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo certbot renew --cert-name $DOMAIN
    fi
else
    echo "Выпускаем новый сертификат..."
    sudo certbot certonly --nginx \
        -d $DOMAIN \
        -d $WWW_DOMAIN \
        --email admin@$DOMAIN \
        --agree-tos \
        --non-interactive \
        --redirect
fi

# Шаг 4: Настройка HTTPS в Nginx
echo -e "${YELLOW}⚙️  Настройка HTTPS...${NC}"

# Проверяем, есть ли уже HTTPS блок для латинского домена
if ! grep -q "server_name.*vozvratidengi.ru" /etc/nginx/sites-available/verni-strahovku || ! grep -A 5 "server_name.*vozvratidengi.ru" /etc/nginx/sites-available/verni-strahovku | grep -q "listen 443"; then
    echo "Добавляем HTTPS конфигурацию для $DOMAIN..."
    
    # Добавляем HTTPS блок в конец файла
    sudo tee -a /etc/nginx/sites-available/verni-strahovku > /dev/null <<EOF

# HTTPS для vozvratidengi.ru
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN $WWW_DOMAIN;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Безопасные заголовки
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Логи
    access_log /var/log/nginx/verni-strahovku-access.log;
    error_log /var/log/nginx/verni-strahovku-error.log;

    client_max_body_size 10M;
    root /var/www/verni-strahovku;

    # Статические файлы
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webmanifest|xml|txt|map)$ {
        root /var/www/verni-strahovku;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /assets/ {
        alias /var/www/verni-strahovku/assets/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /src/ {
        alias /var/www/verni-strahovku/src/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Проксирование на Node.js
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
fi

# Обновляем HTTP блок для редиректа на HTTPS
if grep -q "server_name.*vozvratidengi.ru" /etc/nginx/sites-available/verni-strahovku; then
    # Убеждаемся, что HTTP блок редиректит на HTTPS
    if ! grep -A 10 "server_name.*vozvratidengi.ru" /etc/nginx/sites-available/verni-strahovku | grep -q "return 301"; then
        echo "Настраиваем редирект HTTP -> HTTPS для $DOMAIN..."
        # Это будет сделано автоматически certbot --redirect, но проверим
    fi
fi

# Проверяем и перезагружаем Nginx
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx обновлен${NC}"
else
    echo -e "${RED}❌ Ошибка в конфигурации Nginx!${NC}"
    exit 1
fi

# Шаг 5: Проверка
echo ""
echo -e "${GREEN}✅ Настройка завершена!${NC}"
echo ""
echo "Проверьте работу сайта:"
echo "  http://$DOMAIN (должен редиректить на HTTPS)"
echo "  https://$DOMAIN"
echo "  https://$WWW_DOMAIN"
echo ""
echo "Проверьте статус сертификата:"
echo "  sudo certbot certificates"
echo ""
echo "Проверьте логи Nginx:"
echo "  sudo tail -f /var/log/nginx/verni-strahovku-error.log"


