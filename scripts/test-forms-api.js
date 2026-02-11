/**
 * Тест API отправки форм: проверяет, что все типы заявок проходят валидацию и принимаются сервером.
 * Запуск: node scripts/test-forms-api.js [BASE_URL]
 * По умолчанию BASE_URL = http://localhost:3000 (запустите сервер: npm start)
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const isHttps = BASE_URL.startsWith('https');
const lib = isHttps ? https : http;

function request(method, path, options = {}) {
    const url = new URL(path, BASE_URL);
    return new Promise((resolve, reject) => {
        const req = lib.request({
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            rejectUnauthorized: false
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: data });
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        req.end();
    });
}

const validPayloads = {
    hero: {
        name: 'Тест',
        phone: '+7 927 123-45-67',
        amount: '50000',
        formType: 'hero',
        timestamp: new Date().toISOString(),
        page: BASE_URL + '/'
    },
    modal: {
        name: 'Иван',
        phone: '+79271234567',
        formType: 'modal',
        timestamp: new Date().toISOString(),
        page: BASE_URL + '/'
    },
    final: {
        name: 'Мария',
        phone: '8 (927) 111-22-33',
        message: 'Хочу вернуть страховку',
        formType: 'final',
        timestamp: new Date().toISOString(),
        page: BASE_URL + '/'
    },
    contact: {
        name: 'Алексей',
        phone: '+7 927 000-00-00',
        email: 'test@example.com',
        message: 'Вопрос по возврату',
        formType: 'contact',
        timestamp: new Date().toISOString(),
        page: BASE_URL + '/contacts/'
    },
    calculator: {
        name: 'Ислам (калькулятор)',
        phone: '+79272478530',
        email: '',
        calculated_amount: '147000',
        imposed_amount: '100000',
        formType: 'calculator',
        timestamp: new Date().toISOString(),
        page: BASE_URL + '/'
    }
};

async function run() {
    console.log('=== Тест API форм ===');
    console.log('BASE_URL:', BASE_URL);
    console.log('');

    let cookie = '';
    let csrfToken = '';

    try {
        const csrfRes = await request('GET', '/api/csrf-token', {
            headers: {}
        });
        if (csrfRes.status !== 200) {
            console.error('Ошибка: не удалось получить CSRF токен, статус', csrfRes.status);
            process.exit(1);
        }
        csrfToken = csrfRes.body && csrfRes.body.csrfToken;
        cookie = csrfRes.headers['set-cookie'];
        if (Array.isArray(cookie)) cookie = cookie.join('; ');
        if (!csrfToken) {
            console.error('Ошибка: в ответе нет csrfToken');
            process.exit(1);
        }
        console.log('CSRF токен получен');
    } catch (e) {
        console.error('Ошибка при запросе CSRF:', e.message);
        console.error('Убедитесь, что сервер запущен: npm start');
        process.exit(1);
    }

    const headers = {
        'x-csrf-token': csrfToken,
        'Cookie': cookie
    };

    let failed = 0;
    for (const [formType, payload] of Object.entries(validPayloads)) {
        try {
            const res = await request('POST', '/api/submit-form', {
                headers,
                body: payload
            });
            const ok = res.status === 200 && res.body && res.body.success === true;
            if (ok) {
                console.log(`  OK  ${formType}`);
            } else {
                console.log(`  FAIL ${formType}  status=${res.status}  message=${res.body && res.body.message}  errors=${JSON.stringify(res.body && res.body.errors)}`);
                failed++;
            }
        } catch (e) {
            console.log(`  FAIL ${formType}  ${e.message}`);
            failed++;
        }
    }

    console.log('');
    if (failed === 0) {
        console.log('Все тесты пройдены.');
        process.exit(0);
    } else {
        console.log(`Провалено тестов: ${failed}`);
        process.exit(1);
    }
}

run();
