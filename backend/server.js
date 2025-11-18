// ============================================
// BACKEND SERVER ДЛЯ ВЕРНИСТРАХОВКУ.РФ
// Node.js + Express + Security + Logging
// ============================================

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const { doubleCsrf } = require('csrf-csrf');
const winston = require('winston');
const morgan = require('morgan');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Загружаем .env файл, но не перезаписываем переменные, которые уже установлены
// ВАЖНО: NODE_ENV должен устанавливаться через PM2 (ecosystem.config.js), а не через .env
const nodeEnvFromPM2 = process.env.NODE_ENV; // Сохраняем значение из PM2 ДО загрузки .env
require('dotenv').config({ override: false });
// ПРИНУДИТЕЛЬНО восстанавливаем NODE_ENV из PM2 (если был установлен)
// Это гарантирует, что значение из ecosystem.config.js имеет приоритет
if (nodeEnvFromPM2) {
    process.env.NODE_ENV = nodeEnvFromPM2;
    console.log(`[ENV] NODE_ENV restored from PM2: ${nodeEnvFromPM2}`);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy для работы за прокси (Vercel или nginx)
// В Vercel и nginx все запросы идут через прокси, нужно доверять заголовкам X-Forwarded-*
// Используем число 1 вместо true для более безопасной настройки
if (process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Доверяем только первому прокси (Vercel или nginx)
}

// ========== LOGGER CONFIGURATION ==========
// Определяем serverless окружение (Vercel, AWS Lambda)
// В Vercel переменная VERCEL может быть "1" или просто существовать
// Также проверяем наличие /var/task (Lambda/Vercel путь) или отсутствие возможности создать директории
const isServerless = !!(
    process.env.VERCEL || 
    process.env.VERCEL_ENV || 
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof __dirname !== 'undefined' && __dirname.includes('/var/task'))
);

const loggerTransports = [];

// В serverless окружении (Vercel) используем ТОЛЬКО консольные логи
// Файловые логи недоступны из-за read-only файловой системы
// ВАЖНО: В production на Vercel всегда используем только консольные логи
// Проверяем также путь - если /var/task, то это точно serverless
const isVercelProduction = isServerless || 
    (process.env.NODE_ENV === 'production' && typeof __dirname !== 'undefined' && __dirname.includes('/var/task'));

if (isVercelProduction) {
    // В serverless/production окружении ТОЛЬКО консольные логи - никаких файловых!
    loggerTransports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.json()
            )
        })
    );
} else {
    // В обычном локальном окружении используем файловые логи
    try {
        const fs = require('fs');
        const logsDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        loggerTransports.push(
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/combined.log' })
        );
    } catch (err) {
        // Если не можем создать файловые логи, используем только консольные
        console.warn('Could not create file logs, using console only:', err.message);
        loggerTransports.push(
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        );
    }
    
    // Консольные логи в development
    if (process.env.NODE_ENV !== 'production') {
        loggerTransports.push(
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        );
    }
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'verni-strahovku' },
    transports: loggerTransports
});

// ========== DOMPURIFY FOR SANITIZATION ==========
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// ========== SECURITY MIDDLEWARE ==========

// Helmet - базовые заголовки безопасности
// ВАЖНО: Отключаем upgrade-insecure-requests для HTTP (будет включен только с HTTPS)
const isHTTPS = process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true';
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://mc.yandex.ru", "https://mc.yandex.com"], // Яндекс.Метрика использует mc.yandex.com (не .ru!)
            fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"], // Добавлен data: для data URI шрифтов
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://api.telegram.org", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://mc.yandex.ru", "https://mc.yandex.com", "wss://mc.yandex.ru", "wss://mc.yandex.com"], // Яндекс.Метрика использует mc.yandex.com
            frameSrc: ["'none'"],
            scriptSrcAttr: ["'unsafe-inline'"], // Разрешаем inline event handlers
            upgradeInsecureRequests: isHTTPS ? [] : null // Отключаем для HTTP, включаем только для HTTPS
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false, // Отключаем для HTTP (будет работать только с HTTPS)
    hsts: false // Отключаем HSTS для HTTP
}));

// Cookie parser
app.use(cookieParser());

// Body parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// Добавляем домен вернистраховку.рф в разрешенные origins
const siteOrigins = [
    'http://вернистраховку.рф',
    'http://www.вернистраховку.рф',
    'http://xn--80adbkporkockmsy.xn--p1ai',
    'http://www.xn--80adbkporkockmsy.xn--p1ai',
    'https://вернистраховку.рф',
    'https://www.вернистраховку.рф',
    'https://xn--80adbkporkockmsy.xn--p1ai',
    'https://www.xn--80adbkporkockmsy.xn--p1ai'
];

// Добавляем Vercel домены в разрешенные origins
const vercelOrigins = process.env.VERCEL_URL 
    ? [`https://${process.env.VERCEL_URL}`, `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`]
    : [];

// Объединяем все разрешенные origins
const allAllowedOrigins = [...allowedOrigins, ...siteOrigins, ...vercelOrigins];

app.use(cors({
    origin: function(origin, callback) {
        // Разрешаем запросы без origin (например, mobile apps или curl)
        if (!origin) {
            logger.info('CORS: Request without origin, allowing');
            return callback(null, true);
        }

        logger.info(`CORS: Checking origin: ${origin}`);

        // Разрешаем запросы с Vercel доменов
        if (process.env.VERCEL && origin.includes('vercel.app')) {
            logger.info('CORS: Vercel origin allowed');
            return callback(null, true);
        }

        // Проверяем точное совпадение
        if (allAllowedOrigins.indexOf(origin) !== -1) {
            logger.info(`CORS: Origin ${origin} allowed (exact match)`);
            callback(null, true);
            return;
        }

        // Проверяем частичное совпадение (для поддоменов)
        if (allAllowedOrigins.some(allowed => origin.includes(allowed.replace(/^https?:\/\//, '')))) {
            logger.info(`CORS: Origin ${origin} allowed (partial match)`);
            callback(null, true);
            return;
        }

        // В development разрешаем все
        if (process.env.NODE_ENV === 'development') {
            logger.info(`CORS: Origin ${origin} allowed (development mode)`);
            callback(null, true);
            return;
        }

        logger.warn(`CORS blocked request from origin: ${origin}`);
        logger.warn(`Allowed origins: ${allAllowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Слишком много запросов с вашего IP, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false,
    // Отключаем валидацию trust proxy для Vercel
    validate: {
        trustProxy: false
    },
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Слишком много запросов. Пожалуйста, позвоните нам: +7 906 123-15-22'
        });
    }
});

// Применяем rate limiting ко всем запросам, кроме статических файлов
// Статические файлы обрабатываются express.static, который идет после limiter
app.use((req, res, next) => {
    // Пропускаем статические файлы через rate limiter (они обрабатываются express.static)
    const staticExtensions = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webmanifest', '.xml', '.txt', '.woff', '.woff2', '.ttf', '.eot', '.map', '.html'];
    const isStaticFile = staticExtensions.some(ext => req.url.endsWith(ext)) && !req.url.startsWith('/api/');
    
    if (isStaticFile) {
        // Для статических файлов пропускаем rate limiting
        return next();
    }
    
    // Для остальных запросов применяем rate limiting
    limiter(req, res, next);
});

// Строгий rate limiting для форм
const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // Максимум 5 отправок формы за 15 минут
    message: 'Слишком много отправок формы, попробуйте позже',
    skipSuccessfulRequests: false
});

// CSRF Protection
const csrfSecret = process.env.CSRF_SECRET || 'your-csrf-secret-key-change-this';
const { generateToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: () => csrfSecret,
    cookieName: 'x-csrf-token',
    cookieOptions: {
        sameSite: 'strict',
        path: '/',
        secure: process.env.FORCE_HTTPS === 'true' || process.env.NODE_ENV === 'production', // Включаем secure для HTTPS
        httpOnly: true
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS']
});

// Обработчик ошибок CSRF
const csrfErrorHandler = (err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        logger.error('❌ CSRF token validation failed:', {
            url: req.url,
            method: req.method,
            headers: req.headers,
            cookies: req.cookies,
            body: req.body
        });
        return res.status(403).json({
            success: false,
            message: 'Ошибка безопасности. Обновите страницу и попробуйте снова.'
        });
    }
    next(err);
};

// Статические файлы
// В Vercel пути могут отличаться, используем абсолютный путь
const staticPath = path.join(__dirname, '../');
const fs = require('fs');

// Проверяем существование ключевых файлов при старте
if (isServerless) {
    const testFiles = [
        'index.html',
        'src/css/style.css',
        'src/js/main.js',
        'src/js/calculator.js',
        'assets/logo-main.svg'
    ];
    testFiles.forEach(file => {
        const fullPath = path.join(staticPath, file);
        const exists = fs.existsSync(fullPath);
        logger.info(`Static file check: ${file} - ${exists ? 'EXISTS' : 'NOT FOUND'} at ${fullPath}`);
    });
}

logger.info(`Serving static files from: ${staticPath}, __dirname: ${__dirname}`);

// В production с Nginx статические файлы обслуживаются через Nginx
// В development и serverless (Vercel) - через Express
const isProductionWithNginx = process.env.NODE_ENV === 'production' && !isServerless;

if (isProductionWithNginx) {
    // В production с Nginx: не обслуживаем статические файлы через Express
    // Nginx будет обслуживать их напрямую
    logger.info('Production mode with Nginx: static files will be served by Nginx, not Express');
    
    // Middleware для пропуска статических файлов (Nginx их обработает)
    app.use((req, res, next) => {
        const staticExtensions = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webmanifest', '.xml', '.txt', '.woff', '.woff2', '.ttf', '.eot', '.map'];
        const isStaticFile = staticExtensions.some(ext => req.url.endsWith(ext)) && 
                            (req.url.startsWith('/src/') || req.url.startsWith('/assets/'));
        
        if (isStaticFile) {
            // В production статические файлы должны обслуживаться через Nginx
            // Если запрос дошёл до Express - значит Nginx не обработал его
            // Возвращаем 404, чтобы браузер понял, что файл не найден
            logger.warn(`Static file request reached Express (should be served by Nginx): ${req.url}`);
            return res.status(404).send('Static file should be served by Nginx');
        }
        
        next();
    });
} else {
    // В development или serverless: обслуживаем статические файлы через Express
    app.use(express.static(staticPath, {
        setHeaders: (res, filePath) => {
            // Кэширование статических ресурсов
            if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
                res.set('Cache-Control', 'public, max-age=31536000'); // 1 год
            } else if (filePath.endsWith('.html')) {
                res.set('Cache-Control', 'no-cache');
            }
        },
        // Включаем dotfiles для файлов, начинающихся с точки
        dotfiles: 'ignore',
        // Индексные файлы
        index: false,
        // Fallthrough - если файл не найден, передаем управление дальше
        fallthrough: true
    }));
}

// ========== EMAIL CONFIGURATION ==========
const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.spaceweb.ru',
    port: smtpPort,
    secure: smtpPort === 465, // SSL для порта 465
    requireTLS: smtpPort === 587, // STARTTLS для порта 587
    // Для Mail.ru нужны дополнительные настройки TLS
    tls: {
        rejectUnauthorized: false // Отключаем проверку сертификата для Mail.ru
    },
    auth: {
        user: process.env.EMAIL_USER?.trim(), // Убираем пробелы
        pass: process.env.EMAIL_PASS?.trim()  // Убираем пробелы
    },
    // Дополнительные настройки для Mail.ru
    connectionTimeout: 10000, // 10 секунд
    greetingTimeout: 10000,
    socketTimeout: 10000
};

// Проверка наличия обязательных переменных окружения
function checkEnvVariables() {
    const required = ['EMAIL_USER', 'EMAIL_PASS', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
    const missing = required.filter(key => !process.env[key] || process.env[key].includes('YOUR_'));

    if (missing.length > 0) {
        logger.warn(`⚠️  Missing or invalid environment variables: ${missing.join(', ')}`);
        logger.warn(`⚠️  Please update .env file with real credentials`);
        logger.warn(`⚠️  Email and Telegram notifications will not work until configured`);
    }
}

checkEnvVariables();

const TELEGRAM_CONFIG = {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
};

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER;

// Email Transporter
let transporter;
try {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
        logger.warn('⚠️  Email credentials not configured');
    } else {
        transporter = nodemailer.createTransport(EMAIL_CONFIG);
        transporter.verify((error, success) => {
            if (error) {
                logger.error('❌ Email configuration error:', error.message);
                logger.error('❌ Error code:', error.code);
                logger.error('❌ Full error:', JSON.stringify(error, null, 2));
                
                // Подсказки по исправлению
                if (error.code === 'EAUTH') {
                    logger.error('💡 Решение: Используйте пароль для внешних приложений Mail.ru');
                    logger.error('💡 Создайте его: Mail.ru → Настройки → Безопасность → Пароли для внешних приложений');
                } else if (error.code === 'ECONNECTION') {
                    logger.error('💡 Решение: Проверьте SMTP_HOST и SMTP_PORT');
                    logger.error('💡 Попробуйте порт 587 вместо 465');
                }
            } else {
                logger.info('✅ Email server ready');
                logger.info(`📧 SMTP: ${EMAIL_CONFIG.host}:${EMAIL_CONFIG.port}`);
                logger.info(`📧 Security: ${EMAIL_CONFIG.secure ? 'SSL' : EMAIL_CONFIG.requireTLS ? 'STARTTLS' : 'None'}`);
                logger.info(`📧 From: ${EMAIL_CONFIG.auth.user}`);
                logger.info(`📧 To: ${NOTIFICATION_EMAIL}`);
            }
        });
    }
} catch (error) {
    logger.error('❌ Failed to create email transporter:', error);
}

// ========== SANITIZATION FUNCTIONS ==========
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
}

function sanitizeFormData(data) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

// ========== VALIDATION MIDDLEWARE ==========
const formValidationRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Имя обязательно')
        .isLength({ min: 2, max: 100 }).withMessage('Имя должно быть от 2 до 100 символов')
        .matches(/^[а-яА-ЯёЁa-zA-Z\s\-]+$/).withMessage('Имя может содержать только буквы'),

    body('phone')
        .trim()
        .notEmpty().withMessage('Телефон обязателен')
        .matches(/^\+?7\s?\(?[0-9]{3}\)?\s?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/)
        .withMessage('Неверный формат телефона'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Неверный формат email')
        .normalizeEmail(),

    body('amount')
        .optional()
        .trim()
        .custom((value) => {
            if (!value || value === '') return true; // Пустое значение разрешено
            return /^[0-9\s]+$/.test(value) || value === '';
        })
        .withMessage('Сумма может содержать только цифры'),

    body('message')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Сообщение не может быть длиннее 1000 символов')
];

// ========== TEST ROUTE FOR STATIC FILES ==========
// Тестовый маршрут для проверки доступности статических файлов
app.get('/test-static', (req, res) => {
    const fs = require('fs');
    const staticPath = path.join(__dirname, '../');
    const testFiles = {
        'index.html': path.join(staticPath, 'index.html'),
        'src/css/style.css': path.join(staticPath, 'src/css/style.css'),
        'src/js/main.js': path.join(staticPath, 'src/js/main.js'),
        'src/js/calculator.js': path.join(staticPath, 'src/js/calculator.js'),
        'assets/logo-main.svg': path.join(staticPath, 'assets/logo-main.svg')
    };
    
    const results = {};
    Object.keys(testFiles).forEach(key => {
        results[key] = {
            path: testFiles[key],
            exists: fs.existsSync(testFiles[key]),
            isFile: fs.existsSync(testFiles[key]) ? fs.statSync(testFiles[key]).isFile() : false
        };
    });
    
    res.json({
        staticPath: staticPath,
        __dirname: __dirname,
        processCwd: process.cwd(),
        files: results
    });
});

// ========== MAIN ROUTE ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ========== LEGAL PAGES ROUTES ==========
// Поддержка URL без .html расширения
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '../privacy.html'));
});
app.get('/privacy.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../terms.html'));
});
app.get('/terms.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../terms.html'));
});

app.get('/offer', (req, res) => {
    res.sendFile(path.join(__dirname, '../offer.html'));
});
app.get('/offer.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../offer.html'));
});

// ========== CONFIG ENDPOINT (для клиентской конфигурации) ==========
app.get('/api/config', (req, res) => {
    res.json({
        yandexMetrikaId: process.env.YANDEX_METRIKA_ID || 105345372, // Fallback на ваш ID
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || null
    });
});

// ========== CSRF TOKEN ENDPOINT ==========
app.get('/api/csrf-token', (req, res) => {
    const token = generateToken(req, res);
    res.json({ csrfToken: token });
});

// ========== FORM SUBMISSION HANDLER ==========
app.post('/api/submit-form',
    formLimiter,
    (req, res, next) => {
        // Логируем запрос перед CSRF проверкой
        logger.info('📋 Form submission received at /api/submit-form');
        logger.info('📋 Request headers:', JSON.stringify(req.headers, null, 2));
        logger.info('📋 Request body:', JSON.stringify(req.body, null, 2));
        logger.info('📋 Cookies:', JSON.stringify(req.cookies, null, 2));
        logger.info('📋 CSRF token in header:', req.headers['x-csrf-token']);
        next();
    },
    doubleCsrfProtection,
    csrfErrorHandler,
    formValidationRules,
    async (req, res) => {
        try {
            // Проверка валидации
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.warn('Form validation failed:', errors.array());
                logger.warn('Validation errors details:', JSON.stringify(errors.array(), null, 2));
                logger.warn('Request body:', JSON.stringify(req.body, null, 2));
                return res.status(400).json({
                    success: false,
                    message: 'Ошибка валидации данных',
                    errors: errors.array().map(err => err.msg)
                });
            }

            // Санитизация данных
            const formData = sanitizeFormData(req.body);

            logger.info('✅ Form received:', {
                type: formData.formType,
                name: formData.name,
                phone: formData.phone,
                ip: req.ip
            });

            // Отправка уведомлений
            let emailResult = false;
            let telegramResult = false;
            
            try {
                emailResult = await sendEmailNotification(formData);
            } catch (emailError) {
                logger.error('❌ Email sending error:', emailError);
            }
            
            try {
                telegramResult = await sendTelegramNotification(formData);
            } catch (telegramError) {
                logger.error('❌ Telegram sending error:', telegramError);
            }

            logger.info('📧 Email result:', emailResult);
            logger.info('📱 Telegram result:', telegramResult);

            // Отправка подтверждения клиенту
            if (formData.email && emailResult) {
                try {
                    await sendClientConfirmation(formData);
                } catch (confirmationError) {
                    logger.error('❌ Client confirmation error:', confirmationError);
                }
            }

            res.json({
                success: true,
                message: 'Заявка успешно отправлена',
                emailSent: emailResult,
                telegramSent: telegramResult
            });

        } catch (error) {
            logger.error('❌ Form submission error:', error);
            logger.error('❌ Error message:', error.message);
            logger.error('❌ Error stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера. Пожалуйста, позвоните нам: +7 906 123-15-22'
            });
        }
    }
);

// Обработка POST на корневой путь (для отладки)
app.post('/', (req, res) => {
    logger.warn('⚠️  Form submitted to / instead of /api/submit-form');
    logger.warn('⚠️  This should not happen - check JavaScript form handler');
    res.status(404).json({
        success: false,
        message: 'Форма должна отправляться на /api/submit-form'
    });
});

// ========== EMAIL NOTIFICATION ==========
async function sendEmailNotification(formData) {
    if (!transporter) {
        logger.warn('⚠️  Email transporter not configured');
        logger.warn('⚠️  Check EMAIL_USER and EMAIL_PASS in .env file');
        return false;
    }

    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
        logger.error('❌ Email credentials missing');
        return false;
    }

    try {
        const subject = getEmailSubject(formData.formType);
        const html = generateEmailHTML(formData);

        const mailOptions = {
            from: `"Вернистраховку.рф" <${EMAIL_CONFIG.auth.user}>`,
            to: NOTIFICATION_EMAIL,
            subject: subject,
            html: html
        };

        logger.info(`📧 Attempting to send email to ${NOTIFICATION_EMAIL}...`);
        logger.info(`📧 SMTP: ${EMAIL_CONFIG.host}:${EMAIL_CONFIG.port}`);
        logger.info(`📧 From: ${EMAIL_CONFIG.auth.user}`);
        logger.info(`📧 Security: ${EMAIL_CONFIG.secure ? 'SSL' : EMAIL_CONFIG.requireTLS ? 'STARTTLS' : 'None'}`);
        logger.info(`📧 User: ${EMAIL_CONFIG.auth.user}`);
        logger.info(`📧 Pass length: ${EMAIL_CONFIG.auth.pass ? EMAIL_CONFIG.auth.pass.length : 0} characters`);

        const info = await transporter.sendMail(mailOptions);
        logger.info('✅ Email sent successfully:', info.messageId);
        logger.info(`✅ Response: ${JSON.stringify(info.response)}`);
        return true;

    } catch (error) {
        logger.error('❌ Email sending error:', error.message);
        logger.error('❌ Error code:', error.code);
        logger.error('❌ Error response:', error.response);
        logger.error('❌ Full error:', JSON.stringify(error, null, 2));
        
        // Дополнительная диагностика
        if (error.code === 'EAUTH') {
            logger.error('❌ Authentication failed - check EMAIL_PASS (use app password for Mail.ru)');
            logger.error('💡 Решение:');
            logger.error('   1. Зайдите в Mail.ru → Настройки → Безопасность');
            logger.error('   2. Создайте пароль для внешних приложений');
            logger.error('   3. Обновите EMAIL_PASS в .env файле');
            logger.error('   4. Перезапустите сервер');
        } else if (error.code === 'ECONNECTION') {
            logger.error('❌ Connection failed - check SMTP_HOST and SMTP_PORT');
            logger.error('💡 Попробуйте порт 465 вместо 587 или наоборот');
        } else if (error.code === 'ETIMEDOUT') {
            logger.error('❌ Connection timeout - check firewall/network settings');
        }
        
        return false;
    }
}

// ========== TELEGRAM NOTIFICATION ==========
async function sendTelegramNotification(formData) {
    try {
        const message = generateTelegramMessage(formData);
        const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;

        const response = await axios.post(url, {
            chat_id: TELEGRAM_CONFIG.chatId,
            text: message,
            parse_mode: 'HTML'
        }, {
            timeout: 5000
        });

        logger.info('Telegram notification sent');
        return true;

    } catch (error) {
        logger.error('Telegram sending error:', error.message);
        return false;
    }
}

// ========== CLIENT CONFIRMATION EMAIL ==========
async function sendClientConfirmation(formData) {
    if (!transporter) return false;

    try {
        const mailOptions = {
            from: `"Вернистраховку.рф" <${EMAIL_CONFIG.auth.user}>`,
            to: formData.email,
            subject: 'Ваша заявка принята - Вернистраховку.рф',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563EB;">Спасибо за вашу заявку!</h2>

                    <p>Здравствуйте, <strong>${formData.name}</strong>!</p>

                    <p>Мы получили вашу заявку и свяжемся с вами в течение <strong>15 минут</strong>.</p>

                    <p>Наш специалист проведет бесплатный анализ вашего договора и рассчитает точную сумму возврата.</p>

                    <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Ваши данные:</h3>
                        <p><strong>Телефон:</strong> ${formData.phone}</p>
                        ${formData.amount ? `<p><strong>Сумма навязанных услуг:</strong> ${formData.amount} руб.</p>` : ''}
                    </div>

                    <p>Если у вас срочный вопрос, позвоните нам прямо сейчас:</p>
                    <p style="font-size: 24px; color: #2563EB; font-weight: bold;">
                        ☎ +7 906 123-15-22
                    </p>

                    <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                        С уважением,<br>
                        Команда вернистраховку.рф
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info('Client confirmation sent');
        return true;

    } catch (error) {
        logger.error('Client confirmation error:', error);
        return false;
    }
}

// ========== EMAIL SUBJECT GENERATOR ==========
function getEmailSubject(formType) {
    const subjects = {
        'hero': '🔥 НОВАЯ ЗАЯВКА с главной страницы',
        'modal': '💬 НОВАЯ ЗАЯВКА через модальное окно',
        'calculator': '🧮 НОВАЯ ЗАЯВКА через калькулятор',
        'final': '🎯 НОВАЯ ЗАЯВКА с финального CTA',
        'default': '📋 НОВАЯ ЗАЯВКА с сайта'
    };

    return subjects[formType] || subjects['default'];
}

// ========== EMAIL HTML GENERATOR ==========
function generateEmailHTML(formData) {
    const calculatedInfo = formData.calculated_amount ? `
        <tr>
            <td style="padding: 10px; background: #FEF3C7; border-radius: 8px;">
                <strong>💰 Рассчитанная сумма возврата:</strong> ${formatMoney(formData.calculated_amount)}<br>
                <strong>📊 Сумма навязанных услуг:</strong> ${formatMoney(formData.imposed_amount)}
            </td>
        </tr>
    ` : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .footer { background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 14px; }
                .info-row { padding: 12px; border-bottom: 1px solid #E5E7EB; }
                .label { font-weight: bold; color: #2563EB; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🛡️ НОВАЯ ЗАЯВКА</h1>
                    <p style="margin: 10px 0 0 0;">Вернистраховку.рф</p>
                </div>

                <div class="content">
                    <h2 style="color: #1F2937; margin-top: 0;">Тип формы: ${getFormTypeName(formData.formType)}</h2>

                    <table style="width: 100%; border-collapse: collapse;">
                        <tr class="info-row">
                            <td><span class="label">👤 Имя:</span> ${formData.name}</td>
                        </tr>
                        <tr class="info-row">
                            <td><span class="label">📱 Телефон:</span> <strong style="font-size: 18px;">${formData.phone}</strong></td>
                        </tr>
                        ${formData.email ? `
                        <tr class="info-row">
                            <td><span class="label">📧 Email:</span> ${formData.email}</td>
                        </tr>
                        ` : ''}
                        ${formData.amount ? `
                        <tr class="info-row">
                            <td><span class="label">💵 Сумма навязанных услуг:</span> ${formData.amount} руб.</td>
                        </tr>
                        ` : ''}
                        ${formData.message ? `
                        <tr class="info-row">
                            <td><span class="label">💬 Сообщение:</span> ${formData.message}</td>
                        </tr>
                        ` : ''}
                        ${calculatedInfo}
                        <tr class="info-row">
                            <td><span class="label">🕐 Время:</span> ${new Date(formData.timestamp).toLocaleString('ru-RU')}</td>
                        </tr>
                        <tr class="info-row">
                            <td><span class="label">🌐 IP:</span> ${formData.ip || 'N/A'}</td>
                        </tr>
                    </table>

                    <div style="margin-top: 30px; padding: 20px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
                        <strong>⚠️ ВАЖНО!</strong> Свяжитесь с клиентом в течение 15 минут!
                    </div>
                </div>

                <div class="footer">
                    <p>Вернистраховку.рф</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ========== TELEGRAM MESSAGE GENERATOR ==========
function generateTelegramMessage(formData) {
    const calculatedInfo = formData.calculated_amount ? `
💰 <b>Рассчитанная сумма возврата:</b> ${formatMoney(formData.calculated_amount)}
📊 <b>Сумма навязанных услуг:</b> ${formatMoney(formData.imposed_amount)}
` : '';

    return `
🔔 <b>НОВАЯ ЗАЯВКА</b> - ${getFormTypeName(formData.formType)}

👤 <b>Имя:</b> ${formData.name}
📱 <b>Телефон:</b> ${formData.phone}
${formData.email ? `📧 <b>Email:</b> ${formData.email}\n` : ''}
${formData.amount ? `💵 <b>Сумма:</b> ${formData.amount} руб.\n` : ''}
${formData.message ? `💬 <b>Сообщение:</b> ${formData.message}\n` : ''}
${calculatedInfo}
🕐 <b>Время:</b> ${new Date(formData.timestamp).toLocaleString('ru-RU')}

⚠️ <b>СВЯЖИТЕСЬ С КЛИЕНТОМ В ТЕЧЕНИЕ 15 МИНУТ!</b>
    `.trim();
}

// ========== HELPERS ==========
function getFormTypeName(type) {
    const names = {
        'hero': 'Главная страница (Hero)',
        'modal': 'Модальное окно',
        'calculator': 'Калькулятор возврата',
        'final': 'Финальный CTA',
        'default': 'Неизвестный источник'
    };
    return names[type] || names['default'];
}

function formatMoney(amount) {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    const fs = require('fs');
    const staticPath = path.join(__dirname, '../');
    const filesExist = {
        indexHtml: fs.existsSync(path.join(staticPath, 'index.html')),
        styleCss: fs.existsSync(path.join(staticPath, 'src/css/style.css')),
        mainJs: fs.existsSync(path.join(staticPath, 'src/js/main.js')),
        calculatorJs: fs.existsSync(path.join(staticPath, 'src/js/calculator.js')),
        logoSvg: fs.existsSync(path.join(staticPath, 'assets/logo-main.svg'))
    };
    
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        staticPath: staticPath,
        __dirname: __dirname,
        filesExist: filesExist
    });
});

// ========== 404 HANDLER ==========
// Обрабатываем 404 только для не-статических файлов
app.use((req, res, next) => {
    // Если это запрос статического файла
    const staticExtensions = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webmanifest', '.xml', '.txt', '.woff', '.woff2', '.ttf', '.eot', '.map'];
    const isStaticFile = staticExtensions.some(ext => req.url.endsWith(ext));
    
    if (isStaticFile) {
        // В production с Nginx статические файлы должны обслуживаться через Nginx
        if (isProductionWithNginx) {
            logger.warn(`404 Static file not found (should be served by Nginx): ${req.method} ${req.url}`);
            return res.status(404).send('Static file should be served by Nginx');
        }
        // В development/serverless возвращаем обычный 404
        logger.warn(`404 Static file not found: ${req.method} ${req.url}`);
        return res.status(404).json({ error: 'File not found' });
    }
    
    // Для остальных запросов возвращаем index.html (SPA fallback)
    logger.warn(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).sendFile(path.join(__dirname, '../index.html'));
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
    logger.error('❌ Server error:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
    });
    
    // Если ответ уже отправлен, не отправляем повторно
    if (res.headersSent) {
        return next(err);
    }
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Внутренняя ошибка сервера. Пожалуйста, позвоните нам: +7 906 123-15-22'
    });
});

// ========== CREATE LOGS DIRECTORY ==========
// Директория логов создается выше, в блоке настройки loggerTransports
// Здесь ничего не делаем, чтобы избежать дублирования

// ========== START SERVER ==========
// Запускаем сервер только если это не serverless окружение (Vercel)
if (!isServerless) {
    // Финальная проверка NODE_ENV перед запуском сервера
    // Если PM2 установил NODE_ENV, используем его, иначе используем значение из .env или 'development'
    const finalNodeEnv = process.env.NODE_ENV || 'development';
    if (finalNodeEnv !== process.env.NODE_ENV) {
        process.env.NODE_ENV = finalNodeEnv;
    }
    
    const server = app.listen(PORT, () => {
        logger.info(`
╔════════════════════════════════════════╗
║   🛡️  ВЕРНИСТРАХОВКУ.РФ - BACKEND     ║
║   Server running on port ${PORT}        ║
║   http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV}         ║
╚════════════════════════════════════════╝
        `);
    });

    // ========== GRACEFUL SHUTDOWN ==========
    process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
        });
    });
}

// ========== ERROR HANDLING ==========
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

module.exports = app;
