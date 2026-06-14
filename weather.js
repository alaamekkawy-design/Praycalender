/**
 * Weather Module for ICPWA
 * يعرض حالة الطقس باستخدام WeatherAPI.com
 * 
 * كيفية الاستخدام:
 * 1. أضف في HTML: <div class="weather-box" id="weatherBox">...</div>
 * 2. استدعِ initWeather(cityLat, cityLng, cityName)
 */

// ======================== الإعدادات ========================
const WEATHER_API_KEY = '819c643e98f045faadd50730260106';
const WEATHER_CACHE_KEY = 'icpwa_weather';

// ======================== دوال مساعدة ========================

/**
 * تحويل درجة الرياح إلى اتجاه نصي
 */
function windDirection(deg) {
    const directions = ['↑ ش', '↗ شش', '→ ش', '↘ جش', '↓ ج', '↙ جغ', '← غ', '↖ شغ'];
    return directions[Math.round(deg / 45) % 8];
}

/**
 * مفتاح التخزين المؤقت للطقس (30 دقيقة)
 */
function getWeatherCacheKey(lat, lng) {
    const d = new Date();
    const slot = Math.floor(d.getMinutes() / 30);
    return `${lat.toFixed(2)}_${lng.toFixed(2)}_${d.getDate()}_${d.getHours()}_${slot}`;
}

/**
 * جلب بيانات الطقس من API
 */
async function fetchWeatherFromAPI(lat, lng) {
    const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lng}&lang=ar&aqi=no`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('فشل جلب بيانات الطقس');
    return await response.json();
}

// ======================== التخزين المؤقت ========================

/**
 * حفظ بيانات الطقس في localStorage
 */
function cacheWeatherData(key, data) {
    try {
        const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || '{}');
        const fresh = { [key]: data };
        // الاحتفاظ بآخر 8 إدخالات فقط
        const keys = Object.keys(cached).slice(-7);
        keys.forEach(k => { fresh[k] = cached[k]; });
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(fresh));
    } catch(e) { console.warn('فشل حفظ الطقس في cache:', e); }
}

/**
 * استرجاع بيانات الطقس من localStorage
 */
function getCachedWeather(key) {
    try {
        const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || '{}');
        return cached[key] || null;
    } catch(e) { return null; }
}

// ======================== عرض الطقس ========================

/**
 * عرض بيانات الطقس في الواجهة
 */
function renderWeather(data, cityName) {
    const c = data.current;
    const box = document.getElementById('weatherBox');
    if (!box) return;
    
    const windDir = windDirection(c.wind_degree);
    
    box.innerHTML = `
        <div class="weather-city-name">🌍 ${cityName}</div>
        <div class="weather-top">
            <div>
                <div class="weather-temp">${Math.round(c.temp_c)}<span class="weather-unit">°م</span></div>
                <div class="weather-condition">${c.condition.text}</div>
            </div>
            <img class="weather-icon" src="https:${c.condition.icon}" alt="${c.condition.text}">
        </div>
        <div class="weather-details">
            <div class="weather-detail">
                <div class="weather-detail-val">${Math.round(c.feelslike_c)}°</div>
                <div class="weather-detail-lbl">الإحساس</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-val">${c.humidity}%</div>
                <div class="weather-detail-lbl">الرطوبة</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-val">${Math.round(c.wind_kph)} كم/س</div>
                <div class="weather-detail-lbl">الرياح ${windDir}</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-val">${c.vis_km} كم</div>
                <div class="weather-detail-lbl">الرؤية</div>
            </div>
        </div>
    `;
}

/**
 * عرض حالة التحميل
 */
function showWeatherLoading() {
    const box = document.getElementById('weatherBox');
    if (box) box.innerHTML = '<div class="weather-loading">☁️ جاري تحميل الطقس…</div>';
}

/**
 * عرض رسالة خطأ
 */
function showWeatherError() {
    const box = document.getElementById('weatherBox');
    if (box) box.innerHTML = '<div class="weather-loading">⚠️ تعذر تحميل الطقس</div>';
}

// ======================== الوظيفة الرئيسية ========================

/**
 * تحميل وعرض الطقس
 * @param {number} lat - خط العرض
 * @param {number} lng - خط الطول
 * @param {string} cityName - اسم المدينة
 * @param {boolean} forceRefresh - تحديث إجباري
 */
async function loadWeather(lat, lng, cityName, forceRefresh = false) {
    const key = getWeatherCacheKey(lat, lng);
    
    // محاولة الاسترجاع من cache
    if (!forceRefresh) {
        const cached = getCachedWeather(key);
        if (cached) {
            renderWeather(cached, cityName);
            return;
        }
    }
    
    showWeatherLoading();
    
    try {
        const data = await fetchWeatherFromAPI(lat, lng);
        cacheWeatherData(key, data);
        renderWeather(data, cityName);
    } catch(e) {
        console.error('خطأ في تحميل الطقس:', e);
        showWeatherError();
    }
}

/**
 * إعادة تعيين cache الطقس لمدينة معينة
 */
function clearWeatherCache(lat, lng) {
    try {
        const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || '{}');
        const prefix = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
        Object.keys(cached).forEach(key => {
            if (key.startsWith(prefix)) delete cached[key];
        });
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cached));
    } catch(e) {}
}

// ======================== تصدير الوظائف ========================
window.ICPWAWeather = {
    load: loadWeather,
    clearCache: clearWeatherCache,
    getCacheKey: getWeatherCacheKey
};
