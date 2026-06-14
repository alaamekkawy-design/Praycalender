/**
 * Settings Module for ICPWA
 * إدارة إعدادات التطبيق (المذهب، إزاحة الوقت، الصوت)
 * 
 * كيفية الاستخدام:
 * 1. أضف HTML للإعدادات
 * 2. استدعِ initSettings()
 */

// ======================== الإعدادات الافتراضية ========================
const DEFAULT_SETTINGS = {
    madhab: 'shafi',
    audio: true,
    offsets: {
        fajr: 0,
        sunrise: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
    },
    cityIdx: 0
};

const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء'
};

let currentSettings = { ...DEFAULT_SETTINGS };
let settingsCallbacks = [];

// ======================== تحميل وحفظ ========================

/**
 * تحميل الإعدادات من localStorage
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem('icpwa_settings');
        if (saved) {
            currentSettings = JSON.parse(saved);
        }
    } catch(e) {}
    return currentSettings;
}

/**
 * حفظ الإعدادات في localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem('icpwa_settings', JSON.stringify(currentSettings));
    } catch(e) {}
    // استدعاء回调
    settingsCallbacks.forEach(cb => cb(currentSettings));
}

/**
 * الحصول على الإعدادات الحالية
 */
function getSettings() {
    return { ...currentSettings };
}

/**
 * تحديث إعداد معين
 */
function updateSetting(key, value) {
    currentSettings[key] = value;
    saveSettings();
}

/**
 * تحديث إزاحة وقت الصلاة
 */
function updateOffset(prayer, delta) {
    currentSettings.offsets[prayer] = (currentSettings.offsets[prayer] || 0) + delta;
    saveSettings();
}

/**
 * إضافة مستمع لتغيرات الإعدادات
 */
function onSettingsChange(callback) {
    settingsCallbacks.push(callback);
}

// ======================== نافذة الإعدادات ========================

/**
 * بناء HTML لنافذة الإعدادات
 */
function buildSettingsHTML() {
    if (document.getElementById('settingsOverlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'settingsOverlay';
    overlay.className = 'settings-overlay';
    overlay.innerHTML = `
        <div class="settings-panel">
            <div class="settings-title">⚙ إعدادات مواقيت الصلاة</div>
            
            <div class="settings-section">
                <div class="toggle-row">
                    <span class="settings-label">🔔 تنبيه صوتي عند الصلاة</span>
                    <label class="toggle">
                        <input type="checkbox" id="audioToggle">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <span class="settings-label">المذهب الفقهي (وقت العصر)</span>
                <div class="madhab-row">
                    <button class="madhab-btn" id="btnShafi">شافعي / مالكي / حنبلي</button>
                    <button class="madhab-btn" id="btnHanafi">حنفي</button>
                </div>
            </div>
            
            <div class="settings-preview">
                <div class="settings-preview-title">📍 معاينة مباشرة</div>
                <table class="preview-table">
                    <thead><tr><th>فجر</th><th>شروق</th><th>ظهر</th><th>عصر</th><th>مغرب</th><th>عشاء</th></tr></thead>
                    <tbody id="previewBody"><tr><td colspan="6" class="loading">...</td></tr></tbody>
                </table>
            </div>
            
            <div class="settings-section">
                <span class="settings-label">ضبط دقيق (دقائق + / −)</span>
                <div class="offset-grid" id="offsetGrid"></div>
            </div>
            
            <button class="save-btn" id="testAudioBtn">🔊 اختبار الصوت</button>
            <button class="save-btn" id="saveSettingsBtn">💾 حفظ وإغلاق</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // إضافة الـ CSS
    if (!document.getElementById('settings-styles')) {
        const style = document.createElement('style');
        style.id = 'settings-styles';
        style.textContent = `
            .settings-overlay {
                display: none; position: fixed; inset: 0;
                background: rgba(0,0,0,0.5); z-index: 100;
                align-items: flex-start; justify-content: center;
                padding-top: 5vw;
            }
            .settings-overlay.open { display: flex; }
            .settings-panel {
                background: #fff; width: 92vw; max-width: 400px;
                border-radius: 16px; padding: 20px;
                max-height: 90vh; overflow-y: auto;
                direction: rtl; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            }
            body.dark-mode .settings-panel {
                background: #0f1e33;
                border: 1px solid #2a5298;
            }
            .settings-title {
                font-size: 20px; font-weight: 700; color: #1a3a6b;
                text-align: center; border-bottom: 1px solid #e0e6f0;
                padding-bottom: 12px; margin-bottom: 16px;
            }
            .settings-section { margin-bottom: 16px; }
            .settings-label { font-size: 14px; font-weight: 700; color: #1a3a6b; display: block; margin-bottom: 8px; }
            body.dark-mode .settings-label { color: #a8c8f0; }
            .toggle-row { display: flex; align-items: center; justify-content: space-between; }
            .toggle { position: relative; width: 52px; height: 26px; }
            .toggle input { opacity: 0; width: 0; height: 0; }
            .toggle-slider {
                position: absolute; inset: 0; background: #ccc;
                border-radius: 26px; cursor: pointer; transition: .3s;
            }
            .toggle-slider:before {
                content: ''; position: absolute; width: 20px; height: 20px;
                left: 3px; top: 3px; background: white; border-radius: 50%; transition: .3s;
            }
            input:checked + .toggle-slider { background: #1a3a6b; }
            input:checked + .toggle-slider:before { transform: translateX(26px); }
            .madhab-row { display: flex; gap: 8px; }
            .madhab-btn {
                flex: 1; padding: 8px; border: 1px solid #1a3a6b;
                border-radius: 30px; background: white; color: #1a3a6b;
                font-family: 'Cairo', sans-serif; font-size: 13px;
                font-weight: 600; cursor: pointer; text-align: center;
            }
            .madhab-btn.active { background: #1a3a6b; color: white; }
            .settings-preview {
                background: #f4f7fc; border-radius: 12px; padding: 12px;
                margin-bottom: 16px;
            }
            .preview-table { width: 100%; border-collapse: collapse; font-size: 12px; direction: rtl; }
            .preview-table th, .preview-table td { padding: 6px 4px; text-align: center; border: 0.5px solid #c5cfe0; }
            .offset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .offset-item {
                background: #f4f7fc; border-radius: 12px; padding: 10px 12px;
            }
            .offset-name { font-size: 13px; font-weight: 700; display: flex; justify-content: space-between; margin-bottom: 6px; }
            .offset-current { color: #f0a500; font-size: 11px; }
            .offset-controls { display: flex; align-items: center; justify-content: center; gap: 12px; }
            .offset-btn {
                width: 32px; height: 32px; border-radius: 50%;
                border: 1px solid #1a3a6b; background: white;
                font-size: 18px; font-weight: 700; cursor: pointer;
            }
            .offset-val { font-size: 14px; font-weight: 700; min-width: 40px; text-align: center; }
            .save-btn {
                width: 100%; padding: 12px; background: #1a3a6b;
                color: white; border: none; border-radius: 30px;
                font-family: 'Cairo', sans-serif; font-size: 14px;
                font-weight: 700; cursor: pointer; margin-top: 10px;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * فتح نافذة الإعدادات
 */
function openSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) buildSettingsHTML();
    
    // تحديث الواجهة بالإعدادات الحالية
    document.getElementById('audioToggle').checked = currentSettings.audio;
    document.getElementById('btnShafi').classList.toggle('active', currentSettings.madhab === 'shafi');
    document.getElementById('btnHanafi').classList.toggle('active', currentSettings.madhab === 'hanafi');
    
    buildOffsetGrid();
    document.getElementById('settingsOverlay').classList.add('open');
}

/**
 * إغلاق نافذة الإعدادات
 */
function closeSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) overlay.classList.remove('open');
}

/**
 * بناء شبكة إزاحة الوقت
 */
function buildOffsetGrid() {
    const grid = document.getElementById('offsetGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    PRAYER_KEYS.forEach(key => {
        const val = currentSettings.offsets[key] || 0;
        const sign = val >= 0 ? '+' : '';
        const div = document.createElement('div');
        div.className = 'offset-item';
        div.innerHTML = `
            <div class="offset-name">
                <span>${PRAYER_LABELS[key]}</span>
                    <span class="offset-current">${sign}${val} د</span>
                </div>
                <div class="offset-controls">
                    <button class="offset-btn" onclick="window.ICPWASettings.changeOffset('${key}', -1)">−</button>
                    <span class="offset-val" id="offset_${key}">${sign}${val}</span>
                    <button class="offset-btn" onclick="window.ICPWASettings.changeOffset('${key}', 1)">+</button>
                </div>
            `;
        grid.appendChild(div);
    });
}

/**
 * تغيير إزاحة الوقت
 */
function changeOffset(prayer, delta) {
    currentSettings.offsets[prayer] = (currentSettings.offsets[prayer] || 0) + delta;
    const val = currentSettings.offsets[prayer];
    const sign = val >= 0 ? '+' : '';
    const span = document.getElementById(`offset_${prayer}`);
    if (span) span.textContent = `${sign}${val}`;
    
    const currentSpan = document.querySelector(`#offsetGrid .offset-item:has(.offset-name span:contains('${PRAYER_LABELS[prayer]}')) .offset-current`);
    if (currentSpan) currentSpan.textContent = `${sign}${val} د`;
    
    saveSettings();
}

// ======================== تصدير الوظائف ========================
window.ICPWASettings = {
    load: loadSettings,
    save: saveSettings,
    get: getSettings,
    update: updateSetting,
    updateOffset: updateOffset,
    onChange: onSettingsChange,
    open: openSettings,
    close: closeSettings,
    changeOffset: changeOffset
};

// تحميل الإعدادات تلقائياً
loadSettings();
