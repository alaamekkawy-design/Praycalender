/**
 * Pull to Refresh Module for ICPWA
 * تحديث الصفحة عند السحب لأسفل من الأعلى
 * 
 * كيفية الاستخدام:
 * استدعِ initPullToRefresh() بعد تحميل الصفحة
 */

let touchStartY = 0;
let isRefreshing = false;

/**
 * عرض مؤشر التحديث
 */
function showRefreshIndicator() {
    let indicator = document.getElementById('pullRefreshIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'pullRefreshIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #1a3a6b;
            color: white;
            text-align: center;
            padding: 12px;
            font-size: 14px;
            font-family: 'Cairo', sans-serif;
            z-index: 9999;
            transform: translateY(-100%);
            transition: transform 0.3s ease;
        `;
        indicator.textContent = '🔄 جاري التحديث...';
        document.body.appendChild(indicator);
    }
    
    // إظهار المؤشر
    setTimeout(() => {
        indicator.style.transform = 'translateY(0)';
    }, 10);
    
    // إخفاء المؤشر بعد التحديث
    setTimeout(() => {
        indicator.style.transform = 'translateY(-100%)';
        setTimeout(() => {
            if (indicator.parentNode) indicator.remove();
        }, 300);
    }, 2000);
}

/**
 * تهيئة ميزة السحب للتحديث
 */
function initPullToRefresh() {
    window.addEventListener('touchstart', function(e) {
        if (window.scrollY === 0) {
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });
    
    window.addEventListener('touchmove', function(e) {
        if (isRefreshing) return;
        
        const touchMoveY = e.touches[0].clientY;
        const swipeDistance = touchMoveY - touchStartY;
        
        if (window.scrollY === 0 && swipeDistance > 120) {
            isRefreshing = true;
            showRefreshIndicator();
            
            setTimeout(() => {
                window.location.reload();
            }, 300);
        }
    }, { passive: true });
    
    // إعادة تعيين حالة التحديث بعد العودة للصفحة
    window.addEventListener('pageshow', function() {
        isRefreshing = false;
    });
}

// تصدير الوظائف
window.ICPWAPullRefresh = {
    init: initPullToRefresh
};
