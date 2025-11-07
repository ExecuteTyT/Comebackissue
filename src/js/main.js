// ============================================
// ВЕРНИСТРАХОВКУ.РФ - MAIN JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== INITIALIZATION ========== 
    initAOS();
    initSwiper();
    initPhoneMasks();
    initMobileMenu();
    initHeaderScroll();
    initFAQ();
    initModalHandlers();
    initSmoothScroll();
    
    console.log('✅ Сайт вернистраховку.рф загружен успешно');
});

// ========== CSRF TOKEN ==========
let csrfToken = null;

// Получение CSRF токена при загрузке страницы
async function fetchCSRFToken() {
    try {
        const response = await fetch('/api/csrf-token', {
            credentials: 'include'
        });
        const data = await response.json();
        csrfToken = data.csrfToken;
        console.log('✅ CSRF token получен');
    } catch (error) {
        console.warn('⚠️ Не удалось получить CSRF токен:', error);
    }
}

// Получаем CSRF токен при загрузке
fetchCSRFToken();

// ========== YANDEX METRIKA CONFIGURATION ==========
const YANDEX_METRIKA_ID = window.YANDEX_METRIKA_ID || null;

// ========== AOS INITIALIZATION ==========
function initAOS() {
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });
}

// ========== SWIPER INITIALIZATION ==========
function initSwiper() {
    const swiper = new Swiper('.reviewsSwiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            },
        }
    });
}

// ========== PHONE MASK INITIALIZATION ==========
function initPhoneMasks() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        const mask = IMask(input, {
            mask: '+{7} (000) 000-00-00',
            lazy: false,
            placeholderChar: '_'
        });
    });
}

// ========== MOBILE MENU ==========
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Закрытие меню при клике на ссылку
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        // Закрытие меню при клике вне его
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                if (mobileMenu.classList.contains('active')) {
                    closeMobileMenu();
                }
            }
        });

        // Закрытие меню при нажатии ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    }
}

function toggleMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    mobileMenu.classList.remove('hidden');
    // Небольшая задержка для срабатывания CSS анимации
    setTimeout(() => {
        mobileMenu.classList.add('active');
    }, 10);

    document.body.style.overflow = 'hidden';
    menuBtn.classList.add('active');

    const icon = menuBtn.querySelector('i');
    if (icon) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    }

    // Отслеживаем открытие меню
    if (typeof trackClick !== 'undefined') {
        trackClick('mobile_menu_open');
    }
}

function closeMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    mobileMenu.classList.remove('active');
    menuBtn.classList.remove('active');

    // Ждем окончания анимации перед скрытием
    setTimeout(() => {
        mobileMenu.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);

    const icon = menuBtn.querySelector('i');
    if (icon) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
}

// ========== HEADER SCROLL SHADOW ==========
function initHeaderScroll() {
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled', 'shadow-lg');
        } else {
            header.classList.remove('scrolled', 'shadow-lg');
        }
    });
}

// ========== FAQ ACCORDION ==========
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Закрыть все другие
            faqItems.forEach(i => {
                i.classList.remove('active');
                const answer = i.querySelector('.faq-answer');
                answer.style.display = 'none';
            });
            
            // Открыть текущий (если не был активен)
            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                answer.style.display = 'block';
            }
        });
    });
    
    // Открыть первый вопрос по умолчанию
    if (faqItems.length > 0) {
        faqItems[0].classList.add('active');
        faqItems[0].querySelector('.faq-answer').style.display = 'block';
    }
}

// ========== MODAL HANDLERS ==========
function initModalHandlers() {
    const modal = document.getElementById('modal');
    
    if (modal) {
        // Закрытие по клику вне модалки
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
}

// ========== OPEN/CLOSE MODAL ==========
function openModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Отправка события в Яндекс.Метрику (если подключена)
        if (typeof ym !== 'undefined') {
            ym(YANDEX_METRIKA_ID, 'reachGoal', 'open_modal');
        }
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Делаем функции глобальными для onclick
window.openModal = openModal;
window.closeModal = closeModal;

// ========== SMOOTH SCROLL ==========
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Игнорировать якоря типа "#privacy", "#terms" и т.д. (если нет таких секций)
            if (href === '#' || href.length <= 1) {
                e.preventDefault();
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========== FORM SUBMISSION HANDLER ==========
function handleFormSubmit(event, formType) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Добавляем тип формы
    data.formType = formType;
    data.timestamp = new Date().toISOString();
    data.page = window.location.href;
    
    console.log('📋 Отправка формы:', formType, data);
    
    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Отправка...<span class="spinner"></span>';
    
    // Отправка данных на сервер
    fetch('/api/submit-form', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка сервера');
        }
        return response.json();
    })
    .then(result => {
        console.log('✅ Форма отправлена успешно:', result);
        
        // Показываем успешное сообщение
        showSuccessMessage(formType);
        
        // Очищаем форму
        form.reset();
        
        // Отправка цели в Яндекс.Метрику
        if (typeof ym !== 'undefined') {
            ym(YANDEX_METRIKA_ID, 'reachGoal', 'form_submit_' + formType);
        }
        
        // Закрываем модалку, если была открыта
        if (formType === 'modal') {
            setTimeout(() => {
                closeModal();
            }, 2000);
        }
    })
    .catch(error => {
        console.error('❌ Ошибка отправки формы:', error);
        
        // Показываем сообщение об ошибке
        showErrorMessage();
    })
    .finally(() => {
        // Возвращаем кнопку в исходное состояние
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

// Делаем функцию глобальной
window.handleFormSubmit = handleFormSubmit;

// ========== SUCCESS MESSAGE ==========
function showSuccessMessage(formType) {
    // Создаем всплывающее уведомление
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-slide-up';
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-check-circle text-2xl"></i>
            <div>
                <p class="font-bold">Спасибо за заявку!</p>
                <p class="text-sm">Мы свяжемся с вами в течение 15 минут</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически убираем через 5 секунд
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// ========== ERROR MESSAGE ==========
function showErrorMessage() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-slide-up';
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-exclamation-circle text-2xl"></i>
            <div>
                <p class="font-bold">Ошибка отправки</p>
                <p class="text-sm">Пожалуйста, позвоните нам: <a href="tel:+79046666646" class="underline">8-904-666-66-46</a></p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 7000);
}

// ========== CLICK TRACKING FOR ANALYTICS ==========
function trackClick(eventName) {
    console.log('📊 Отслеживание клика:', eventName);
    
    // Яндекс.Метрика
    if (typeof ym !== 'undefined') {
        ym(YANDEX_METRIKA_ID, 'reachGoal', eventName);
    }
    
    // Google Analytics (если подключен)
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            'event_category': 'engagement',
            'event_label': eventName
        });
    }
}

// ========== PHONE CLICK TRACKING ==========
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
        trackClick('phone_call');
    });
});

// ========== MESSENGER CLICK TRACKING ==========
document.querySelectorAll('a[href*="whatsapp"], a[href*="telegram"], a[href*="vk.com"]').forEach(link => {
    link.addEventListener('click', () => {
        const messenger = link.href.includes('whatsapp') ? 'whatsapp' : 
                         link.href.includes('telegram') ? 'telegram' : 'vk';
        trackClick('messenger_' + messenger);
    });
});

// ========== EXIT INTENT POPUP ==========
let exitIntentShown = false;

document.addEventListener('mouseleave', function(e) {
    // Проверяем, что курсор вышел через верх страницы
    if (e.clientY < 0 && !exitIntentShown) {
        exitIntentShown = true;
        
        // Задержка перед показом
        setTimeout(() => {
            openModal();
            trackClick('exit_intent');
        }, 500);
    }
});

// ========== SCROLL TO TOP BUTTON (OPTIONAL) ==========
const scrollTopBtn = document.createElement('button');
scrollTopBtn.id = 'scroll-to-top';
scrollTopBtn.className = 'fixed bottom-24 right-6 w-12 h-12 bg-primary hover:bg-blue-700 text-white rounded-full items-center justify-center text-xl shadow-lg hover:scale-110 transition z-40 hidden';
scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollTopBtn.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackClick('scroll_to_top');
};

document.body.appendChild(scrollTopBtn);

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        scrollTopBtn.classList.remove('hidden');
        scrollTopBtn.classList.add('flex');
    } else {
        scrollTopBtn.classList.add('hidden');
        scrollTopBtn.classList.remove('flex');
    }
});

// ========== CALCULATOR SCROLL TRACKING ==========
const calculatorSection = document.getElementById('calculator');
if (calculatorSection) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                trackClick('calculator_view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(calculatorSection);
}

// ========== PAGE SCROLL TRACKING ==========
let scrollPercentage = 0;
let scrollMilestones = [25, 50, 75, 100];

window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const currentPercentage = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
    
    // Отслеживаем вехи прокрутки
    scrollMilestones.forEach(milestone => {
        if (currentPercentage >= milestone && scrollPercentage < milestone) {
            trackClick('scroll_' + milestone);
        }
    });
    
    scrollPercentage = currentPercentage;
});

// ========== UTILITY FUNCTIONS ==========
function formatMoney(amount) {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11;
}

// Экспортируем функции для глобального использования
window.formatMoney = formatMoney;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.trackClick = trackClick;

console.log('✅ main.js загружен и инициализирован');

