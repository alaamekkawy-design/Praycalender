/**
 * PWA Installation Helper
 * يدعم جميع المنصات (Android, Windows, iPhone, iPad, Mac)
 * 
 * كيفية الاستخدام:
 * 1. أضف هذا الملف إلى مشروعك
 * 2. أضف زر التثبيت في HTML: <button id="pwaInstallBtn" style="display:none;">تثبيت التطبيق</button>
 * 3. استدعِ initPWAInstall() بعد تحميل الصفحة
 */

// ======================== الكشف عن المنصة ========================

/**
 * الكشف عن نظام التشغيل
 */
function detectOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // كشف iOS
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
    }
    
    // كشف Android
    if (/Android/.test(userAgent)) {
        return 'android';
    }
    
    // كشف Windows
    if (/Win/.test(userAgent)) {
        return 'windows';
    }
    
    // كشف Mac
    if (/Mac/.test(userAgent)) {
        return 'mac';
    }
    
    return 'other';
}

/**
 * الكشف عن متصفح Safari (iOS/macOS)
 */
function isSafari() {
    const userAgent = navigator.userAgent;
    return /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/CriOS/.test(userAgent);
}

/**
 * التحقق مما إذا كان التطبيق مثبتاً بالفعل
 */
function isAppInstalled() {
    // طريقة 1: display-mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    
    // طريقة 2: خاصية iOS الخاصة
    if (window.navigator.standalone === true) {
        return true;
    }
    
    return false;
}

// ======================== دعم iOS (التثبيت اليدوي) ========================

/**
 * إنشاء وعرض دليل التثبيت لمستخدمي iOS
 */
function showIOSGuide() {
    // البحث عن عنصر الإرشادات الموجود
    let guide = document.getElementById('iosInstallGuide');
    
    // إذا لم يكن موجوداً، قم بإنشائه
    if (!guide) {
        guide = document.createElement('div');
        guide.id = 'iosInstallGuide';
        guide.style.cssText = `
            display: none;
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a3a6b 0%, #0f2a4a 100%);
            color: white;
            padding: 16px;
            border-radius: 16px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        `;
        document.body.appendChild(guide);
    }
    
    guide.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-weight: bold; font-size: 15px;">📱 تثبيت التطبيق</span>
            <button id="closeIosGuide" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">✕</button>
        </div>
        <div style="margin-bottom: 8px;">لتثبيت التطبيق على جهازك:</div>
        <div style="background: rgba(255,255,255,0.15); padding: 10px; border-radius: 12px; margin: 8px 0;">
            <div style="margin: 5px 0;">1️⃣ اضغط على أيقونة المشاركة 📤</div>
            <div style="margin: 5px 0;">2️⃣ اختر <strong>"إلى الشاشة الرئيسية"</strong></div>
            <div style="margin: 5px 0;">3️⃣ اضغط <strong>"إضافة"</strong></div>
        </div>
        <div style="font-size: 11px; opacity: 0.8; margin-top: 8px;">⭐ سيظهر أيقونة التطبيق على شاشة هاتفك</div>
    `;
    
    guide.style.display = 'block';
    
    // إغلاق الدليل
    const closeBtn = document.getElementById('closeIosGuide');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            guide.style.display = 'none';
            // حفظ التفضيل في localStorage
            localStorage.setItem('pwa_guide_closed', 'true');
        });
    }
    
    // إغلاق بعد 15 ثانية
    setTimeout(() => {
        if (guide.style.display === 'block') {
            guide.style.display = 'none';
        }
    }, 15000);
}

// ======================== دعم Android و Windows ========================

let deferredPrompt = null;
let installButton = null;

/**
 * تهيئة زر التثبيت للأندرويد والويندوز
 */
function initAndroidWindowsInstall() {
    installButton = document.getElementById('pwaInstallBtn');
    
    if (!installButton) {
        console.warn('⚠️ لم يتم العثور على زر التثبيت (id="pwaInstallBtn")');
        return;
    }
    
    // الاستماع لحدث beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('✅ beforeinstallprompt تم تشغيله');
        e.preventDefault();
        deferredPrompt = e;
        
        // إظهار زر التثبيت
        installButton.style.display = 'block';
        
        // إضافة تأثير بسيط
        installButton.style.animation = 'pwaFadeIn 0.3s ease';
    });
    
    // حدث الضغط على زر التثبيت
    installButton.addEventListener('click', async () => {
        console.log('🖱️ تم الضغط على زر التثبيت');
        
        if (!deferredPrompt) {
            console.log('❌ لا يوجد حدث تثبيت نشط');
            return;
        }
        
        // إظهار نافذة التثبيت
        deferredPrompt.prompt();
        
        // انتظار اختيار المستخدم
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`📱 نتيجة التثبيت: ${outcome}`);
        
        // تنظيف المتغيرات
        deferredPrompt = null;
        
        // إخفاء الزر
        installButton.style.display = 'none';
    });
    
    // حدث عند اكتمال التثبيت
    window.addEventListener('appinstalled', () => {
        console.log('🎉 تم تثبيت التطبيق بنجاح!');
        deferredPrompt = null;
        if (installButton) {
            installButton.style.display = 'none';
        }
        
        // إظهار رسالة نجاح
        showToast('تم تثبيت التطبيق بنجاح! 🎉');
    });
}

// ======================== أدوات مساعدة ========================

/**
 * عرض رسالة منبثقة قصيرة
 */
function showToast(message, duration = 3000) {
    // إزالة أي toast موجود
    const existingToast = document.querySelector('.pwa-toast');
    if (existingToast) existingToast.remove();
    
    // إنشاء toast جديد
    const toast = document.createElement('div');
    toast.className = 'pwa-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a3a6b;
        color: white;
        padding: 10px 20px;
        border-radius: 50px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 10001;
        animation: pwaFadeInUp 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(toast);
    
    // إزالة بعد المدة المحددة
    setTimeout(() => {
        toast.style.animation = 'pwaFadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * تسجيل Service Worker
 */
function registerServiceWorker(swPath = './sw.js') {
    if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Worker غير مدعوم في هذا المتصفح');
        return;
    }
    
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(swPath)
            .then(registration => {
                console.log('✅ Service Worker تم تسجيله بنجاح:', registration);
            })
            .catch(error => {
                console.error('❌ فشل تسجيل Service Worker:', error);
            });
    });
}

/**
 * إضافة أنماط CSS اللازمة
 */
function addPWAAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pwaFadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pwaFadeInUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        
        @keyframes pwaFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        #pwaInstallBtn {
            animation: pwaFadeIn 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// ======================== الوظيفة الرئيسية ========================

/**
 * تهيئة نظام التثبيت لجميع المنصات
 * @param {Object} options - خيارات التهيئة
 * @param {string} options.swPath - مسار ملف Service Worker (افتراضي: './sw.js')
 * @param {boolean} options.autoRegisterSW - تسجيل Service Worker تلقائياً (افتراضي: true)
 * @param {boolean} options.showIOSGuideAuto - عرض دليل iOS تلقائياً (افتراضي: true)
 */
function initPWAInstall(options = {}) {
    const {
        swPath = './sw.js',
        autoRegisterSW = true,
        showIOSGuideAuto = true
    } = options;
    
    console.log('🚀 بدء تهيئة PWA...');
    
    // إضافة الأنماط
    addPWAAnimations();
    
    // تسجيل Service Worker
    if (autoRegisterSW) {
        registerServiceWorker(swPath);
    }
    
    // التحقق مما إذا كان التطبيق مثبتاً بالفعل
    if (isAppInstalled()) {
        console.log('✅ التطبيق مثبت بالفعل، إخفاء أزرار التثبيت');
        const btn = document.getElementById('pwaInstallBtn');
        if (btn) btn.style.display = 'none';
        return;
    }
    
    const os = detectOS();
    console.log(`📱 نظام التشغيل المكتشف: ${os}`);
    
    switch (os) {
        case 'ios':
            // iOS: دليل تثبيت يدوي
            if (showIOSGuideAuto) {
                // التحقق من عدم إغلاق الدليل سابقاً
                const guideClosed = localStorage.getItem('pwa_guide_closed');
                if (guideClosed !== 'true') {
                    setTimeout(() => showIOSGuide(), 1000);
                }
            }
            // إخفاء زر التثبيت المخصص على iOS
            const btn = document.getElementById('pwaInstallBtn');
            if (btn) btn.style.display = 'none';
            break;
            
        case 'android':
        case 'windows':
        case 'mac':
            // Android/Windows/Mac: استخدام beforeinstallprompt
            initAndroidWindowsInstall();
            break;
            
        default:
            console.log('⚠️ نظام غير معروف، محاولة استخدام الطريقة العامة');
            initAndroidWindowsInstall();
            break;
    }
}

// للاستخدام المباشر في المتصفح
window.PWAInstall = {
    init: initPWAInstall,
    detectOS: detectOS,
    isAppInstalled: isAppInstalled,
    showIOSGuide: showIOSGuide,
    registerServiceWorker: registerServiceWorker,
    showToast: showToast
};
