#!/bin/bash
# Автоматическое исправление всех проблем на сервере

set -e  # Остановка при ошибке

echo "🔧 Начинаем исправление проблем..."

cd /var/www/verni-strahovku

# 1. Обновляем файлы с GitHub
echo "📥 Обновляем файлы с GitHub..."
git pull origin main

# 2. Устанавливаем правильные права доступа
echo "🔐 Устанавливаем права доступа..."
sudo chown -R www-data:www-data /var/www/verni-strahovku
sudo find /var/www/verni-strahovku -type f -exec chmod 644 {} \;
sudo find /var/www/verni-strahovku -type d -exec chmod 755 {} \;

# 3. Обновляем .env - устанавливаем NODE_ENV=production
echo "⚙️  Обновляем .env файл..."
sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
if ! grep -q "NODE_ENV=production" .env; then
    echo "NODE_ENV=production" >> .env
fi

# 4. Пересоздаем конфигурацию Nginx
echo "🌐 Настраиваем Nginx..."
sudo tee /etc/nginx/sites-available/verni-strahovku.рф > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name вернистраховку.рф www.вернистраховку.рф;

    access_log /var/log/nginx/verni-strahovku-access.log;
    error_log /var/log/nginx/verni-strahovku-error.log;

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Активируем конфигурацию
sudo ln -sf /etc/nginx/sites-available/verni-strahovku.рф /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
echo "✅ Проверяем конфигурацию Nginx..."
sudo nginx -t

# Перезагружаем Nginx
echo "🔄 Перезагружаем Nginx..."
sudo systemctl reload nginx

# 5. Перезапускаем PM2
echo "🔄 Перезапускаем приложение..."
pm2 delete verni-strahovku 2>/dev/null || true
pm2 flush
pm2 start ecosystem.config.js
pm2 save

# Ждем запуска
sleep 3

# 6. Проверяем результат
echo ""
echo "📊 Проверка результата:"
echo "========================"

# Проверяем статические файлы
echo -n "CSS файл: "
if curl -sI http://localhost/src/css/style.css | grep -q "200 OK"; then
    echo "✅ Загружается"
else
    echo "❌ Не загружается"
fi

echo -n "JS файл: "
if curl -sI http://localhost/src/js/main.js | grep -q "200 OK"; then
    echo "✅ Загружается"
else
    echo "❌ Не загружается"
fi

# Проверяем, что нет CSP заголовка в статических файлах
echo -n "Статические файлы через Nginx (без CSP): "
if curl -sI http://localhost/src/css/style.css | grep -q "Content-Security-Policy"; then
    echo "❌ Есть CSP (проблема!)"
else
    echo "✅ Нет CSP (правильно!)"
fi

# Проверяем NODE_ENV
echo -n "NODE_ENV в PM2: "
NODE_ENV=$(pm2 env 0 | grep NODE_ENV | cut -d: -f2 | tr -d ' ')
if [ "$NODE_ENV" = "production" ]; then
    echo "✅ production"
else
    echo "❌ $NODE_ENV (должно быть production)"
fi

echo ""
echo "✅ Исправление завершено!"
echo ""
echo "Проверьте сайт в браузере: http://вернистраховку.рф"
echo "Если проблема останется, откройте DevTools (F12) и проверьте вкладку Console на наличие ошибок."

