// ============================================
// КАЛЬКУЛЯТОР ВОЗВРАТА НАВЯЗАННЫХ УСЛУГ
// Интегрированная версия для вернистраховку.рф
// ============================================

class ReturnCalculator {
    constructor() {
        this.MULTIPLIER_MIN = 1.5;  // Минимальный коэффициент возврата
        this.MULTIPLIER_MAX = 2.0;  // Максимальный коэффициент возврата
        this.COMPANY_COMMISSION = 0.40; // 40% комиссия компании
        this.CLIENT_SHARE = 0.60; // 60% получает клиент
    }

    /**
     * Основной расчет возврата
     */
    calculate(imposedAmount, loanType = 'consumer', earlyRepayment = false, monthsSinceIssue = 12) {
        // Валидация
        if (!imposedAmount || imposedAmount <= 0) {
            return {
                error: true,
                message: 'Укажите корректную сумму навязанных услуг'
            };
        }

        // Определение коэффициента возврата (для справки)
        let multiplier = this.calculateMultiplier(loanType, earlyRepayment, monthsSinceIssue);

        // Сначала рассчитываем breakdown компоненты
        const breakdown = this.getBreakdown(imposedAmount);
        
        // Общая сумма возврата = сумма всех компонентов breakdown
        const totalReturn = breakdown.baseReturn + breakdown.penalty + breakdown.interest + breakdown.compensation;

        // Сумма клиенту (60%)
        const clientAmount = Math.round(totalReturn * this.CLIENT_SHARE);

        // Комиссия компании (40%)
        const companyCommission = Math.round(totalReturn * this.COMPANY_COMMISSION);

        // Процент возврата от навязанной суммы
        const returnPercentage = Math.round((clientAmount / imposedAmount) * 100);

        return {
            error: false,
            imposedAmount: imposedAmount,
            totalReturn: totalReturn,
            clientAmount: clientAmount,
            companyCommission: companyCommission,
            returnPercentage: returnPercentage,
            multiplier: multiplier,
            breakdown: breakdown,
            estimatedDays: this.estimateDays(loanType)
        };
    }

    /**
     * Расчет коэффициента возврата
     */
    calculateMultiplier(loanType, earlyRepayment, monthsSinceIssue) {
        let multiplier = 1.7; // Базовый коэффициент

        // Тип кредита
        switch(loanType) {
            case 'auto':
                multiplier = 1.8;
                break;
            case 'consumer':
                multiplier = 1.7;
                break;
            case 'mortgage':
                multiplier = 1.6;
                break;
        }

        // Досрочное погашение
        if (earlyRepayment) {
            multiplier += 0.2;
        }

        // Срок с момента оформления
        if (monthsSinceIssue <= 6) {
            multiplier += 0.1;
        } else if (monthsSinceIssue <= 12) {
            multiplier += 0.05;
        }

        // Ограничение диапазона
        multiplier = Math.max(this.MULTIPLIER_MIN, Math.min(this.MULTIPLIER_MAX, multiplier));

        return multiplier;
    }

    /**
     * Детальная разбивка возврата
     * Пропорции на основе: 100,000 (основная) + 35,000 (проценты) + 35,000 (убытки) + 5,000 (моральный вред) + 70,000 (штраф) = 245,000
     * Пропорции от навязанной суммы (100,000):
     * - Основная сумма: 1.0
     * - Проценты за пользование: 0.35
     * - Убытки ввиде процентов: 0.35
     * - Моральный вред: 0.05
     * - Штраф: 0.70
     * Итого: 2.45x от навязанной суммы
     */
    getBreakdown(imposed) {
        // Основная сумма возврата: 1.0
        const baseReturn = imposed;
        
        // Проценты за пользование + убытки ввиде процентов: 0.35 + 0.35 = 0.7
        const interest = Math.round(imposed * 0.7);
        
        // Компенсация морального вреда: 0.05
        const compensation = Math.round(imposed * 0.05);
        
        // Неустойка (штраф): 0.70
        const penalty = Math.round(imposed * 0.7);

        return {
            baseReturn: baseReturn,
            penalty: penalty,
            interest: interest,
            compensation: compensation
        };
    }

    /**
     * Оценка времени возврата
     */
    estimateDays(loanType) {
        const estimates = {
            'consumer': { min: 14, max: 30 },
            'auto': { min: 20, max: 35 },
            'mortgage': { min: 25, max: 40 }
        };

        return estimates[loanType] || { min: 14, max: 30 };
    }

    /**
     * Форматирование числа в денежный формат
     */
    formatMoney(amount) {
        return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    const calculator = new ReturnCalculator();
    
    // Элементы формы
    const form = document.getElementById('calculator-form');
    const imposedAmountInput = document.getElementById('imposed-amount');
    const loanDateInput = document.getElementById('loan-date');
    const calculateBtn = document.getElementById('calculate-btn');
    
    // Элементы результата
    const resultSection = document.getElementById('result-section');
    
    // Предотвращаем выделение placeholder в поле даты
    if (loanDateInput) {
        // Обработчик для предотвращения выделения placeholder при фокусе
        loanDateInput.addEventListener('focus', function(e) {
            // Если поле пустое, убираем выделение через небольшую задержку
            if (!this.value) {
                setTimeout(() => {
                    if (this.setSelectionRange) {
                        this.setSelectionRange(0, 0);
                    }
                    // Также убираем выделение через Selection API
                    if (window.getSelection) {
                        window.getSelection().removeAllRanges();
                    }
                }, 0);
            }
        });
        
        // Также обрабатываем событие click
        loanDateInput.addEventListener('click', function(e) {
            if (!this.value) {
                setTimeout(() => {
                    if (this.setSelectionRange) {
                        this.setSelectionRange(0, 0);
                    }
                    if (window.getSelection) {
                        window.getSelection().removeAllRanges();
                    }
                }, 0);
            }
        });
    }

    // Маска для суммы с символом рубля
    if (imposedAmountInput) {
        // Убираем символ рубля при фокусе для удобства редактирования
        imposedAmountInput.addEventListener('focus', function() {
            if (imposedAmountInput.value.includes(' ₽')) {
                imposedAmountInput.value = imposedAmountInput.value.replace(' ₽', '').trim();
            }
        });
        
        // Форматируем число при вводе (БЕЗ символа рубля - он добавится только при blur)
        imposedAmountInput.addEventListener('input', function(e) {
            // Убираем все нецифровые символы, включая символ рубля и пробелы
            let value = e.target.value.replace(/[^\d]/g, '');
            
            if (value) {
                // Форматируем с пробелами-разделителями тысяч (БЕЗ символа рубля)
                const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                e.target.value = formatted;
            } else {
                // Если поле пустое, оставляем пустым
                e.target.value = '';
            }
        });
        
        // Добавляем символ рубля только при потере фокуса
        imposedAmountInput.addEventListener('blur', function() {
            const cleanValue = imposedAmountInput.value.replace(/\s/g, '').replace(/[^\d]/g, '');
            if (cleanValue) {
                // Форматируем и добавляем символ рубля
                const formatted = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                imposedAmountInput.value = formatted + ' ₽';
            } else {
                // Если поле пустое, оставляем пустым
                imposedAmountInput.value = '';
            }
        });
    }

    // Обработчик формы - предотвращаем стандартную отправку
    const calculatorForm = document.getElementById('calculator-form');
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Вызываем расчет вместо отправки формы
            if (calculateBtn) {
                calculateBtn.click();
            }
        });
    }
    
    // Обработчик расчета
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Предотвращаем автоматический фокус на поле даты браузером
            // Убираем фокус со всех полей перед валидацией
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                document.activeElement.blur();
            }
            
            // Получение данных формы
            // Удаляем пробелы и символ рубля перед парсингом
            const imposedAmountStr = imposedAmountInput.value.replace(/\s/g, '').replace('₽', '').trim();
            const imposedAmount = parseInt(imposedAmountStr);
            
            if (!imposedAmount || imposedAmount <= 0) {
                // Визуальная валидация - выделяем поле красным
                imposedAmountInput.classList.add('border-red-500');
                imposedAmountInput.classList.remove('border-gray-300', 'focus:border-primary');
                imposedAmountInput.style.borderColor = '#ef4444'; // red-500
                imposedAmountInput.focus();
                
                // Убираем красное выделение при вводе
                const removeError = function() {
                    imposedAmountInput.classList.remove('border-red-500');
                    imposedAmountInput.classList.add('border-gray-300', 'focus:border-primary');
                    imposedAmountInput.style.borderColor = '';
                    imposedAmountInput.removeEventListener('input', removeError);
                };
                imposedAmountInput.addEventListener('input', removeError, { once: true });
                
                return;
            }
            
            // Убираем красное выделение если валидация прошла
            imposedAmountInput.classList.remove('border-red-500');
            imposedAmountInput.classList.add('border-gray-300', 'focus:border-primary');
            imposedAmountInput.style.borderColor = '';
            
            const loanType = document.querySelector('input[name="loan-type"]:checked')?.value || 'consumer';
            
            // Валидация даты (обязательное поле)
            if (!loanDateInput || !loanDateInput.value || loanDateInput.value.trim() === '') {
                // Визуальная валидация - выделяем поле даты красным
                if (loanDateInput) {
                    loanDateInput.classList.add('border-red-500', 'ring-2', 'ring-red-200');
                    loanDateInput.classList.remove('border-gray-300', 'focus:border-primary');
                    loanDateInput.style.borderColor = '#ef4444'; // red-500
                    loanDateInput.style.borderWidth = '2px';
                    
                    // НЕ фокусируем поле, чтобы не выделялся placeholder
                    // Просто подсвечиваем его красным - пользователь сам кликнет
                    // Это предотвратит выделение placeholder "дд"
                    
                    // НЕ добавляем атрибут required - он вызывает автоматический фокус браузера
                    // Используем только кастомную валидацию
                    
                    // Показываем сообщение об ошибке
                    if (!loanDateInput.nextElementSibling || !loanDateInput.nextElementSibling.classList.contains('date-error-message')) {
                        const errorMsg = document.createElement('p');
                        errorMsg.className = 'date-error-message text-red-500 text-sm mt-1';
                        errorMsg.textContent = 'Пожалуйста, укажите дату оформления кредита';
                        loanDateInput.parentNode.insertBefore(errorMsg, loanDateInput.nextSibling);
                    }
                    
                    // Убираем красное выделение и сообщение об ошибке при выборе даты или вводе
                    const removeDateError = function() {
                        loanDateInput.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
                        loanDateInput.classList.add('border-gray-300', 'focus:border-primary');
                        loanDateInput.style.borderColor = '';
                        loanDateInput.style.borderWidth = '';
                        const errorMsg = loanDateInput.parentNode.querySelector('.date-error-message');
                        if (errorMsg) {
                            errorMsg.remove();
                        }
                        loanDateInput.removeEventListener('change', removeDateError);
                        loanDateInput.removeEventListener('input', removeDateError);
                    };
                    loanDateInput.addEventListener('change', removeDateError, { once: true });
                    loanDateInput.addEventListener('input', removeDateError, { once: true });
                }
                
                return;
            }
            
            // Убираем красное выделение если валидация прошла
            loanDateInput.classList.remove('border-red-500');
            loanDateInput.classList.add('border-gray-300', 'focus:border-primary');
            loanDateInput.style.borderColor = '';
            
            // Расчет месяцев с момента оформления
            let monthsSinceIssue = 12;
            if (loanDateInput && loanDateInput.value) {
                const loanDate = new Date(loanDateInput.value);
                const now = new Date();
                monthsSinceIssue = Math.round((now - loanDate) / (1000 * 60 * 60 * 24 * 30));
            }

            // Выполнение расчета
            const result = calculator.calculate(imposedAmount, loanType, false, monthsSinceIssue);

            if (result.error) {
                // Визуальная валидация - выделяем поле красным
                imposedAmountInput.classList.add('border-red-500');
                imposedAmountInput.classList.remove('border-gray-300', 'focus:border-primary');
                imposedAmountInput.style.borderColor = '#ef4444'; // red-500
                imposedAmountInput.focus();
                
                // Убираем красное выделение при вводе
                const removeError = function() {
                    imposedAmountInput.classList.remove('border-red-500');
                    imposedAmountInput.classList.add('border-gray-300', 'focus:border-primary');
                    imposedAmountInput.style.borderColor = '';
                    imposedAmountInput.removeEventListener('input', removeError);
                };
                imposedAmountInput.addEventListener('input', removeError, { once: true });
                
                return;
            }

            // Отображение результата
            displayResult(result);
            
            // Прокрутка к результату
            setTimeout(() => {
                if (resultSection) {
                    // Убеждаемся, что блок видим
                    resultSection.classList.remove('hidden');
                    
                    // Небольшая задержка для рендеринга контента
                    requestAnimationFrame(() => {
                        // Используем scrollIntoView с учетом scroll-margin-top из CSS
                        resultSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start',
                            inline: 'nearest'
                        });
                    });
                }
            }, 100);
            
            // Отправка события аналитики
            if (typeof trackClick !== 'undefined') {
                trackClick('calculator_calculated');
            }
            
            // Яндекс.Метрика
            if (typeof ym !== 'undefined') {
                ym(YANDEX_METRIKA_ID, 'reachGoal', 'calculator_used');
            }
        });
    }

    // ========== ОТОБРАЖЕНИЕ РЕЗУЛЬТАТА ==========
    function displayResult(result) {
        if (!resultSection) return;

        // Показываем секцию
        resultSection.classList.remove('hidden');
        resultSection.classList.add('animate-slide-up');

        // Генерируем HTML результата (заполним ниже)
        resultSection.innerHTML = `
            <div class="result-card">
                <div class="result-header">
                    <span class="result-badge">Предварительный расчёт</span>
                    <h2>Вы можете вернуть деньги по кредиту</h2>
                    <p>Мы оценили приблизительную сумму, которую банк должен вернуть по вашему договору.</p>
                </div>

                <div class="result-summary-grid">
                    <div class="result-summary-item result-summary-item--accent">
                        <p class="result-summary-label">Вы получите на руки</p>
                        <span class="result-amount result-amount--accent" id="client-amount-display">0 ₽</span>
                        <p class="result-note">Переведём на ваш счёт после поступления средств от банка</p>
                    </div>
                    <div class="result-summary-item">
                        <p class="result-summary-label">Общий возврат от банка</p>
                        <span class="result-amount" id="total-return-display">0 ₽</span>
                        <p class="result-note">Включает штрафы, проценты и компенсацию</p>
                    </div>
                    <div class="result-summary-item">
                        <p class="result-summary-label">Наш гонорар</p>
                        <span class="result-amount">${calculator.formatMoney(result.companyCommission)}</span>
                        <p class="result-note">Оплата только после фактического возврата</p>
                    </div>
                </div>

                <div class="result-breakdown">
                    <p class="result-explanation-title">Из чего складывается сумма</p>
                    <ul class="result-breakdown-list">
                        <li><span>Основная сумма возврата</span><strong>${calculator.formatMoney(result.breakdown.baseReturn)}</strong></li>
                        <li><span>Неустойка за нарушение прав</span><strong>${calculator.formatMoney(result.breakdown.penalty)}</strong></li>
                        <li><span>Проценты за пользование</span><strong>${calculator.formatMoney(result.breakdown.interest)}</strong></li>
                        <li><span>Компенсация морального вреда</span><strong>${calculator.formatMoney(result.breakdown.compensation)}</strong></li>
                    </ul>

                    <div class="result-timeline">
                        <p class="result-timeline-title">Сроки получения денег</p>
                        <p><strong>Средний возврат: 2–8 месяцев.</strong></p>
                        <p>Если банк затягивает процесс и требуется судебное решение, процедура может занять до 24 месяцев — мы сопровождаем вас и заранее предупреждаем о сроках.</p>
                    </div>
                </div>

                <div class="result-cta">
                    <p class="cta-text">Хотите подтвердить расчёт и получить индивидуальный план?</p>
                    <p class="cta-description">Оставьте контакты — проведём бесплатную экспертизу договора и уточним точную сумму возврата.</p>

                    <form id="contact-form" class="contact-form" method="post">
                        <input type="text" name="name" placeholder="Ваше имя" required>
                        <input type="tel" name="phone" id="calc-result-phone" placeholder="+7 (___) ___-__-__" required>
                        <input type="email" name="email" placeholder="Email (необязательно)">

                        <input type="hidden" name="calculated_amount" value="${result.clientAmount}">
                        <input type="hidden" name="imposed_amount" value="${result.imposedAmount}">

                        <label class="checkbox-label">
                            <input type="checkbox" required class="w-4 h-4">
                            <span>Согласен с политикой конфиденциальности</span>
                        </label>

                        <button type="submit" class="btn-submit">
                            <i class="fas fa-paper-plane mr-2"></i>
                            ПОЛУЧИТЬ ТОЧНЫЙ РАСЧЁТ
                        </button>
                    </form>

                    <p class="disclaimer">* Расчёт ориентировочный. Точная сумма зависит от условий договора, позиции банка и судебной практики.</p>
                </div>
            </div>
        `;

        // Анимация цифр
        animateNumber(
            document.getElementById('total-return-display'), 
            0, 
            result.totalReturn, 
            1500
        );
        
        animateNumber(
            document.getElementById('client-amount-display'), 
            0, 
            result.clientAmount, 
            1500
        );

        // Инициализация маски телефона в форме результата
        const phoneInput = document.getElementById('calc-result-phone');
        if (phoneInput && typeof IMask !== 'undefined') {
            IMask(phoneInput, {
                mask: '+{7} (000) 000-00-00',
                lazy: false,
                placeholderChar: '_'
            });
        }
        
        // Добавляем обработчик для формы калькулятора (создается динамически)
        const calculatorForm = document.getElementById('contact-form');
        if (calculatorForm) {
            // Удаляем старый обработчик, если есть
            const newForm = calculatorForm.cloneNode(true);
            calculatorForm.parentNode.replaceChild(newForm, calculatorForm);
            
            // Добавляем новый обработчик
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📋 Calculator form submit intercepted');
                if (typeof window.handleFormSubmit === 'function') {
                    window.handleFormSubmit(e, 'calculator');
                } else {
                    console.error('❌ handleFormSubmit не найдена');
                }
            });
            console.log('✅ Calculator form handler attached');
        }
    }

    // ========== АНИМАЦИЯ ЧИСЕЛ ==========
    function animateNumber(element, start, end, duration) {
        if (!element) return;

        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = calculator.formatMoney(Math.round(current));
        }, 16);
    }

    console.log('✅ Calculator.js инициализирован');
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReturnCalculator;
}

