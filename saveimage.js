/**
 * Save as Image Module for ICPWA
 * حفظ صفحة المواقيت كصورة مع إمكانية إضافة معلومات البرج
 * 
 * كيفية الاستخدام:
 * 1. أضف div للطباعة: <div id="printView" style="display:none;">...</div>
 * 2. استدعِ initSaveImage() ثم saveAsImage(withZodiac)
 */

// ======================== متغيرات عامة ========================
let printViewElement = null;
let currentDataForPrint = null;

/**
 * تهيئة وحدة حفظ الصورة
 */
function initSaveImage(getPrayerDataFn, getCurrentDateFn, citiesArray, settingsObj) {
    window.getPrayerDataForPrint = getPrayerDataFn;
    window.getCurrentDateForPrint = getCurrentDateFn;
    window.citiesArrayForPrint = citiesArray;
    window.settingsForPrint = settingsObj;
    buildPrintViewHTML();
    buildSaveDialogHTML();
}

/**
 * بناء HTML لواجهة الطباعة
 */
function buildPrintViewHTML() {
    if (document.getElementById('printView')) return;
    
    const printView = document.createElement('div');
    printView.id = 'printView';
    printView.style.cssText = `
        display: none; position: fixed; top: -9999px; left: -9999px;
        width: 420px; background: #fff; padding: 24px 20px;
        direction: rtl; font-family: 'Cairo', sans-serif;
    `;
    printView.innerHTML = `
        <div id="pv-dayAr" style="text-align:center;font-family:'Amiri',serif;font-size:64px;font-weight:700;color:#1a3a6b;"></div>
        <div id="pv-dayEn" style="text-align:center;font-size:13px;font-weight:600;color:#1a3a6b;letter-spacing:3px;border:1.5px solid #1a3a6b;width:fit-content;padding:3px 20px;margin:5px auto 12px;"></div>
        <div style="display:flex;border-top:2px solid #1a3a6b;border-bottom:2px solid #1a3a6b;margin-bottom:3px;">
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;padding:8px;border-left:2px solid #1a3a6b;">
                <span id="pv-gregDay" style="font-family:'Amiri',serif;font-size:100px;font-weight:700;color:#1a3a6b;"></span>
                <span id="pv-gregMonth" style="font-family:'Amiri',serif;font-size:26px;font-weight:700;color:#1a3a6b;"></span>
                <span id="pv-gregYear" style="font-size:22px;font-weight:700;color:#1a3a6b;"></span>
            </div>
            <div style="flex:1;text-align:center;padding:8px;">
                <span id="pv-hijriDay" style="font-family:'Amiri',serif;font-size:100px;font-weight:700;color:#1a3a6b;"></span>
                <span id="pv-hijriMonth" style="font-family:'Amiri',serif;font-size:26px;font-weight:700;color:#1a3a6b;"></span>
                <span id="pv-hijriYear" style="font-size:22px;font-weight:700;color:#1a3a6b;"></span>
            </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0;">
            <span id="pv-coptic" style="font-size:11px;color:#1a3a6b;border:1px solid #1a3a6b;padding:4px 8px;border-radius:10px;"></span>
            <span id="pv-greg" style="background:#1a3a6b;color:white;font-size:11px;padding:4px 8px;border-radius:10px;"></span>
        </div>
        <table id="pv-table" style="width:100%;border-collapse:collapse;font-size:12px;direction:rtl;"></table>
        <div id="pv-zodiac" style="text-align:center;font-size:11px;color:#4a6a9b;margin-top:8px;padding:6px 8px;background:#f4f7fc;border-radius:6px;"></div>
        <div style="text-align:center;font-family:'Amiri',serif;font-size:18px;font-weight:700;color:#1a3a6b;margin-top:10px;padding-top:10px;border-top:1px solid #c5cfe0;">
            <span>Mekkawy</span>
        </div>
    `;
    document.body.appendChild(printView);
}

/**
 * بناء HTML لنافذة حفظ الصورة
 */
function buildSaveDialogHTML() {
    if (document.getElementById('saveDialog')) return;
    
    const dialog = document.createElement('div');
    dialog.id = 'saveDialog';
    dialog.style.cssText = `
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,0.5); z-index: 300;
        align-items: center; justify-content: center;
    `;
    dialog.innerHTML = `
        <div style="background:#fff;width:80vw;max-width:320px;border-radius:16px;padding:24px;direction:rtl;box-shadow:0 8px 32px rgba(0,0,0,0.25);">
            <div style="font-family:'Cairo',sans-serif;font-size:18px;font-weight:700;color:#1a3a6b;text-align:center;margin-bottom:20px;">📸 حفظ الصورة</div>
            <button id="saveWithZodiac" style="width:100%;padding:12px;margin-bottom:10px;background:#1a3a6b;color:white;border:none;border-radius:30px;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">
                ✨ مع معلومات البرج
            </button>
            <button id="saveWithoutZodiac" style="width:100%;padding:12px;margin-bottom:10px;background:#f0f4fa;color:#1a3a6b;border:1px solid #c5cfe0;border-radius:30px;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">
                📅 بدون معلومات البرج
            </button>
            <button id="closeSaveDialog" style="width:100%;padding:10px;background:none;color:#a8c0e8;border:none;font-family:'Cairo',sans-serif;font-size:13px;cursor:pointer;">
                إلغاء
            </button>
        </div>
    `;
    document.body.appendChild(dialog);
    
    document.getElementById('saveWithZodiac')?.addEventListener('click', () => saveAsImage(true));
    document.getElementById('saveWithoutZodiac')?.addEventListener('click', () => saveAsImage(false));
    document.getElementById('closeSaveDialog')?.addEventListener('click', closeSaveDialog);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeSaveDialog(); });
}

function showSaveDialog() { 
    const dlg = document.getElementById('saveDialog');
    if (dlg) dlg.style.display = 'flex';
}

function closeSaveDialog() { 
    const dlg = document.getElementById('saveDialog');
    if (dlg) dlg.style.display = 'none';
}

async function saveAsImage(withZodiac) {
    closeSaveDialog();
    
    const date = window.getCurrentDateForPrint ? window.getCurrentDateForPrint() : new Date();
    const pv = document.getElementById('printView');
    if (!pv) return;
    
    // تعبئة بيانات التاريخ
    const AR_MONTHS_G = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const EN_MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    const AR_DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const EN_DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    
    document.getElementById('pv-dayAr').textContent = AR_DAYS[date.getDay()];
    document.getElementById('pv-dayEn').textContent = EN_DAYS[date.getDay()];
    document.getElementById('pv-gregDay').textContent = date.getDate();
    document.getElementById('pv-gregMonth').textContent = AR_MONTHS_G[date.getMonth()];
    document.getElementById('pv-gregYear').textContent = date.getFullYear();
    document.getElementById('pv-greg').textContent = `${date.getDate()} ${EN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    
    // معلومات البرج
    if (withZodiac && window.ICPWAZodiac) {
        const zodiacHTML = window.ICPWAZodiac.getHTML(date);
        document.getElementById('pv-zodiac').innerHTML = zodiacHTML;
        document.getElementById('pv-zodiac').style.display = '';
    } else {
        document.getElementById('pv-zodiac').style.display = 'none';
    }
    
    pv.style.display = 'block';
    await new Promise(r => setTimeout(r, 100));
    
    try {
        const canvas = await html2canvas(pv, { scale: 3, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `مواقيت_${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch(e) {
        alert('تعذر حفظ الصورة: ' + e.message);
    } finally {
        pv.style.display = 'none';
    }
}

window.ICPWASaveImage = {
    init: initSaveImage,
    showDialog: showSaveDialog,
    save: saveAsImage
};
