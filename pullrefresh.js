/**
 * Pull to Refresh Module for ICPWA
 * تحديث الصفحة عند السحب لأسفل من الأعلى
 * 
 * كيفية الاستخدام:
 * استدعِ initPullToRefresh() بعد تحميل الصفحة
 */

let touchStartY = 0;
let isRefreshing = false;

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
            
            // عرض مؤشر التحديث
            showRefreshIndicator();
            
            // تحديث الصفحة
            setTimeout(() => {
                window.location.reload();
            }, 300);
        }
    }, {
