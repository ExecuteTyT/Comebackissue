#!/bin/bash
# Скрипт быстрого деплоя для Ubuntu 24.04
# Использование: chmod +x QUICK_DEPLOY.sh && ./QUICK_DEPLOY.sh

set -e

echo "🚀 Начинаем деплой вернистраховку.рф..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Шаг 1: Обновление системы
echo -e "${YELLOW}Шаг 1: Обновление системы...${NC}"
sudo apt update && sudo apt upgrade -y

# Шаг 2: Установка Node.js
echo -e "${YELLOW}Шаг 2: Установка Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js уже установлен: $(node --version)"
fi

# Шаг 3: Установка необходимых пакетов
echo -e "${YELLOW}Шаг 3: Установка nginx, git, PM2...${NC}"
sudo apt install -y nginx git curl ufw
sudo npm install -g pm2

# Шаг 4: Настройка файрвола
echo -e "${YELLOW}Шаг 4: Настройка файрвола...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Шаг 5: Создание директории и клонирование
echo -e "${YELLOW}Шаг 5: Клонирование репозитория...${NC}"
sudo mkdir -p /var/www/verni-strahovku
sudo chown -R $USER:$USER /var/www/verni-strahovku

if [ -d "/var/www/verni-strahovku/.git" ]; then
    echo "Репозиторий уже существует, обновляем..."
    cd /var/www/verni-strahovku
    git pull origin main
else
    echo "Клонируем репозиторий..."
    cd /var/www/verni-strahovku
    git clone https://github.com/ExecuteTyT/Comebackissue.git .
fi

# Шаг 6: Установка зависимостей
echo -e "${YELLOW}Шаг 6: Установка зависимостей...${NC}"
npm install --production

# Шаг 7: Проверка .env файла
echo -e "${YELLOW}Шаг 7: Проверка .env файла...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Файл .env не найден!${NC}"
    echo "Создайте файл .env с необходимыми переменными окружения."
    echo "Смотрите инструкцию в DEPLOYMENT_GUIDE.md"
    exit 1
fi

# Шаг 8: Настройка nginx
echo -e "${YELLOW}Шаг 8: Настройка nginx...${NC}"
sudo tee /etc/nginx/sites-available/verni-strahovku.рф > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name вернистраховку.рф www.вернистраховку.рф;

    access_log /var/log/nginx/verni-strahovku-access.log;
    error_log /var/log/nginx/verni-strahovku-error.log;

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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Активация конфигурации nginx
sudo ln -sf /etc/nginx/sites-available/verni-strahovku.рф /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t && sudo systemctl reload nginx

# Шаг 9: Запуск приложения через PM2
echo -e "${YELLOW}Шаг 9: Запуск приложения...${NC}"
cd /var/www/verni-strahovku

# Останавливаем старое приложение, если запущено
pm2 delete verni-strahovku 2>/dev/null || true

# Запускаем новое
pm2 start backend/server.js --name "verni-strahovku"
pm2 save

# Настройка автозапуска
STARTUP_CMD=$(pm2 startup | grep -oP 'sudo env PATH=.*$')
if [ ! -z "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD
fi

# Шаг 10: Установка SSL (опционально)
echo -e "${YELLOW}Шаг 10: Установка SSL сертификата...${NC}"
read -p "Установить SSL сертификат Let's Encrypt? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d вернистраховку.рф -d www.вернистраховку.рф
    sudo certbot renew --dry-run
fi

echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo ""
echo "Проверьте статус:"
echo "  pm2 status"
echo "  pm2 logs verni-strahovku"
echo "  sudo systemctl status nginx"
echo ""
echo "Сайт должен быть доступен по адресу: http://вернистраховку.рф"

