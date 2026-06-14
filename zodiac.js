/**
 * Zodiac Module for ICPWA
 * حساب الأبراج وعناصرها وكواكبها
 * 
 * كيفية الاستخدام:
 * const zodiac = getZodiac(date);
 * console.log(zodiac.name, zodiac.symbol, zodiac.element, zodiac.planet);
 */

// ======================== بيانات الأبراج ========================
const ZODIAC_DATA = [
    { name: 'الجدي',    symbol: '♑', from: [12,22], to: [1,19],  element: 'ترابي',  planet: 'زحل'     },
    { name: 'الدلو',    symbol: '♒', from: [1,20],  to: [2,18],  element: 'هوائي',  planet: 'أورانوس' },
    { name: 'الحوت',    symbol: '♓', from: [2,19],  to: [3,20],  element: 'مائي',   planet: 'نبتون'   },
    { name: 'الحمل',    symbol: '♈', from: [3,21],  to: [4,19],  element: 'ناري',   planet: 'المريخ'  },
    { name: 'الثور',    symbol: '♉', from: [4,20],  to: [5,20],  element: 'ترابي',  planet: 'الزهرة'  },
    { name: 'الجوزاء',  symbol: '♊', from: [5,21],  to: [6,20],  element: 'هوائي',  planet: 'عطارد'   },
    { name: 'السرطان',  symbol: '♋', from: [6,21],  to: [7,22],  element: 'مائي',   planet: 'القمر'   },
    { name: 'الأسد',    symbol: '♌', from: [7,23],  to: [8,22],  element: 'ناري',   planet: 'الشمس'   },
    { name: 'العذراء',  symbol: '♍', from: [8,23],  to: [9,22],  element: 'ترابي',  planet: 'عطارد'   },
    { name: 'الميزان',  symbol: '♎', from: [9,23],  to: [10,22], element: 'هوائي',  planet: 'الزهرة'  },
    { name: 'العقرب',   symbol: '♏', from: [10,23], to: [11,21], element: 'مائي',   planet: 'المريخ'  },
    { name: 'القوس',    symbol: '♐', from: [11,22], to: [12,21], element: 'ناري',   planet: 'المشتري' }
];

const ELEMENT_EMOJI = {
    'ترابي': '🌍',
    'هوائي': '💨',
    'مائي': '💧',
    'ناري': '🔥'
};

// ======================== الدوال الرئيسية ========================

/**
 * حساب البرج بناءً على التاريخ
 * @param {Date} date - التاريخ
 * @returns {Object} البرج مع تفاصيله
 */
function getZodiac(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    for (const zodiac of ZODIAC_DATA) {
        const [fromMonth, fromDay] = zodiac.from;
        const [toMonth, toDay] = zodiac.to;
        
        // حالة عادية (من شهر إلى شهر أكبر)
        if (fromMonth <= toMonth) {
            if ((month === fromMonth && day >= fromDay) || 
                (month === toMonth && day <= toDay)) {
                return zodiac;
            }
        } 
        // حالة البرج الذي يعبر نهاية السنة (مثل الجدي)
        else {
            if ((month === fromMonth && day >= fromDay) ||
                (month === toMonth && day <= toDay) ||
                (month > fromMonth) || (month < toMonth)) {
                return zodiac;
            }
        }
    }
    
    return ZODIAC_DATA[0];
}

/**
 * الحصول على رمز البرج (Emoji + اسم)
 * @param {Date} date 
 * @returns {string}
 */
function getZodiacSymbol(date) {
    const zodiac = getZodiac(date);
    return `${zodiac.symbol} ${zodiac.name}`;
}

/**
 * الحصول على معلومات البرج كنص HTML
 * @param {Date} date 
 * @returns {string}
 */
function getZodiacHTML(date) {
    const z = getZodiac(date);
    const elemEmoji = ELEMENT_EMOJI[z.element] || '⭐';
    return `
        <div style="font-size:12px; color:#1a3a6b; font-weight:700; margin-bottom:4px;">
            ✨ مواليد هذا اليوم:
        </div>
        ${z.symbol} <strong>برج ${z.name}</strong> &nbsp;|&nbsp;
        ${elemEmoji} ${z.element} &nbsp;|&nbsp;
        🪐 كوكب ${z.planet}
    `;
}

/**
 * الحصول على معلومات البرج كنص عادي
 * @param {Date} date 
 * @returns {string}
 */
function getZodiacText(date) {
    const z = getZodiac(date);
    return `برج ${z.name} ${z.symbol} - ${z.element} - كوكب ${z.planet}`;
}

// ======================== تصدير الوظائف ========================
window.ICPWAZodiac = {
    getZodiac: getZodiac,
    getSymbol: getZodiacSymbol,
    getHTML: getZodiacHTML,
    getText: getZodiacText,
    elements: ELEMENT_EMOJI
};
