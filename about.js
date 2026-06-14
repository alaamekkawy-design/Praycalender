/**
 * About Popup Module for ICPWA
 * نافذة معلومات عن المطور والتطبيق
 * 
 * كيفية الاستخدام:
 * 1. أضف زر أو صورة: <img id="logoFooter" src="..." onclick="showAboutPopup()">
 * 2. استدعِ initAboutPopup() لربط العناصر
 */

// ======================== البيانات ========================
const ABOUT_DATA = {
    appName: 'مواقيت الصلاة',
    appDescription: 'تطبيق مواقيت الصلاة والتقويم الإسلامي مع عداد تنازلي وأذان وطقس وتقويم هجري',
    developer: 'Alaa Mekkawy',
    email: 'alaamekkawy@gmail.com',
    phone1: '01200376068',
    phone2: '01003411188',
    version: '2.0.0'
};

// شعار التطبيق (نفس الشعار المستخدم في الصفحة)
const ABOUT_LOGO_SRC = "data:image/png;base64,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";

// ======================== نافذة المعلومات ========================

/**
 * إنشاء وعرض نافذة المعلومات المنبثقة
 */
function showAboutPopup() {
    // إزالة أي نافذة مفتوحة
    const existing = document.querySelector('.about-popup-overlay');
    if (existing) existing.remove();
    
    // إنشاء النافذة
    const overlay = document.createElement('div');
    overlay.className = 'about-popup-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(3px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        direction: rtl;
        font-family: 'Cairo', sans-serif;
    `;
    
    const box = document.createElement('div');
    box.style.cssText = `
        background: #fff;
        border-radius: 24px;
        padding: 28px 24px;
        text-align: center;
        max-width: 340px;
        width: 85vw;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: aboutFadeIn 0.3s ease;
    `;
    
    box.innerHTML = `
        <style>
            @keyframes aboutFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
        </style>
        <img src="${ABOUT_LOGO_SRC}" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 16px; border-radius: 50%;">
        <div style="font-family: 'Amiri', serif; font-size: 28px; font-weight: 800; color: #1a3a6b; margin-bottom: 8px;">
            🕌 ${ABOUT_DATA.appName}
        </div>
        <div style="font-size: 13px; color: #4a6a9b; margin-bottom: 20px; line-height: 1.6;">
            ${ABOUT_DATA.appDescription}
        </div>
        <div style="border-top: 1px solid #e0e6f0; padding-top: 16px; margin-bottom: 16px;">
            <div style="font-size: 14px; font-weight: 700; color: #1a3a6b;">👨‍💻 ${ABOUT_DATA.developer}</div>
            <div style="font-size: 12px; color: #4a6a9b; margin-top: 8px;">
                📧 ${ABOUT_DATA.email}<br>
                📱 ${ABOUT_DATA.phone1} / ${ABOUT_DATA.phone2}
            </div>
        </div>
        <div style="font-size: 11px; color: #a8c0e8; margin-bottom: 20px;">
            الإصدار ${ABOUT_DATA.version}
        </div>
        <button id="closeAboutPopup" style="
            padding: 10px 32px;
            background: #1a3a6b;
            color: white;
            border: none;
            border-radius: 40px;
            font-family: 'Cairo', sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s;
        ">إغلاق</button>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    // إغلاق النافذة عند الضغط على الزر
    document.getElementById('closeAboutPopup')?.addEventListener('click', () => overlay.remove());
    
    // إغلاق النافذة عند الضغط على الخلفية
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

/**
 * ربط زر المعلومات (الشعار في التذييل)
 */
function initAboutPopup() {
    const logoFooter = document.getElementById('logoFooter');
    if (logoFooter) {
        logoFooter.addEventListener('click', showAboutPopup);
    }
}

// ======================== تصدير الوظائف ========================
window.ICPWAAbout = {
    show: showAboutPopup,
    init: initAboutPopup
};

// تهيئة تلقائية عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutPopup);
} else {
    initAboutPopup();
}
