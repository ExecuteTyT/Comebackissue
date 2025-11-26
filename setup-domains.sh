#!/bin/bash
# Скрипт для настройки доменов и SSL сертификатов
# Использование: chmod +x setup-domains.sh && sudo ./setup-domains.sh

set -e

echo "🔐 Настройка доменов и SSL сертификатов..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Домены
DOMAIN_CYRILLIC="вернистраховку.рф"
DOMAIN_LATIN="vozvratidengi.ru"
WWW_DOMAIN_CYRILLIC="www.вернистраховку.рф"
WWW_DOMAIN_LATIN="www.vozvratidengi.ru"

# Шаг 1: Установка Certbot (если еще не установлен)
echo -e "${YELLOW}📦 Проверка установки Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    echo "Устанавливаем Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "Certbot уже установлен"
fi

# Шаг 2: Обновление конфигурации Nginx для обоих доменов
echo -e "${YELLOW}⚙️  Настройка Nginx для обоих доменов...${NC}"

sudo tee /etc/nginx/sites-available/verni-strahovku > /dev/null <<EOF
# Конфигурация для доменов вернистраховку.рф и vozvratidengi.ru
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_CYRILLIC} ${WWW_DOMAIN_CYRILLIC} ${DOMAIN_LATIN} ${WWW_DOMAIN_LATIN};

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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # ACME challenge для Let's Encrypt
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }
}
EOF

# Активация конфигурации
echo -e "${YELLOW}🔗 Активация конфигурации Nginx...${NC}"
sudo ln -sf /etc/nginx/sites-available/verni-strahovku /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
echo -e "${YELLOW}✅ Проверка конфигурации Nginx...${NC}"
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx перезагружен${NC}"
else
    echo -e "${RED}❌ Ошибка в конфигурации Nginx!${NC}"
    exit 1
fi

# Шаг 3: Выпуск SSL сертификатов
echo -e "${YELLOW}🔐 Выпуск SSL сертификатов...${NC}"
echo ""
echo "Выпускаем сертификат для доменов:"
echo "  - ${DOMAIN_CYRILLIC}"
echo "  - ${WWW_DOMAIN_CYRILLIC}"
echo "  - ${DOMAIN_LATIN}"
echo "  - ${WWW_DOMAIN_LATIN}"
echo ""

# Проверяем, что домены указывают на сервер
echo -e "${YELLOW}⚠️  ВАЖНО: Убедитесь, что DNS записи для доменов настроены правильно!${NC}"
echo "Для ${DOMAIN_CYRILLIC} и ${WWW_DOMAIN_CYRILLIC}:"
echo "  A запись должна указывать на IP сервера: 185.154.53.177"
echo ""
echo "Для ${DOMAIN_LATIN} и ${WWW_DOMAIN_LATIN}:"
echo "  A запись должна указывать на IP сервера: 185.154.53.177"
echo ""
read -p "DNS записи настроены? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Настройте DNS записи и запустите скрипт снова${NC}"
    exit 1
fi

# Выпускаем сертификат для всех доменов
echo -e "${YELLOW}🔐 Запрос SSL сертификата...${NC}"
sudo certbot --nginx \
    -d ${DOMAIN_CYRILLIC} \
    -d ${WWW_DOMAIN_CYRILLIC} \
    -d ${DOMAIN_LATIN} \
    -d ${WWW_DOMAIN_LATIN} \
    --email admin@${DOMAIN_LATIN} \
    --agree-tos \
    --non-interactive \
    --redirect

# Проверка автообновления
echo -e "${YELLOW}🔄 Проверка автообновления сертификата...${NC}"
sudo certbot renew --dry-run

# Шаг 4: Проверка статуса
echo ""
echo -e "${GREEN}✅ Настройка завершена!${NC}"
echo ""
echo "Проверьте статус сертификатов:"
echo "  sudo certbot certificates"
echo ""
echo "Проверьте конфигурацию Nginx:"
echo "  sudo nginx -t"
echo "  sudo systemctl status nginx"
echo ""
echo "Сайт должен быть доступен по адресам:"
echo "  https://${DOMAIN_CYRILLIC}"
echo "  https://${WWW_DOMAIN_CYRILLIC}"
echo "  https://${DOMAIN_LATIN}"
echo "  https://${WWW_DOMAIN_LATIN}"
echo ""
echo "HTTP версии автоматически перенаправляются на HTTPS"

