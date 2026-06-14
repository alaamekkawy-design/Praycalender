/**
 * Date Picker Module for ICPWA
 * منتقي تاريخ متقدم للأجهزة المحمولة
 * 
 * كيفية الاستخدام:
 * 1. أضف HTML للـ overlay
 * 2. استدعِ openDatePicker() عند الضغط على التاريخ
 */

// ======================== متغيرات عامة ========================
let dpYear, dpMonth, dpView = 'days';
let dpYearBase;
let onDateSelectedCallback = null;
let currentDateCallback = null;

const AR_MONTHS_FULL = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const AR_DAYS_SHORT = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];

// ======================== الدوال الأساسية ========================

/**
 * تهيئة منتقي التاريخ
 * @param {Function} onSelect - دالة تستدعى عند اختيار تاريخ (تستقبل year, month, day)
 * @param {Function} getCurrentDate - دالة تعيد التاريخ الحالي المعروض
 */
function initDatePicker(onSelect, getCurrentDate) {
    onDateSelectedCallback = onSelect;
    currentDateCallback = getCurrentDate;
    buildDatePickerHTML();
    attachDatePickerEvents();
}

/**
 * بناء HTML لمنتقي التاريخ
 */
function buildDatePickerHTML() {
    if (document.getElementById('dpOverlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'dpOverlay';
    overlay.className = 'datepicker-overlay';
    overlay.innerHTML = `
        <div class="datepicker-panel">
            <div class="dp-header">
                <button class="dp-nav" id="dpPrevBtn">▶▶</button>
                <button class="dp-nav" id="dpPrevSingle">▶</button>
                <div class="dp-title-group">
                    <button class="dp-title-btn" id="dpMonthBtn">-</button>
                    <button class="dp-title-btn" id="dpYearBtn">-</button>
                </div>
                <button class="dp-nav" id="dpNextSingle">◀</button>
                <button class="dp-nav" id="dpNextBtn">◀◀</button>
            </div>
            <div id="dpDayView">
                <div class="dp-weekdays"></div>
                <div class="dp-days" id="dpDays"></div>
            </div>
            <div id="dpGridView" style="display:none">
                <div class="dp-grid" id="dpGrid"></div>
            </div>
            <div class="dp-footer">
                <button class="dp-footer-btn dp-today-btn" id="dpTodayBtn">↩ اليوم</button>
                <button class="dp-footer-btn dp-save-btn" id="dpCloseBtn">✕ إغلاق</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // إضافة الـ CSS المطلوب إذا لم يكن موجوداً
    if (!document.getElementById('datepicker-styles')) {
        const style = document.createElement('style');
        style.id = 'datepicker-styles';
        style.textContent = `
            .datepicker-overlay {
                display: none; position: fixed; inset: 0;
                background: rgba(0,0,0,0.5); z-index: 200;
                align-items: center; justify-content: center;
            }
            .datepicker-overlay.open { display: flex; }
            .datepicker-panel {
                background: #fff; width: 88vw; max-width: 360px;
                border-radius: 16px; padding: 20px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.25);
                direction: rtl;
            }
            body.dark-mode .datepicker-panel {
                background: #0f1e33;
                border: 1px solid #2a5298;
            }
            .dp-header {
                display: flex; align-items: center;
                justify-content: space-between; margin-bottom: 16px;
                gap: 8px;
            }
            .dp-nav {
                background: none; border: 1px solid #1a3a6b;
                border-radius: 50%; width: 32px; height: 32px;
                cursor: pointer; font-size: 14px;
            }
            body.dark-mode .dp-nav { border-color: #2a5298; color: #a8c8f0; background: none; }
            .dp-title-group { display: flex; gap: 8px; flex: 1; justify-content: center; }
            .dp-title-btn {
                background: #f0f4fa; border: 1px solid #c5cfe0;
                border-radius: 20px; padding: 6px 12px;
                font-family: 'Cairo', sans-serif; font-size: 14px;
                font-weight: 700; cursor: pointer;
            }
            body.dark-mode .dp-title-btn { background: #0d1a2e; color: #a8c8f0; }
            .dp-weekdays {
                display: grid; grid-template-columns: repeat(7, 1fr);
                margin-bottom: 8px; text-align: center;
            }
            .dp-weekday { font-size: 12px; font-weight: 700; color: #a8c0e8; padding: 6px 0; }
            .dp-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
            .dp-day {
                aspect-ratio: 1; display: flex; align-items: center;
                justify-content: center; font-size: 14px; border-radius: 50%;
                cursor: pointer; font-weight: 600;
            }
            .dp-day:hover { background: #e8edf5; }
            .dp-day.today { border: 1px solid #1a3a6b; }
            .dp-day.selected { background: #1a3a6b; color: white; }
            .dp-day.empty { cursor: default; }
            body.dark-mode .dp-day { color: #cde1ff; }
            body.dark-mode .dp-day.selected { background: #2a5298; }
            .dp-grid {
                display: grid; grid-template-columns: repeat(3, 1fr);
                gap: 12px; padding: 8px 0;
            }
            .dp-grid-item {
                padding: 12px; text-align: center; border-radius: 12px;
                font-size: 16px; font-weight: 600; cursor: pointer;
                border: 1px solid transparent;
            }
            .dp-grid-item:hover { background: #e8edf5; }
            .dp-grid-item.selected { background: #1a3a6b; color: white; }
            .dp-grid-item.current { border-color: #1a3a6b; }
            .dp-footer {
                display: flex; gap: 12px; margin-top: 16px;
            }
            .dp-footer-btn {
                flex: 1; padding: 10px; border-radius: 30px;
                font-family: 'Cairo', sans-serif; font-size: 14px;
                font-weight: 700; cursor: pointer; border: none;
            }
            .dp-today-btn { background: #f0f4fa; color: #1a3a6b; }
            .dp-save-btn { background: #1a3a6b; color: white; }
            body.dark-mode .dp-today-btn { background: #0d1a2e; color: #a8c8f0; }
        `;
        document.head.appendChild(style);
    }
}

/**
 * ربط أحداث منتقي التاريخ
 */
function attachDatePickerEvents() {
    const overlay = document.getElementById('dpOverlay');
    if (!overlay) return;
    
    document.getElementById('dpPrevBtn')?.addEventListener('click', dpPrev);
    document.getElementById('dpNextBtn')?.addEventListener('click', dpNext);
    document.getElementById('dpPrevSingle')?.addEventListener('click', dpPrevSingle);
    document.getElementById('dpNextSingle')?.addEventListener('click', dpNextSingle);
    document.getElementById('dpMonthBtn')?.addEventListener('click', () => { dpView = 'months'; renderDP(); });
    document.getElementById('dpYearBtn')?.addEventListener('click', () => { dpView = 'years'; dpYearBase = dpYear - 6; renderDP(); });
    document.getElementById('dpTodayBtn')?.addEventListener('click', () => {
        if (onDateSelectedCallback) {
            const today = new Date();
            onDateSelectedCallback(today.getFullYear(), today.getMonth(), today.getDate());
        }
        closeDatePicker();
    });
    document.getElementById('dpCloseBtn')?.addEventListener('click', closeDatePicker);
    
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDatePicker(); });
}

/**
 * فتح منتقي التاريخ
 */
function openDatePicker() {
    if (!onDateSelectedCallback || !currentDateCallback) {
        console.warn('DatePicker not initialized. Call initDatePicker first.');
        return;
    }
    
    const current = currentDateCallback();
    dpYear = current.getFullYear();
    dpMonth = current.getMonth();
    dpView = 'days';
    dpYearBase = dpYear - 6;
    renderDP();
    
    const overlay = document.getElementById('dpOverlay');
    if (overlay) overlay.classList.add('open');
}

/**
 * إغلاق منتقي التاريخ
 */
function closeDatePicker() {
    const overlay = document.getElementById('dpOverlay');
    if (overlay) overlay.classList.remove('open');
}

/**
 * عرض منتقي التاريخ
 */
function renderDP() {
    const monthBtn = document.getElementById('dpMonthBtn');
    const yearBtn = document.getElementById('dpYearBtn');
    const dayView = document.getElementById('dpDayView');
    const gridView = document.getElementById('dpGridView');
    const prevBtn = document.getElementById('dpPrevBtn');
    const nextBtn = document.getElementById('dpNextBtn');
    
    if (monthBtn) monthBtn.textContent = AR_MONTHS_FULL[dpMonth];
    if (yearBtn) yearBtn.textContent = dpYear;
    
    if (dpView === 'days') {
        if (dayView) dayView.style.display = '';
        if (gridView) gridView.style.display = 'none';
        if (prevBtn) prevBtn.textContent = '▶▶';
        if (nextBtn) nextBtn.textContent = '◀◀';
        renderDays();
    } else {
        if (dayView) dayView.style.display = 'none';
        if (gridView) gridView.style.display = '';
        if (prevBtn) prevBtn.textContent = dpView === 'years' ? '▶▶▶' : '▶▶';
        if (nextBtn) nextBtn.textContent = dpView === 'years' ? '◀◀◀' : '◀◀';
        renderGrid();
    }
}

/**
 * عرض أيام الشهر
 */
function renderDays() {
    const today = new Date();
    const currentDate = currentDateCallback ? currentDateCallback() : new Date();
    const grid = document.getElementById('dpDays');
    const weekdaysDiv = document.querySelector('#dpDayView .dp-weekdays');
    
    if (!grid) return;
    
    // عرض أيام الأسبوع
    if (weekdaysDiv) {
        weekdaysDiv.innerHTML = AR_DAYS_SHORT.map(d => `<div class="dp-weekday">${d}</div>`).join('');
    }
    
    const firstDay = new Date(dpYear, dpMonth, 1).getDay();
    const daysInMonth = new Date(dpYear, dpMonth + 1, 0).getDate();
    
    grid.innerHTML = '';
    
    // أيام فارغة قبل بداية الشهر
    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'dp-day empty';
        grid.appendChild(el);
    }
    
    // أيام الشهر
    for (let d = 1; d <= daysInMonth; d++) {
        const el = document.createElement('div');
        const isToday = today.getFullYear() === dpYear && today.getMonth() === dpMonth && today.getDate() === d;
        const isSelected = currentDate.getFullYear() === dpYear && currentDate.getMonth() === dpMonth && currentDate.getDate() === d;
        el.className = 'dp-day' + (isToday ? ' today' : '') + (isSelected ? ' selected' : '');
        el.textContent = d;
        el.onclick = (function(y, m, day) {
            return function() {
                if (onDateSelectedCallback) onDateSelectedCallback(y, m, day);
                closeDatePicker();
            };
        })(dpYear, dpMonth, d);
        grid.appendChild(el);
    }
}

/**
 * عرض شبكة الأشهر أو السنوات
 */
function renderGrid() {
    const grid = document.getElementById('dpGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (dpView === 'months') {
        AR_MONTHS_FULL.forEach((name, i) => {
            const el = document.createElement('div');
            el.className = 'dp-grid-item' + (i === dpMonth ? ' selected' : '');
            el.textContent = name;
            el.onclick = () => { dpMonth = i; dpView = 'days'; renderDP(); };
            grid.appendChild(el);
        });
    } else {
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 12; i++) {
            const y = dpYearBase + i;
            const el = document.createElement('div');
            el.className = 'dp-grid-item' + (y === dpYear ? ' selected' : '') + (y === currentYear ? ' current' : '');
            el.textContent = y;
            el.onclick = () => { dpYear = y; dpView = 'months'; renderDP(); };
            grid.appendChild(el);
        }
    }
}

// دوال التنقل
function dpPrev() { if (dpView === 'days') dpYear--; else if (dpView === 'months') dpYear--; else dpYearBase -= 12; renderDP(); }
function dpNext() { if (dpView === 'days') dpYear++; else if (dpView === 'months') dpYear++; else dpYearBase += 12; renderDP(); }
function dpPrevSingle() { if (dpView === 'days') { dpMonth--; if (dpMonth < 0) { dpMonth = 11; dpYear--; } } renderDP(); }
function dpNextSingle() { if (dpView === 'days') { dpMonth++; if (dpMonth > 11) { dpMonth = 0; dpYear++; } } renderDP(); }

// ======================== تصدير الوظائف ========================
window.ICPWADatePicker = {
    init: initDatePicker,
    open: openDatePicker,
    close: closeDatePicker
};
