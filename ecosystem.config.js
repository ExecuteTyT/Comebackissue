module.exports = {
  apps: [{
    name: 'verni-strahovku',
    script: 'backend/server.js',
    cwd: '/var/www/verni-strahovku',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/root/.pm2/logs/verni-strahovku-error.log',
    out_file: '/root/.pm2/logs/verni-strahovku-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};

