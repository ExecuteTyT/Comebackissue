// ============================================
// BACKEND SERVER ДЛЯ ВЕРНИСТРАХОВКУ.РФ
// Node.js + Express + Nodemailer + Telegram Bot
// ============================================

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, '../')));

// ========== CONFIGURATION ==========
const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.inbox.ru',
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || 'delovoi_podhod@inbox.ru',
        pass: process.env.EMAIL_PASS || 'YOUR_EMAIL_PASSWORD'
    }
};

const TELEGRAM_CONFIG = {
    botToken: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN',
    chatId: process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID'
};

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'delovoi_podhod@inbox.ru';

// ========== EMAIL TRANSPORTER ==========
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Проверка подключения
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Ошибка подключения к email:', error);
    } else {
        console.log('✅ Email сервер готов к отправке писем');
    }
});

// ========== MAIN ROUTE ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ========== FORM SUBMISSION HANDLER ==========
app.post('/api/submit-form', async (req, res) => {
    try {
        const formData = req.body;
        
        console.log('📋 Получена форма:', formData.formType);
        console.log('📝 Данные:', JSON.stringify(formData, null, 2));

        // Валидация
        if (!formData.name || !formData.phone) {
            return res.status(400).json({
                success: false,
                message: 'Не указаны обязательные поля'
            });
        }

        // Отправка уведомлений
        const emailResult = await sendEmailNotification(formData);
        const telegramResult = await sendTelegramNotification(formData);

        // Отправка подтверждения клиенту (опционально)
        if (formData.email) {
            await sendClientConfirmation(formData);
        }

        res.json({
            success: true,
            message: 'Заявка успешно отправлена',
            emailSent: emailResult,
            telegramSent: telegramResult
        });

    } catch (error) {
        console.error('❌ Ошибка обработки формы:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера. Пожалуйста, позвоните нам: 8-904-666-66-46'
        });
    }
});

// ========== EMAIL NOTIFICATION ==========
async function sendEmailNotification(formData) {
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
        console.log('✅ Email отправлен:', info.messageId);
        return true;

    } catch (error) {
        console.error('❌ Ошибка отправки email:', error);
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
        });

        console.log('✅ Telegram уведомление отправлено');
        return true;

    } catch (error) {
        console.error('❌ Ошибка отправки в Telegram:', error.message);
        return false;
    }
}

// ========== CLIENT CONFIRMATION EMAIL ==========
async function sendClientConfirmation(formData) {
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
                        ООО «Деловой подход+»
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Подтверждение клиенту отправлено');
        return true;

    } catch (error) {
        console.error('❌ Ошибка отправки подтверждения:', error);
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
                            <td><span class="label">🌐 Страница:</span> ${formData.page}</td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 30px; padding: 20px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
                        <strong>⚠️ ВАЖНО!</strong> Свяжитесь с клиентом в течение 15 минут!
                    </div>
                </div>
                
                <div class="footer">
                    <p>ООО «Деловой подход+»</p>
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
        uptime: process.uptime()
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🛡️  ВЕРНИСТРАХОВКУ.РФ - BACKEND     ║
║   Server running on port ${PORT}        ║
║   http://localhost:${PORT}              ║
╚════════════════════════════════════════╝
    `);
});

// ========== ERROR HANDLING ==========
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

