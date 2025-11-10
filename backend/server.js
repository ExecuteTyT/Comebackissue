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

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://api.telegram.org"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
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

// Добавляем Vercel домены в разрешенные origins
const vercelOrigins = process.env.VERCEL_URL 
    ? [`https://${process.env.VERCEL_URL}`, `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`]
    : [];

app.use(cors({
    origin: function(origin, callback) {
        // Разрешаем запросы без origin (например, mobile apps или curl)
        if (!origin) return callback(null, true);

        // Разрешаем запросы с Vercel доменов
        if (process.env.VERCEL && origin.includes('vercel.app')) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1 || 
            vercelOrigins.some(vOrigin => origin.includes(vOrigin)) ||
            process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Слишком много запросов с вашего IP, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Слишком много запросов. Пожалуйста, позвоните нам: 8-904-666-66-46'
        });
    }
});

// Применяем rate limiting ко всем запросам
app.use(limiter);

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
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS']
});

// Статические файлы
app.use(express.static(path.join(__dirname, '../'), {
    setHeaders: (res, path) => {
        // Кэширование статических ресурсов
        if (path.endsWith('.js') || path.endsWith('.css')) {
            res.set('Cache-Control', 'public, max-age=31536000'); // 1 год
        } else if (path.endsWith('.html')) {
            res.set('Cache-Control', 'no-cache');
        }
    }
}));

// ========== EMAIL CONFIGURATION ==========
const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.spaceweb.ru',
    port: smtpPort,
    secure: smtpPort === 465, // SSL для порта 465, STARTTLS для портов 25/2525
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
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
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    transporter.verify((error, success) => {
        if (error) {
            logger.error('❌ Email configuration error:', error);
        } else {
            logger.info('✅ Email server ready');
        }
    });
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
        .matches(/^[0-9\s]+$/).withMessage('Сумма может содержать только цифры'),

    body('message')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Сообщение не может быть длиннее 1000 символов')
];

// ========== MAIN ROUTE ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ========== CSRF TOKEN ENDPOINT ==========
app.get('/api/csrf-token', (req, res) => {
    const token = generateToken(req, res);
    res.json({ csrfToken: token });
});

// ========== FORM SUBMISSION HANDLER ==========
app.post('/api/submit-form',
    formLimiter,
    doubleCsrfProtection,
    formValidationRules,
    async (req, res) => {
        try {
            // Проверка валидации
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.warn('Form validation failed:', errors.array());
                return res.status(400).json({
                    success: false,
                    message: 'Ошибка валидации данных',
                    errors: errors.array().map(err => err.msg)
                });
            }

            // Санитизация данных
            const formData = sanitizeFormData(req.body);

            logger.info('Form received:', {
                type: formData.formType,
                name: formData.name,
                ip: req.ip
            });

            // Отправка уведомлений
            const emailResult = await sendEmailNotification(formData);
            const telegramResult = await sendTelegramNotification(formData);

            // Отправка подтверждения клиенту
            if (formData.email && emailResult) {
                await sendClientConfirmation(formData);
            }

            res.json({
                success: true,
                message: 'Заявка успешно отправлена',
                emailSent: emailResult,
                telegramSent: telegramResult
            });

        } catch (error) {
            logger.error('Form submission error:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка сервера. Пожалуйста, позвоните нам: 8-904-666-66-46'
            });
        }
    }
);

// ========== EMAIL NOTIFICATION ==========
async function sendEmailNotification(formData) {
    if (!transporter) {
        logger.warn('Email transporter not configured');
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

        const info = await transporter.sendMail(mailOptions);
        logger.info('Email sent:', info.messageId);
        return true;

    } catch (error) {
        logger.error('Email sending error:', error);
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
                        ☎ 8-904-666-66-46
                    </p>

                    <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                        С уважением,<br>
                        Команда вернистраховку.рф<br>
                        ИП ГИЛЬВАНОВА АЙГУЛЬ РАИСОВНА
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
                    <p>ИП ГИЛЬВАНОВА АЙГУЛЬ РАИСОВНА</p>
                    <p>8-904-666-66-46 | delovoi_podhod@inbox.ru</p>
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
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).sendFile(path.join(__dirname, '../index.html'));
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера. Пожалуйста, позвоните нам: 8-904-666-66-46'
    });
});

// ========== CREATE LOGS DIRECTORY ==========
// Директория логов создается выше, в блоке настройки loggerTransports
// Здесь ничего не делаем, чтобы избежать дублирования

// ========== START SERVER ==========
// Запускаем сервер только если это не serverless окружение (Vercel)
if (!isServerless) {
    const server = app.listen(PORT, () => {
        logger.info(`
╔════════════════════════════════════════╗
║   🛡️  ВЕРНИСТРАХОВКУ.РФ - BACKEND     ║
║   Server running on port ${PORT}        ║
║   http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}         ║
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
