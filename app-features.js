    function restoreWindowState() {
        const saved = localStorage.getItem(WINDOW_STORAGE_KEY);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                // تم تقليل الحد الأدنى للعرض والارتفاع هنا إلى 300 بكسل ليقبل مقاسك (330×500)
                if (state.width && state.height && state.width >= 300 && state.width < 2000 && state.height >= 300 && state.height < 2000) {
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
            // تم تعديل المقاس الافتراضي المبدئي ليكون المقاس المقرب الذي تفضله
            window.resizeTo(330, 500); 
            document.title = 'التقويم الإسلامي - 330×500'; 
        }
        window.addEventListener('resize', () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveWindowState, 500); });
        window.addEventListener('move', () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveWindowState, 500); });
        window.addEventListener('beforeunload', saveWindowState);
    }
