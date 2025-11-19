#!/bin/bash
# Финальное исправление конфигурации Nginx

sudo tee /etc/nginx/sites-available/verni-strahovku.рф > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name вернистраховку.рф www.вернистраховку.рф;

    access_log /var/log/nginx/verni-strahovku-access.log;
    error_log /var/log/nginx/verni-strahovku-error.log;

    client_max_body_size 10M;

    root /var/www/verni-strahovku;

    # КРИТИЧНО: Используем ^~ для префиксных location - это отключает проверку регулярных выражений
    # и гарантирует, что эти блоки будут обрабатываться ПЕРЕД location /
    
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
sudo nginx -t

# Перезагружаем nginx
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx перезагружен"
    
    # Проверяем результат
    echo ""
    echo "Проверка статических файлов:"
    echo "================================"
    curl -sI http://localhost/src/css/style.css | grep -E "(HTTP|Server|Content-Type|Content-Security-Policy)" | head -5
    echo ""
    echo "Если видите Content-Security-Policy - файлы всё ещё идут через Node.js"
    echo "Если НЕ видите Content-Security-Policy - файлы обслуживаются через Nginx ✅"
else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

