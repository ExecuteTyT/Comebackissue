#!/bin/bash
# Исправление конфигурации Nginx для правильной обработки статических файлов

sudo tee /etc/nginx/sites-available/verni-strahovku.рф > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name вернистраховку.рф www.вернистраховку.рф;

    access_log /var/log/nginx/verni-strahovku-access.log;
    error_log /var/log/nginx/verni-strahovku-error.log;

    client_max_body_size 10M;

    root /var/www/verni-strahovku;

    # ВАЖНО: Специфичные location блоки должны быть ДО общего location /
    
    # Статические файлы из папки src - обслуживаем напрямую
    location /src/ {
        alias /var/www/verni-strahovku/src/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    # Статические файлы из папки assets - обслуживаем напрямую
    location /assets/ {
        alias /var/www/verni-strahovku/assets/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    # Статические файлы по расширению - обслуживаем напрямую (резервный вариант)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webmanifest|xml|txt|map)$ {
        root /var/www/verni-strahovku;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
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
sudo nginx -t

# Если проверка прошла, перезагружаем nginx
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

# Проверяем работу статических файлов
echo "Проверка статических файлов:"
curl -I http://localhost/src/css/style.css 2>&1 | head -1
curl -I http://localhost/src/js/main.js 2>&1 | head -1

