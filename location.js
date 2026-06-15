// location.js - نسخة مبسطة ومضمونة
const DEFAULT_LOCATION_DATA = {
  latitude: 0,
  latitudeDMS: "0°0'0.0000\" N",
  longitude: 0,
  longitudeDMS: "0°0'0.0000\" E",
  address: "------"
};

let LOCATION_DATA = { ...DEFAULT_LOCATION_DATA };
let locationIsLive = false;

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

function showToastMessage(msg) {
  const toast = document.createElement('div');
  toast.className = 'copy-success';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

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

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

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

async function reverseGeocode(lat, lng) {
  try {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'ar' }
    });
    const data = await resp.json();
    if (data && data.display_name) return data.display_name;
    return null;
  } catch (e) {
    return null;
  }
}

function getGoogleMapsLink() {
  if (!locationIsLive) return '#';
  return `https://www.google.com/maps?q=${LOCATION_DATA.latitude},${LOCATION_DATA.longitude}`;
}

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
    return false;
  }
}

async function showLocationPopup() {
  const existing = document.querySelector('.location-popup-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'location-popup-overlay';

  const card = document.createElement('div');
  card.className = 'location-popup-card';

  function renderContent() {
    card.innerHTML = `
      <div class="popup-header">
        <h3>📍 موقعي الحالي</h3>
        <button class="close-popup" id="closeLocationPopup">✕</button>
      </div>
      <div class="popup-content">
        <div class="info-row">
          <div class="info-label">العنوان التفصيلي ${locationIsLive ? '(GPS)' : '(افتراضي)'}</div>
          <div class="info-value">${escapeHtml(LOCATION_DATA.address)}</div>
        </div>
        <div class="coord-row">
          <div class="coord-box">
            <div class="coord-label">خط العرض</div>
            <div class="coord-value">${LOCATION_DATA.latitude}°</div>
            <div class="coord-value" style="font-size:11px;">${LOCATION_DATA.latitudeDMS}</div>
          </div>
          <div class="coord-box">
            <div class="coord-label">خط الطول</div>
            <div class="coord-value">${LOCATION_DATA.longitude}°</div>
            <div class="coord-value" style="font-size:11px;">${LOCATION_DATA.longitudeDMS}</div>
          </div>
        </div>
        <a href="${getGoogleMapsLink()}" target="_blank" class="google-link" ${locationIsLive ? '' : 'style="opacity:0.5;"'}>
          🗺️ فتح في خرائط جوجل
        </a>
        <div class="action-buttons">
          <button class="action-btn" id="copyAddressBtn">📋 نسخ العنوان</button>
          <button class="action-btn" id="copyCoordsBtn">📍 نسخ الإحداثيات</button>
          <button class="action-btn" id="refreshLocationBtn">🔄 تحديث الموقع من GPS</button>
        </div>
      </div>
    `;
    
    document.getElementById('closeLocationPopup')?.addEventListener('click', () => overlay.remove());
    document.getElementById('copyAddressBtn')?.addEventListener('click', () => copyToClipboard(LOCATION_DATA.address, "تم نسخ العنوان ✅"));
    document.getElementById('copyCoordsBtn')?.addEventListener('click', () => copyToClipboard(`${LOCATION_DATA.latitude}, ${LOCATION_DATA.longitude}`, "تم نسخ الإحداثيات 📍"));
    document.getElementById('refreshLocationBtn')?.addEventListener('click', async () => {
      await updateLocationFromGPS();
      renderContent();
      showToastMessage('تم تحديث الموقع ✅');
    });
  }

  renderContent();
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// تصدير للاستخدام
window.showLocationPopup = showLocationPopup;
window.updateLocationFromGPS = updateLocationFromGPS;
