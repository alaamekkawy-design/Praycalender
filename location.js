/**
 * GPS Location Helper
 * يدير الموقع الجغرافي وعرض البيانات وإحداثيات GPS
 * 
 * كيفية الاستخدام:
 * 1. أضف هذا الملف إلى مشروعك: <script src="location.js" defer></script>
 * 2. أضف زر الموقع في HTML: <button id="locationBtn">📍 الموقع</button>
 * 3. استدعِ initGPSLocation() بعد تحميل الصفحة
 */

// ======================== البيانات الأساسية ========================

const DEFAULT_LOCATION_DATA = {
  latitude: 0,
  latitudeDMS: "0°0'0.0000\" N",
  longitude: 0,
  longitudeDMS: "0°0'0.0000\" E",
  address: "------"
};

let LOCATION_DATA = { ...DEFAULT_LOCATION_DATA };
let locationIsLive = false;

// ======================== دوال مساعدة ========================

/**
 * تحويل من درجات عشرية إلى صيغة DMS (درجات/دقائق/ثواني)
 */
function toDMS(value, isLat) {
  const abs = Math.abs(value);
  let deg = Math.floor(abs);
  let minFloat = (abs - deg) * 60;
  let min = Math.floor(minFloat);
  let sec = (minFloat - min) * 60;
  
  if (sec >= 59.99995) {
    sec = 0;
    min++;
    if (min >= 60) {
      min = 0;
      deg++;
    }
  }
  
  const dir = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  return `${deg}°${min}'${sec.toFixed(4)}" ${dir}`;
}

/**
 * عرض رسالة منبثقة قصيرة
 */
function showToastMessage(message, duration = 3000) {
  const existing = document.querySelector('.toast-message');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a3a6b;
    color: white;
    padding: 10px 20px;
    border-radius: 50px;
    font-size: 14px;
    z-index: 2100;
    animation: toastFadeOut ${duration}ms forwards;
    font-family: 'Cairo', sans-serif;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, duration);
}

/**
 * نسخ النص إلى الحافظة
 */
async function copyToClipboard(text, successMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToastMessage(successMsg || 'تم النسخ ✅');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToastMessage(successMsg || 'تم النسخ ✅');
  }
}

/**
 * ترميز HTML للأمان
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ======================== دوال الموقع ========================

/**
 * جلب الموقع الحالي عبر GPS الجهاز
 */
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('المتصفح لا يدعم تحديد الموقع'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * تحويل الإحداثيات إلى عنوان عبر خدمة Reverse Geocoding
 */
async function reverseGeocode(lat, lng) {
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'ar' }
    });
    const data = await resp.json();
    if (data && data.display_name) return data.display_name;
    return null;
  } catch (e) {
    console.error('خطأ في عكس الإحداثيات:', e);
    return null;
  }
}

/**
 * الحصول على رابط خرائط جوجل
 */
function getGoogleMapsLink() {
  if (!locationIsLive) return '#';
  return `https://www.google.com/maps?q=${LOCATION_DATA.latitude},${LOCATION_DATA.longitude}`;
}

/**
 * تحديث بيانات الموقع من GPS
 */
async function updateLocationFromGPS() {
  try {
    const coords = await getCurrentLocation();
    const lat = coords.latitude;
    const lng = coords.longitude;
    const address = await reverseGeocode(lat, lng);
    
    LOCATION_DATA = {
      latitude: Math.round(lat * 100000) / 100000,
      longitude: Math.round(lng * 100000) / 100000,
      latitudeDMS: toDMS(lat, true),
      longitudeDMS: toDMS(lng, false),
      address: address || DEFAULT_LOCATION_DATA.address
    };
    locationIsLive = true;
    
    return true;
  } catch (e) {
    console.error('خطأ في تحديث الموقع:', e);
    showToastMessage('تعذر تحديد الموقع');
    return false;
  }
}

// ======================== نافذة POPUP ========================

let currentOverlay = null;

/**
 * إغلاق نافذة الموقع
 */
function closeLocationPopup() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
  }
}

/**
 * عرض نافذة الموقع المنبثقة
 */
async function showLocationPopup() {
  // إغلاق أي نافذة مفتوحة
  closeLocationPopup();
  
  // إنشاء النافذة
  const overlay = document.createElement('div');
  overlay.className = 'location-popup-overlay';
  
  const card = document.createElement('div');
  card.className = 'location-popup-card';
  
  // وظيفة عرض المحتوى
  function renderContent() {
    card.innerHTML = `
      <div class="popup-header">
        <h3>📍 موقعي الحالي</h3>
        <button class="close-popup" id="closeLocationPopup">✕</button>
      </div>
      <div class="popup-content">
        <div class="info-row">
          <div class="info-label">العنوان التفصيلي ${locationIsLive ? '(GPS)' : '(افتراضي)'}</div>
          <div class="info-value" id="popupAddress">${escapeHtml(LOCATION_DATA.address)}</div>
        </div>
        <div class="coord-row">
          <div class="coord-box">
            <div class="coord-label">خط العرض</div>
            <div class="coord-value" id="popupLat">${LOCATION_DATA.latitude}°</div>
            <div class="coord-value" style="font-size:11px; direction:ltr; margin-top:4px;">${LOCATION_DATA.latitudeDMS}</div>
          </div>
          <div class="coord-box">
            <div class="coord-label">خط الطول</div>
            <div class="coord-value" id="popupLng">${LOCATION_DATA.longitude}°</div>
            <div class="coord-value" style="font-size:11px; direction:ltr; margin-top:4px;">${LOCATION_DATA.longitudeDMS}</div>
          </div>
        </div>
        <a href="${getGoogleMapsLink()}" target="_blank" class="google-link" ${locationIsLive ? '' : 'style="opacity:0.5;pointer-events:none;"'}>
          🗺️ فتح في خرائط جوجل
        </a>
        <div class="action-buttons">
          <button class="action-btn" id="copyAddressBtn" ${locationIsLive ? '' : 'disabled style="opacity:0.5;"'}>📋 نسخ العنوان</button>
          <button class="action-btn" id="copyCoordsBtn" ${locationIsLive ? '' : 'disabled style="opacity:0.5;"'}>📍 نسخ الإحداثيات</button>
          <button class="action-btn" id="shareLocationBtn" ${locationIsLive ? '' : 'disabled style="opacity:0.5;"'}>📤 مشاركة الموقع</button>
        </div>
        <button class="action-btn" id="refreshLocationBtn" style="margin-top:0;">🔄 تحديث الموقع من GPS</button>
      </div>
    `;
    attachEvents();
  }
  
  // وظيفة ربط الأحداث
  function attachEvents() {
    document.getElementById('closeLocationPopup')?.addEventListener('click', closeLocationPopup);
    document.getElementById('copyAddressBtn')?.addEventListener('click', () => {
      copyToClipboard(LOCATION_DATA.address, "تم نسخ العنوان ✅");
    });
    document.getElementById('copyCoordsBtn')?.addEventListener('click', () => {
      copyToClipboard(`${LOCATION_DATA.latitude}, ${LOCATION_DATA.longitude}`, "تم نسخ الإحداثيات 📍");
    });
    document.getElementById('shareLocationBtn')?.addEventListener('click', async () => {
      const shareData = {
        title: 'موقعي',
        text: LOCATION_DATA.address,
        url: getGoogleMapsLink()
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch(e) {}
      } else {
        copyToClipboard(getGoogleMapsLink(), "رابط الموقع منسوخ");
      }
    });
    document.getElementById('refreshLocationBtn')?.addEventListener('click', refreshLocationAndPopup);
  }
  
  // وظيفة تحديث الموقع وتحديث النافذة
  async function refreshLocationAndPopup() {
    const btn = document.getElementById('refreshLocationBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerText = '⏳ جارٍ تحديد الموقع...';
    }
    
    const success = await updateLocationFromGPS();
    
    if (success) {
      renderContent();
      showToastMessage('تم تحديث الموقع ✅');
    }
    
    if (btn) {
      btn.disabled = false;
      btn.innerText = '🔄 تحديث الموقع من GPS';
    }
  }
  
  renderContent();
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  
  // إغلاق عند الضغط على الخلفية
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLocationPopup();
  });
}

// ======================== الحصول على إحداثيات فقط (للاستخدام الخارجي) ========================

/**
 * الحصول على إحداثيات الموقع الحالي (وعد)
 */
async function getCoordinates() {
  if (locationIsLive && LOCATION_DATA.latitude !== 0) {
    return {
      lat: LOCATION_DATA.latitude,
      lng: LOCATION_DATA.longitude,
      address: LOCATION_DATA.address
    };
  }
  
  const success = await updateLocationFromGPS();
  if (success) {
    return {
      lat: LOCATION_DATA.latitude,
      lng: LOCATION_DATA.longitude,
      address: LOCATION_DATA.address
    };
  }
  
  return null;
}

/**
 * الحصول على عنوان الموقع الحالي
 */
async function getCurrentAddress() {
  const coords = await getCoordinates();
  return coords ? coords.address : null;
}

// ======================== أنماط CSS الإضافية ========================

function addLocationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastFadeOut {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; visibility: hidden; }
    }
    
    .location-popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      font-family: 'Cairo', sans-serif;
      direction: rtl;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { transform: translateY(40px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .location-popup-card {
      background: #ffffff;
      width: 90%;
      max-width: 400px;
      border-radius: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      animation: slideUp 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
    }
    
    body.dark-mode .location-popup-card {
      background: #0f1e33;
      border: 1px solid #2a5298;
    }
    
    .popup-header {
      background: #1a3a6b;
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
    }
    
    body.dark-mode .popup-header {
      background: #0a1628;
    }
    
    .popup-header h3 {
      font-size: 1.3rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    
    .close-popup {
      background: rgba(255,255,255,0.2);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 40px;
      font-size: 20px;
      cursor: pointer;
      color: white;
      font-weight: bold;
      transition: 0.2s;
    }
    
    .close-popup:hover { background: rgba(255,255,255,0.4); }
    
    .popup-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .info-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #f8fafd;
      padding: 12px 14px;
      border-radius: 20px;
    }
    
    body.dark-mode .info-row {
      background: #0d1a2e;
    }
    
    .info-label {
      font-size: 12px;
      font-weight: 700;
      color: #6c86a3;
      letter-spacing: 0.5px;
    }
    
    body.dark-mode .info-label {
      color: #8aa9d0;
    }
    
    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #1a2c44;
      word-break: break-word;
      line-height: 1.4;
    }
    
    body.dark-mode .info-value {
      color: #cde1ff;
    }
    
    .coord-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    
    .coord-box {
      flex: 1;
      background: #eef2f9;
      border-radius: 16px;
      padding: 10px;
      text-align: center;
    }
    
    body.dark-mode .coord-box {
      background: #101c30;
    }
    
    .coord-label {
      font-size: 11px;
      font-weight: 600;
      color: #4a627a;
    }
    
    .coord-value {
      font-size: 14px;
      font-weight: 800;
      font-family: monospace;
      margin-top: 4px;
      color: #1a3a6b;
    }
    
    body.dark-mode .coord-value {
      color: #cde1ff;
    }
    
    .google-link {
      background: #1a73e8;
      color: white;
      text-decoration: none;
      text-align: center;
      padding: 12px;
      border-radius: 60px;
      font-weight: 700;
      font-size: 14px;
      transition: 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .google-link:hover {
      background: #0d62cc;
      transform: scale(0.98);
    }
    
    .action-buttons {
      display: flex;
      gap: 12px;
      margin-top: 6px;
    }
    
    .action-btn {
      flex: 1;
      background: #eef2f9;
      border: none;
      padding: 12px;
      border-radius: 40px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: 0.2s;
      color: #1a3a6b;
    }
    
    body.dark-mode .action-btn {
      background: #101c30;
      color: #cde1ff;
    }
    
    .action-btn:active { transform: scale(0.96); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `;
  document.head.appendChild(style);
}

// ======================== التهيئة الرئيسية ========================

/**
 * تهيئة نظام GPS والموقع
 * @param {Object} options - خيارات التهيئة
 * @param {boolean} options.autoGetLocation - الحصول على الموقع تلقائياً عند التحميل (افتراضي: false)
 */
async function initGPSLocation(options = {}) {
  const { autoGetLocation = false } = options;
  
  console.log('🚀 بدء تهيئة نظام GPS...');
  
  // إضافة الأنماط
  addLocationStyles();
  
  // ربط زر الموقع
  const locationBtn = document.getElementById('locationBtn');
  if (locationBtn) {
    locationBtn.addEventListener('click', showLocationPopup);
    console.log('✅ تم ربط زر الموقع');
  } else {
    console.warn('⚠️ لم يتم العثور على زر الموقع (id="locationBtn")');
  }
  
  // الحصول على الموقع تلقائياً إذا طلب ذلك
  if (autoGetLocation) {
    const success = await updateLocationFromGPS();
    if (success) {
      console.log('✅ تم الحصول على الموقع تلقائياً');
    }
  }
}

// ======================== تصدير الوظائف ========================

// للاستخدام المباشر في المتصفح
window.GPSLocation = {
  init: initGPSLocation,
  getCoordinates: getCoordinates,
  getCurrentAddress: getCurrentAddress,
  showPopup: showLocationPopup,
  updateLocation: updateLocationFromGPS,
  getLocationData: () => ({ ...LOCATION_DATA, isLive: locationIsLive })
};

// للاستخدام مع ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initGPSLocation,
    getCoordinates,
    getCurrentAddress,
    showLocationPopup,
    updateLocationFromGPS,
    getLocationData: () => ({ ...LOCATION_DATA, isLive: locationIsLive })
  };
}
