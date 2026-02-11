// ============================================
// ВЕРНИСТРАХОВКУ.РФ - MAIN JAVASCRIPT
// ============================================

console.log('📦 ========== MAIN.JS ЗАГРУЖАЕТСЯ ==========');
console.log('⏰ Время загрузки:', new Date().toISOString());
console.log('🔍 document.readyState:', document.readyState);
console.log('🔍 window доступен:', typeof window !== 'undefined');

// ========== OPEN/CLOSE MODAL (ДОЛЖНЫ БЫТЬ ДОСТУПНЫ ГЛОБАЛЬНО СРАЗУ) ==========
function openModal() {
    console.log('🔓 ========== OPEN MODAL CALLED ==========');
    console.log('📍 Функция openModal вызвана');
    console.log('🔍 Проверяю доступность document:', typeof document);
    console.log('🔍 Проверяю document.readyState:', document.readyState);
    
    const modal = document.getElementById('modal');
    console.log('🔍 Результат поиска модалки:', modal);
    console.log('🔍 Тип результата:', typeof modal);
    
    if (modal) {
        console.log('✅ Модалка найдена!');
        console.log('📋 Текущие классы модалки:', modal.className);
        console.log('📋 classList до изменений:', Array.from(modal.classList));
        
        modal.classList.remove('hidden');
        console.log('✅ Класс "hidden" удален');
        
        modal.classList.add('active');
        console.log('✅ Класс "active" добавлен');
        
        console.log('📋 classList после изменений:', Array.from(modal.classList));
        console.log('📋 Текущие классы модалки:', modal.className);
        
        document.body.style.overflow = 'hidden';
        console.log('✅ body.overflow установлен в hidden');
        
        // Проверяем computed styles
        const computedStyle = window.getComputedStyle(modal);
        console.log('🎨 Computed display:', computedStyle.display);
        console.log('🎨 Computed visibility:', computedStyle.visibility);
        console.log('🎨 Computed opacity:', computedStyle.opacity);
        
        // Отправка события в Яндекс.Метрику (если подключена)
        if (typeof ym !== 'undefined' && typeof YANDEX_METRIKA_ID !== 'undefined') {
            ym(YANDEX_METRIKA_ID, 'reachGoal', 'open_modal');
            console.log('📊 Событие отправлено в Яндекс.Метрику');
        } else {
            console.log('⚠️ Яндекс.Метрика не подключена или ID не определен');
        }
        
        console.log('✅ ========== MODAL OPENED SUCCESSFULLY ==========');
    } else {
        console.error('❌ ========== MODAL NOT FOUND ==========');
        console.error('❌ Модалка не найдена! Проверьте наличие элемента с id="modal"');
        console.error('🔍 Ищу все элементы с классом modal:', document.querySelectorAll('.modal'));
        console.error('🔍 Ищу все элементы с id modal:', document.querySelectorAll('#modal'));
    }
}

function closeModal() {
    console.log('🔒 ========== CLOSE MODAL CALLED ==========');
    const modal = document.getElementById('modal');
    console.log('🔍 Модалка найдена для закрытия:', modal);
    
    if (modal) {
        console.log('📋 Классы до закрытия:', Array.from(modal.classList));
        // Убираем класс active
        modal.classList.remove('active');
        // Добавляем hidden сразу
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        console.log('📋 Классы после закрытия:', Array.from(modal.classList));
        console.log('✅ Модалка закрыта');
    } else {
        console.error('❌ Модалка не найдена для закрытия');
    }
}

// Делаем функции глобальными для onclick (ДО загрузки DOM)
console.log('🔧 Регистрирую глобальные функции...');
window.openModal = openModal;
window.closeModal = closeModal;
console.log('✅ window.openModal установлена:', typeof window.openModal);
console.log('✅ window.closeModal установлена:', typeof window.closeModal);

// Функция инициализации, которая может быть вызвана в любое время
function initializePage() {
    console.log('📄 ========== INITIALIZATION START ==========');
    console.log('🔍 document.readyState:', document.readyState);
    
    // Проверяем доступность функций
    console.log('🔍 Проверка функций:');
    console.log('  - window.openModal:', typeof window.openModal);
    console.log('  - window.closeModal:', typeof window.closeModal);
    console.log('  - openModal (глобально):', typeof openModal);
    
    // Проверяем наличие модалки
    const modal = document.getElementById('modal');
    console.log('🔍 Модалка в DOM:', modal);
    if (modal) {
        console.log('  - ID:', modal.id);
        console.log('  - Классы:', modal.className);
        console.log('  - Display (computed):', window.getComputedStyle(modal).display);
    }
    
    // Проверяем все кнопки с onclick="openModal()"
    const buttonsWithOpenModal = document.querySelectorAll('[onclick*="openModal"]');
    console.log('🔍 Найдено кнопок с onclick="openModal()":', buttonsWithOpenModal.length);
    buttonsWithOpenModal.forEach((btn, index) => {
        console.log(`  Кнопка ${index + 1}:`, btn);
        console.log(`    - Текст:`, btn.textContent?.trim() || btn.innerHTML?.trim());
        console.log(`    - onclick атрибут:`, btn.getAttribute('onclick'));
        
        // Добавляем event listener для отладки
        btn.addEventListener('click', function(e) {
            console.log('🖱️ ========== BUTTON CLICKED ==========');
            console.log('📍 Кнопка кликнута:', this);
            console.log('📍 Текст кнопки:', this.textContent?.trim() || this.innerHTML?.trim());
            console.log('📍 onclick атрибут:', this.getAttribute('onclick'));
            console.log('📍 window.openModal доступна?', typeof window.openModal);
            console.log('📍 Вызываю window.openModal...');
            
            if (typeof window.openModal === 'function') {
                window.openModal();
            } else {
                console.error('❌ window.openModal не является функцией!');
                console.error('❌ Тип:', typeof window.openModal);
            }
        });
    });
    
    // ========== INITIALIZATION ========== 
    // Инициализация AOS (анимации)
    try {
        console.log('🎯 Вызываю initAOS...');
        initAOS();
        console.log('✅ initAOS завершен');
    } catch (error) {
        console.error('❌ Ошибка при инициализации AOS:', error);
    }
    
    // Инициализация Swiper (слайдеры) - с проверкой загрузки библиотеки
    try {
        console.log('🎯 Вызываю initSwiper...');
        if (typeof Swiper !== 'undefined') {
            initSwiper();
            console.log('✅ initSwiper завершен');
        } else {
            console.warn('⚠️ Swiper не загружен, пропускаю инициализацию слайдера');
            console.warn('⚠️ Убедитесь, что Swiper подключен ДО main.js в HTML');
        }
    } catch (error) {
        console.error('❌ Ошибка при инициализации Swiper:', error);
    }
    
    // Инициализация масок для телефонов
    try {
        console.log('🎯 Вызываю initPhoneMasks...');
        initPhoneMasks();
        console.log('✅ initPhoneMasks завершен');
    } catch (error) {
        console.error('❌ Ошибка при инициализации масок телефонов:', error);
    }
    
    // Инициализация мобильного меню - ОБЯЗАТЕЛЬНО должна выполняться
    try {
        console.log('🎯 Вызываю initMobileMenu...');
        initMobileMenu();
        console.log('✅ initMobileMenu завершен');
    } catch (error) {
        console.error('❌ Ошибка при инициализации мобильного меню:', error);
    }
    
    // Инициализация скролла header
    try {
        console.log('🎯 Вызываю initHeaderScroll...');
        initHeaderScroll();
        console.log('✅ initHeaderScroll завершен');
    } catch (error) {
        console.error('❌ Ошибка при инициализации скролла header:', error);
    }
    
    // Инициализация FAQ
    try {
        console.log('🎯 Вызываю initFAQ...');
        initFAQ();
        console.log('✅ initFAQ завершен');
    } catch (error) {
        console.error('❌ Ошибка при инициализации FAQ:', error);
    }
    
    // Инициализация обработчиков модалки
    try {
        console.log('🎯 Вызываю initModalHandlers...');
        initModalHandlers();
        console.log('✅ initModalHandlers завершен');
    } catch (error) {
        console.error('❌ Ошибка при инициализации обработчиков модалки:', error);
    }
    
    // Инициализация плавной прокрутки
    try {
        console.log('🎯 Вызываю initSmoothScroll...');
        initSmoothScroll();
        console.log('✅ initSmoothScroll завершен');
    } catch (error) {
        console.error('❌ Ошибка при инициализации плавной прокрутки:', error);
    }
    
    // Инициализация lightbox для отзывов
    try {
        console.log('🎯 Вызываю initReviewLightbox...');
        initReviewLightbox();
        console.log('✅ initReviewLightbox завершен');
    } catch (error) {
        console.error('❌ Ошибка при инициализации lightbox:', error);
    }
    
    // Инициализация обработчиков форм
    try {
        console.log('🎯 Вызываю initFormHandlers...');
        initFormHandlers();
        console.log('✅ initFormHandlers завершен');
    } catch (error) {
        console.error('❌ Ошибка при инициализации обработчиков форм:', error);
    }
    
    console.log('✅ Сайт вернистраховку.рф загружен успешно');
    console.log('✅ ========== INITIALIZATION COMPLETE ==========');
}

// Инициализация при DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    // DOM уже загружен, инициализируем сразу
    initializePage();
}

// ========== FORM HANDLERS INITIALIZATION ==========
function initFormHandlers() {
    // Находим все формы
    const heroForm = document.getElementById('hero-form');
    const modalForm = document.getElementById('modal-form');
    const finalForm = document.getElementById('final-form');
    const calculatorForm = document.getElementById('contact-form');
    
    // Обработчик для hero-form
    if (heroForm) {
        heroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📋 Hero form submit intercepted');
            handleFormSubmit(e, 'hero');
        });
        console.log('✅ Hero form handler attached');
    }
    
    // Обработчик для modal-form
    if (modalForm) {
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📋 Modal form submit intercepted');
            handleFormSubmit(e, 'modal');
        });
        console.log('✅ Modal form handler attached');
    }
    
    // Обработчик для final-form
    if (finalForm) {
        finalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📋 Final form submit intercepted');
            handleFormSubmit(e, 'final');
        });
        console.log('✅ Final form handler attached');
    }
    
    // Обработчик для contact-form (страница контактов)
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📋 Contact form submit intercepted');
            handleFormSubmit(e, 'contact');
        });
        console.log('✅ Contact form handler attached');
    }
    
    console.log('✅ All form handlers initialized');
}

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
    // Проверяем наличие Swiper перед использованием
    if (typeof Swiper === 'undefined') {
        console.error('❌ Swiper не загружен! Убедитесь, что скрипт подключен в HTML.');
        return;
    }
    
    console.log('✅ Swiper доступен, инициализирую слайдеры...');
    
    // Слайдер отзывов
    const reviewsSwiperElement = document.querySelector('.reviewsSwiper');
    if (reviewsSwiperElement) {
        try {
            const reviewsSwiper = new Swiper('.reviewsSwiper', {
                slidesPerView: 1,
                spaceBetween: 30,
                loop: true,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.reviewsSwiper .swiper-pagination',
                    clickable: true,
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
            console.log('✅ Слайдер отзывов инициализирован');
        } catch (error) {
            console.error('❌ Ошибка при инициализации слайдера отзывов:', error);
        }
    } else {
        console.log('ℹ️ Элемент .reviewsSwiper не найден, пропускаю инициализацию');
    }

    // Swiper для карточек проблем (только на мобильных)
    const problemsSwiperElement = document.querySelector('.problemsSwiper');
    if (problemsSwiperElement) {
        try {
            const problemsSwiper = new Swiper('.problemsSwiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                loop: false,
                pagination: {
                    el: '.problemsSwiper .swiper-pagination',
                    clickable: true,
                    dynamicBullets: true,
                },
                // Отключаем на десктопе (но это уже скрыто через CSS)
                breakpoints: {
                    768: {
                        enabled: false, // Отключаем на md и выше
                    },
                }
            });
            console.log('✅ Слайдер проблем инициализирован');
        } catch (error) {
            console.error('❌ Ошибка при инициализации слайдера проблем:', error);
        }
    } else {
        console.log('ℹ️ Элемент .problemsSwiper не найден, пропускаю инициализацию');
    }
    
    console.log('✅ initSwiper завершен');
}

// ========== PHONE MASK INITIALIZATION ==========
// Ссылки на маски храним на элементе, чтобы синхронизировать после reset() и перед отправкой
function initPhoneMasks() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        const mask = IMask(input, {
            mask: '+{7} (000) 000-00-00',
            lazy: false,
            placeholderChar: '_'
        });
        input._phoneMask = mask;
    });
}

// Синхронизация масок телефона в форме (после reset или перед отправкой) — убирает предупреждения и разное поведение на разных ПК
function syncPhoneMasksInForm(form) {
    if (!form || typeof IMask === 'undefined') return;
    form.querySelectorAll('input[type="tel"]').forEach(function(inp) {
        if (inp._phoneMask && typeof inp._phoneMask.updateValue === 'function') {
            inp._phoneMask.updateValue();
        }
    });
}

// ========== MOBILE MENU ==========
function initMobileMenu() {
    console.log('🔧 Инициализация мобильного меню...');
    
    // Используем более надежный поиск элементов
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    console.log('🔍 menuBtn:', menuBtn);
    console.log('🔍 mobileMenu:', mobileMenu);

    if (!menuBtn) {
        console.error('❌ Кнопка мобильного меню не найдена! ID: mobile-menu-btn');
        return;
    }
    
    if (!mobileMenu) {
        console.error('❌ Мобильное меню не найдено! ID: mobile-menu');
        return;
    }

    console.log('✅ Элементы мобильного меню найдены');
    
    // Удаляем все старые обработчики, создавая новую кнопку
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
    
    // Получаем обновленную ссылку на меню (на случай если оно тоже было заменено)
    const currentMobileMenu = document.getElementById('mobile-menu');
    
    // Добавляем обработчик клика на кнопку
    newMenuBtn.addEventListener('click', function(e) {
        console.log('🖱️ Клик на кнопку мобильного меню');
        e.stopPropagation();
        e.preventDefault();
        
        // Используем текущее состояние меню
        const menu = document.getElementById('mobile-menu');
        if (menu && menu.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    // Закрытие меню при клике на ссылку
    const menuLinks = currentMobileMenu.querySelectorAll('a');
    console.log('🔗 Найдено ссылок в меню:', menuLinks.length);
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            console.log('🔗 Клик на ссылку в меню - закрываю');
            closeMobileMenu();
        });
    });

    // Закрытие меню при клике вне его (только один обработчик на документ)
    // Удаляем старый обработчик если есть
    if (window.mobileMenuClickHandler) {
        document.removeEventListener('click', window.mobileMenuClickHandler);
    }
    
    window.mobileMenuClickHandler = function(e) {
        const menu = document.getElementById('mobile-menu');
        const btn = document.getElementById('mobile-menu-btn');
        if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
            if (menu.classList.contains('active')) {
                closeMobileMenu();
            }
        }
    };
    document.addEventListener('click', window.mobileMenuClickHandler);

    // Закрытие меню при нажатии ESC (только один обработчик)
    if (window.mobileMenuEscapeHandler) {
        document.removeEventListener('keydown', window.mobileMenuEscapeHandler);
    }
    
    window.mobileMenuEscapeHandler = function(e) {
        const menu = document.getElementById('mobile-menu');
        if (menu && e.key === 'Escape' && menu.classList.contains('active')) {
            console.log('⌨️ Нажата ESC - закрываю меню');
            closeMobileMenu();
        }
    };
    document.addEventListener('keydown', window.mobileMenuEscapeHandler);
    
    console.log('✅ Мобильное меню инициализировано');
}

function toggleMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !mobileMenu) {
        console.error('❌ Элементы меню не найдены для toggle');
        return;
    }

    if (mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !mobileMenu) {
        console.error('❌ Элементы меню не найдены для открытия');
        return;
    }

    console.log('📱 Открываю мобильное меню');
    
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

    if (!menuBtn || !mobileMenu) {
        console.error('❌ Элементы меню не найдены для закрытия');
        return;
    }

    console.log('📱 Закрываю мобильное меню');

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
        console.log('🔧 Инициализация обработчиков модалки');
        
        // Закрытие по клику вне модалки
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                console.log('🖱️ Клик вне модалки - закрываю');
                closeModal();
            }
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                console.log('⌨️ Нажата клавиша ESC - закрываю модалку');
                closeModal();
            }
        });
        
        // Обработчик для кнопки закрытия (крестик)
        // Ищем кнопку несколькими способами для надежности
        let closeBtn = modal.querySelector('button[onclick*="closeModal"]');
        if (!closeBtn) {
            // Пробуем найти по позиции (absolute top-4 right-4)
            closeBtn = modal.querySelector('button.absolute.top-4.right-4');
        }
        if (!closeBtn) {
            // Пробуем найти по иконке
            closeBtn = modal.querySelector('button i.fa-times')?.closest('button');
        }
        
        if (closeBtn) {
            console.log('✅ Кнопка закрытия найдена:', closeBtn);
            // Удаляем старый onclick если есть
            if (closeBtn.hasAttribute('onclick')) {
                closeBtn.removeAttribute('onclick');
            }
            // Удаляем старые обработчики если есть
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            // Добавляем новый обработчик
            newCloseBtn.addEventListener('click', function(e) {
                console.log('🖱️ Клик на кнопку закрытия');
                e.preventDefault();
                e.stopPropagation();
                if (typeof closeModal === 'function') {
                    closeModal();
                } else if (typeof window.closeModal === 'function') {
                    window.closeModal();
                } else {
                    console.error('❌ Функция closeModal не найдена');
                }
            });
        } else {
            console.warn('⚠️ Кнопка закрытия не найдена в модалке');
        }
    } else {
        console.error('❌ Модалка не найдена для инициализации обработчиков');
    }
}

// Функции openModal и closeModal уже определены выше, в начале файла

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
async function handleFormSubmit(event, formType) {
    // Предотвращаем стандартную отправку формы
    if (event) {
    event.preventDefault();
        event.stopPropagation();
    }
    
    const form = event ? event.target : document.querySelector('form');
    if (!form) {
        console.error('❌ Форма не найдена');
        return false;
    }
    
    // Синхронизируем маски телефона с полями, чтобы на всех ПК/браузерах отправлялось корректное значение
    syncPhoneMasksInForm(form);
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Добавляем тип формы
    data.formType = formType;
    data.timestamp = new Date().toISOString();
    data.page = window.location.href;
    
    console.log('📋 Отправка формы:', formType, data);
    console.log('📋 CSRF токен:', csrfToken ? 'присутствует' : 'отсутствует');
    
    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Отправка...<span class="spinner"></span>';
    }
    
    // Проверяем CSRF токен перед отправкой
    if (!csrfToken) {
        console.warn('⚠️ CSRF токен отсутствует, пытаемся получить...');
        try {
            const tokenResponse = await fetch('/api/csrf-token', {
                credentials: 'include'
            });
            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                csrfToken = tokenData.csrfToken;
                console.log('✅ CSRF токен получен перед отправкой');
            } else {
                throw new Error('Не удалось получить CSRF токен');
            }
        } catch (tokenError) {
            console.error('❌ Не удалось получить CSRF токен:', tokenError);
            showErrorMessage('Не удалось получить токен безопасности. Обновите страницу и попробуйте снова.');
            if (submitBtn && originalText) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            return false;
        }
    }
    
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
    .then(async response => {
        // Пытаемся прочитать JSON ответ даже при ошибке
        let responseData;
        try {
            responseData = await response.json();
        } catch (jsonError) {
            console.error('❌ Ошибка парсинга JSON ответа:', jsonError);
            responseData = { message: `Ошибка сервера (${response.status})` };
        }
        
        if (!response.ok) {
            console.error('❌ Ошибка сервера:', response.status, responseData);
            throw new Error(responseData.message || `Ошибка сервера (${response.status})`);
        }
        
        return responseData;
    })
    .then(result => {
        console.log('✅ Форма отправлена успешно:', result);
        
        // Очищаем URL от параметров (если есть)
        if (window.history && window.history.replaceState) {
            const cleanUrl = window.location.pathname + (window.location.hash || '');
            window.history.replaceState({}, document.title, cleanUrl);
        }
        
        // Показываем успешное сообщение
        showSuccessMessage(formType);
        
        // Очищаем форму
        form.reset();
        // Синхронизируем маски после reset, чтобы не было предупреждений IMask и одинаковое поведение на всех ПК
        syncPhoneMasksInForm(form);
        
        // Отправка цели в Яндекс.Метрику
        if (typeof ym !== 'undefined' && window.YANDEX_METRIKA_ID) {
            ym(window.YANDEX_METRIKA_ID, 'reachGoal', 'form_submit_' + formType);
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
        console.error('❌ Детали ошибки:', error.message, error.stack);
        
        // Показываем сообщение об ошибке с деталями
        showErrorMessage(error.message || 'Ошибка отправки формы. Пожалуйста, позвоните нам: +7 906 123-15-22');
    })
    .finally(() => {
        // Возвращаем кнопку в исходное состояние
        if (submitBtn && originalText) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
    
    // Всегда возвращаем false, чтобы предотвратить стандартную отправку
    return false;
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
function showErrorMessage(customMessage) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-slide-up';
    const message = customMessage || 'Пожалуйста, позвоните нам: <a href="tel:+79061231522" class="underline">+7 906 123-15-22</a>';
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-exclamation-circle text-2xl"></i>
            <div>
                <p class="font-bold">Ошибка отправки</p>
                <p class="text-sm">${message}</p>
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
        if (typeof ym !== 'undefined' && (window.YANDEX_METRIKA_ID || YANDEX_METRIKA_ID)) {
            ym(window.YANDEX_METRIKA_ID || 105345372, 'reachGoal', 'phone_click');
        }
    });
});

// ========== MESSENGER CLICK TRACKING ==========
document.querySelectorAll('a[href*="whatsapp"], a[href*="telegram"], a[href*="vk.com"]').forEach(link => {
    link.addEventListener('click', () => {
        const messenger = link.href.includes('whatsapp') ? 'whatsapp' : 
                         link.href.includes('telegram') ? 'telegram' : 'vk';
        trackClick('messenger_' + messenger);
        if (link.href.includes('whatsapp') && typeof ym !== 'undefined' && (window.YANDEX_METRIKA_ID || YANDEX_METRIKA_ID)) {
            ym(window.YANDEX_METRIKA_ID || 105345372, 'reachGoal', 'whatsapp_click');
        }
    });
});

// ========== AUTOMATIC MODAL POPUP (MARKETING) ==========
let autoModalShown = false;
let userInteracted = false; // Флаг взаимодействия пользователя с формами/кнопками
let timeOnSite = 0;
let maxScrollPercentage = 0;

// Отслеживание взаимодействия пользователя
document.addEventListener('click', function(e) {
    // Если клик на кнопку или форму - пользователь уже взаимодействует
    if (e.target.closest('button') || e.target.closest('form') || e.target.closest('a[href^="#"]')) {
        userInteracted = true;
    }
});

// Отслеживание заполнения форм
document.addEventListener('input', function(e) {
    if (e.target.closest('form')) {
        userInteracted = true;
    }
});

// Функция показа автоматической модалки
function showAutoModal(trigger) {
    // Не показываем, если:
    // 1. Модалка уже была показана в этой сессии
    // 2. Пользователь уже взаимодействовал с сайтом
    // 3. Модалка уже открыта
    if (autoModalShown || userInteracted || document.getElementById('modal')?.classList.contains('active')) {
        return;
    }

    // Проверяем localStorage - не показывали ли сегодня
    const lastShown = localStorage.getItem('autoModalLastShown');
    const today = new Date().toDateString();
    
    if (lastShown === today) {
        return; // Уже показывали сегодня
    }

    autoModalShown = true;
    localStorage.setItem('autoModalLastShown', today);
    
    openModal();
    trackClick('auto_modal_' + trigger);
    console.log('📢 Автоматическая модалка показана (триггер: ' + trigger + ')');
}

// Триггер 1: По времени на сайте (30 секунд)
setTimeout(() => {
    if (timeOnSite >= 30 && maxScrollPercentage >= 20) {
        // Пользователь провел минимум 30 секунд и прокрутил хотя бы 20%
        showAutoModal('time_30s');
    }
}, 30000); // 30 секунд

// Триггер 2: По времени на сайте (60 секунд) - более агрессивный
setTimeout(() => {
    if (timeOnSite >= 60 && maxScrollPercentage >= 10) {
        showAutoModal('time_60s');
    }
}, 60000); // 60 секунд

// Триггер 3: По прокрутке страницы (50%)
let scrollModalShown = false;
window.addEventListener('scroll', () => {
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const currentPercentage = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
    
    maxScrollPercentage = Math.max(maxScrollPercentage, currentPercentage);
    
    // Показываем модалку при прокрутке 50% и если прошло минимум 15 секунд
    if (currentPercentage >= 50 && !scrollModalShown && timeOnSite >= 15) {
        scrollModalShown = true;
        showAutoModal('scroll_50');
    }
    
    // Альтернативный триггер при прокрутке 70% (даже если прошло меньше времени)
    if (currentPercentage >= 70 && !scrollModalShown && timeOnSite >= 10) {
        scrollModalShown = true;
        showAutoModal('scroll_70');
    }
});

// Отслеживание времени на сайте
setInterval(() => {
    timeOnSite++;
}, 1000); // Каждую секунду

// ========== EXIT INTENT POPUP ==========
let exitIntentShown = false;

document.addEventListener('mouseleave', function(e) {
    // Проверяем, что курсор вышел через верх страницы
    // И пользователь провел на сайте минимум 10 секунд
    if (e.clientY < 0 && !exitIntentShown && timeOnSite >= 10 && !userInteracted) {
        exitIntentShown = true;
        
        // Задержка перед показом
        setTimeout(() => {
            if (!autoModalShown && !document.getElementById('modal')?.classList.contains('active')) {
                openModal();
                trackClick('exit_intent');
            }
        }, 500);
    }
});

// ========== SCROLL TO TOP BUTTON (OPTIONAL) ==========
const scrollTopBtn = document.createElement('button');
scrollTopBtn.id = 'scroll-to-top';
scrollTopBtn.className = 'fixed bottom-24 right-6 w-12 h-12 bg-primary hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-110 transition z-40 hidden';
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

// ========== COUNTUP ANIMATION (для счётчика в Hero) ==========
function animateCountUp(element, start, end, duration) {
    let startTime = null;
    const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        element.textContent = new Intl.NumberFormat('ru-RU').format(currentValue);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Инициализация CountUp при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const countupElements = document.querySelectorAll('.countup');

    // IntersectionObserver для запуска анимации при появлении в viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const target = parseInt(entry.target.dataset.target);
                animateCountUp(entry.target, 0, target, 2500);
                entry.target.dataset.animated = 'true';
            }
        });
    }, { threshold: 0.5 });

    countupElements.forEach(el => observer.observe(el));
});

// ========== REVIEW PHOTOS LIGHTBOX ==========
function initReviewLightbox() {
    const lightbox = document.getElementById('review-lightbox');
    const lightboxImage = document.getElementById('review-lightbox-image');
    const lightboxClose = document.getElementById('review-lightbox-close');
    const lightboxPrev = document.getElementById('review-lightbox-prev');
    const lightboxNext = document.getElementById('review-lightbox-next');
    const lightboxCounter = document.getElementById('review-lightbox-counter');
    
    if (!lightbox || !lightboxImage) {
        console.warn('⚠️ Lightbox элементы не найдены');
        return;
    }
    
    const reviewPhotos = document.querySelectorAll('.review-photo-item img');
    let currentIndex = 0;
    const totalPhotos = reviewPhotos.length;
    
    // Функция открытия lightbox
    function openLightbox(index) {
        if (index < 0 || index >= totalPhotos) return;
        
        currentIndex = index;
        const photo = reviewPhotos[index];
        const src = photo.getAttribute('data-lightbox-src') || photo.src;
        
        lightboxImage.src = src;
        lightboxImage.alt = photo.alt || `Отзыв клиента ${index + 1}`;
        updateCounter();
        
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        console.log('📸 Lightbox открыт, фото:', index + 1);
    }
    
    // Функция закрытия lightbox
    function closeLightbox() {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
        console.log('📸 Lightbox закрыт');
    }
    
    // Функция обновления счетчика
    function updateCounter() {
        if (lightboxCounter) {
            lightboxCounter.textContent = `${currentIndex + 1} / ${totalPhotos}`;
        }
    }
    
    // Функция показа следующего фото
    function showNext() {
        const nextIndex = (currentIndex + 1) % totalPhotos;
        openLightbox(nextIndex);
    }
    
    // Функция показа предыдущего фото
    function showPrev() {
        const prevIndex = (currentIndex - 1 + totalPhotos) % totalPhotos;
        openLightbox(prevIndex);
    }
    
    // Обработчики кликов на фотографии
    reviewPhotos.forEach((photo, index) => {
        photo.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(index);
        });
        
        // Также обрабатываем клик на родительский элемент
        const parent = photo.closest('.review-photo-item');
        if (parent) {
            parent.addEventListener('click', (e) => {
                if (e.target === photo || e.target.closest('img')) return;
                e.preventDefault();
                openLightbox(index);
            });
        }
    });
    
    // Обработчик закрытия
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    
    // Обработчик клика на фон (закрытие)
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Обработчики навигации
    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            showNext();
        });
    }
    
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrev();
        });
    }
    
    // Навигация клавиатурой
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('hidden')) return;
        
        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowRight':
                showNext();
                break;
            case 'ArrowLeft':
                showPrev();
                break;
        }
    });
    
    console.log('✅ Review Lightbox инициализирован');
}

console.log('✅ main.js загружен и инициализирован');

