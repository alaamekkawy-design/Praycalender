(() => {
    // ========================================================
    // 1. ميزة حفظ واستعادة حجم ومكان النافذة (Desktop)
    // ========================================================
    const WINDOW_STORAGE_KEY = 'islamic_calendar_window';
    let saveTimer = null;

    function saveWindowState() {
        try {
            if (window.screenX > -10000 && window.screenY > -10000 && window.outerWidth > 100 && window.outerHeight > 100) {
                const state = { x: window.screenX, y: window.screenY, width: window.outerWidth, height: window.outerHeight };
                localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify(state));
                document.title = `التقويم الإسلامي - ${state.width}×${state.height}`;
            }
        } catch(e) { console.warn('Could not save window state:', e); }
    }

    function restoreWindowState() {
        const saved = localStorage.getItem(WINDOW_STORAGE_KEY);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.width && state.height && state.width >= 330 && state.width < 2000 && state.height >= 500 && state.height < 2000) {
                    const maxX = window.screen.availWidth - 100; 
                    const maxY = window.screen.availHeight - 100;
                    const x = Math.min(Math.max(state.x, 0), maxX); 
                    const y = Math.min(Math.max(state.y, 0), maxY);
                    
                    window.resizeTo(state.width, state.height); 
                    setTimeout(() => window.moveTo(x, y), 50);
                    document.title = `التقويم الإسلامي - ${state.width}×${state.height}`; 
                    return true;
                }
            } catch(e) { console.warn('Could not restore window state:', e); }
        }
        return false;
    }

    function initWindowPersistence() {
        const restored = restoreWindowState();
        if (!restored) { 
            window.resizeTo(480, 500); 
            document.title = 'التقويم الإسلامي - 480×500'; 
        }
        window.addEventListener('resize', () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveWindowState, 500); });
        window.addEventListener('move', () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveWindowState, 500); });
        window.addEventListener('beforeunload', saveWindowState);
    }

    // ========================================================
    // 2. ميزة إدارة التثبيت والـ PWA وإنشاء زر التحديث تلقائياً
    // ========================================================
    let deferredPrompt;
    const installBtn = document.getElementById('pwaInstallBtn');
    let refreshBtn = null;

    // دالة لإنشاء زر التحديث وحقنه في الصفحة تلقائياً
    function createRefreshButton() {
        refreshBtn = document.createElement('button');
        refreshBtn.id = 'appRefreshBtn';
        refreshBtn.innerHTML = 'تحديث التطبيق 🔄';
        
        // تنسيق الزر ليظهر بشكل أنيق وثابت أعلى الصفحة
        Object.assign(refreshBtn.style, {
            backgroundColor: '#0f766e',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: '1002'
        });

        // حدث الضغط على الزر لتفريغ الكاش وإعادة التحميل
        refreshBtn.addEventListener('click', () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (let registration of registrations) {
                        registration.unregister(); 
                    }
                });
            }
            window.location.reload(true); 
        });

        // إضافة الزر إلى جسم الصفحة
        document.body.appendChild(refreshBtn);
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('PWA Ready!'))
            .catch((err) => console.error('Service Worker Failed:', err));
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); 
        deferredPrompt = e;
        if(installBtn) installBtn.style.display = 'block';
    });

    if(installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User choice: ${outcome}`);
            deferredPrompt = null; 
            installBtn.style.display = 'none';
        });
    }

    window.addEventListener('appinstalled', () => {
        if(installBtn) installBtn.style.display = 'none';
        console.log('تم التثبيت بنجاح تام!');
    });

    // ========================================================
    // 3. تشغيل الميزات وتوليد الأزرار عند تحميل الصفحة
    // ========================================================
    function initAll() {
        initWindowPersistence();
        createRefreshButton(); // توليد الزر بمجرد جاهزية الصفحة
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
})();
