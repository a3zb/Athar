// Tafsir Logic using GitHub Raw JSONs (Via jsDelivr CDN)
// Repository: spa5k/tafsir_api

// Smart Slug Resolver: Handles spelling variations (tafsir vs tafseer)
const TAFSIR_SLUGS = {
    'moyassar': ['ar-tafsir-muyassar', 'ar-tafseer-muyassar'],
    'saadi': ['ar-tafseer-al-saddi', 'ar-tafseer-al-saadi', 'ar-tafsir-al-saadi'],
    'tabari': ['ar-tafsir-al-tabari', 'ar-tafseer-al-tabari'],
    'qurtubi': ['ar-tafseer-al-qurtubi', 'ar-tafsir-al-qurtubi'],
    'baghawi': ['ar-tafsir-al-baghawi', 'ar-tafseer-al-baghawi'],
    'ibnkathir': ['ar-tafsir-ibn-kathir', 'ar-tafseer-ibn-kathir'],
    'jalalayn': ['ar-tafsir-al-jalalayn', 'ar-tafseer-al-jalalayn']
};

// Initialize Global State if not already set
window.currentTafsirSource = window.currentTafsirSource || 'ibnkathir';
window.tafsirCache = window.tafsirCache || {};

async function fetchTafsirData(surahNum, verseNum) {
    const verseKey = `${surahNum}:${verseNum}`;
    const tafsirFooter = document.querySelector('.tafsir-footer p');
    const tafsirBody = document.getElementById('tafsirBody');
    const source = window.currentTafsirSource || 'moyassar';

    // 1. Check Local Files
    if (source === 'ibnkathir') {
        const localData = window.localIbnKathirData;
        if (localData && localData[verseKey]) {
            if (tafsirFooter) tafsirFooter.textContent = "المصدر: تفسير ابن كثير (محلي)";
            tafsirBody.innerHTML = `<p>${localData[verseKey]}</p>`;
            return;
        }
    }

    // 2. GitHub Raw JSONs (Auto-Fallback Logic)
    let slugs = TAFSIR_SLUGS[source] || ['ar-tafsir-muyassar'];
    let sourceName = document.querySelector(`#tafsirSelect option[value="${source}"]`)?.text || "التفسير";

    // Clean source name
    sourceName = sourceName.replace('(محلي)', '').trim();

    if (tafsirFooter) tafsirFooter.textContent = `المصدر: ${sourceName} (جار التحميل...)`;

    // Check Cache specifically for current source slugs
    let cachedData = null;
    let usedSlug = null;

    // We iterate ONLY through the slugs valid for the CURRENT source
    for (const s of slugs) {
        const key = `tafsir_v3_${s}_${surahNum}`;
        // Verify key exists and data is valid
        if (window.tafsirCache && window.tafsirCache[key]) {
            cachedData = window.tafsirCache[key];
            usedSlug = s;
            console.log(`Cache HIT for ${s}`);
            break;
        }
    }

    try {
        if (cachedData) {
            displayTafsirText(cachedData, verseNum, tafsirBody, sourceName);
            if (tafsirFooter) tafsirFooter.textContent = `المصدر: ${sourceName}`;
        } else {
            // Need to fetch
            tafsirBody.innerHTML = `
                <div class="tafsir-loading" style="text-align:center; padding:20px;">
                    <div class="spinner" style="margin:0 auto 10px;"></div>
                    <p style="opacity:0.8;">جاري تحميل ${sourceName}...</p>
                </div>
            `;

            let json = null;
            let successSlug = null;

            // Try Slugs sequentially until one works
            for (const slug of slugs) {
                try {
                    const url = `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/${slug}/${surahNum}.json`;
                    console.log(`Trying URL: ${url}`);
                    const response = await fetch(url);
                    if (response.ok) {
                        json = await response.json();
                        successSlug = slug;
                        break; // Found it!
                    }
                } catch (e) { console.warn(`Failed slug ${slug}`, e); }
            }

            if (!json) throw new Error("لم يتم العثور على ملف التفسير في المصدر.");

            // Process Data
            const surahData = {};
            let versesArray = [];

            if (json.rahma) versesArray = json.rahma;
            else if (json.result) versesArray = json.result;
            else if (json.ayahs) versesArray = json.ayahs;
            else if (Array.isArray(json)) versesArray = json;

            versesArray.forEach(item => {
                const num = item.aya || item.ayah || item.number || item.index || item.numberInSurah;
                const txt = item.text || item.tafsir;
                if (num) surahData[num] = txt;
            });

            // Cache it
            if (!window.tafsirCache) window.tafsirCache = {};
            window.tafsirCache[`tafsir_v3_${successSlug}_${surahNum}`] = surahData;

            displayTafsirText(surahData, verseNum, tafsirBody, sourceName);
            if (tafsirFooter) tafsirFooter.textContent = `المصدر: ${sourceName}`;
        }

    } catch (error) {
        console.error("Error fetching tafsir:", error);
        tafsirBody.innerHTML = `
            <div style="text-align:center; padding:20px; color:#f44336;">
                <i class="fas fa-exclamation-circle" style="font-size:2rem; margin-bottom:10px;"></i>
                <p>عذراً، فشل تحميل التفسير.</p>
                <div style="font-size:0.8rem; margin-top:5px; opacity:0.7">تأكد من اتصال الإنترنت</div>
                <button onclick="fetchTafsirData(${surahNum}, ${verseNum})" class="reset-btn" style="margin-top:10px;">إعادة المحاولة</button>
            </div>
        `;
    }
}

function displayTafsirText(data, verseNum, container, sourceName) {
    const vNum = parseInt(verseNum);
    if (data[vNum]) {
        container.innerHTML = `<p>${data[vNum]}</p>`;
    } else if (data[verseNum]) {
        container.innerHTML = `<p>${data[verseNum]}</p>`;
    } else {
        container.innerHTML = `<p style="color:orange; text-align:center;">لا يوجد تفسير لهذه الآية في ${sourceName}</p>`;
    }
}

// --- Tafsir Tools Features ---
let currentTafsirFontSize = 1.45; // in rem

// Run when DOM is ready (or check via Interval as this script loads late)
function initTafsirTools() {
    const zoomInBtn = document.getElementById('fontIncreaseBtn');
    const zoomOutBtn = document.getElementById('fontDecreaseBtn');
    const tafsirBody = document.getElementById('tafsirBody');
    const copyBtn = document.getElementById('copyTafsirBtn');

    if (zoomInBtn && zoomOutBtn) {
        // Prevent Adding double listeners
        zoomInBtn.replaceWith(zoomInBtn.cloneNode(true));
        zoomOutBtn.replaceWith(zoomOutBtn.cloneNode(true));

        const newZoomIn = document.getElementById('fontIncreaseBtn');
        const newZoomOut = document.getElementById('fontDecreaseBtn');

        newZoomIn.addEventListener('click', () => {
            if (currentTafsirFontSize < 2.5) {
                currentTafsirFontSize += 0.15;
                tafsirBody.style.fontSize = `${currentTafsirFontSize}rem`;
            }
        });

        newZoomOut.addEventListener('click', () => {
            if (currentTafsirFontSize > 1.0) {
                currentTafsirFontSize -= 0.15;
                tafsirBody.style.fontSize = `${currentTafsirFontSize}rem`;
            }
        });
    }

    if (copyBtn) {
        copyBtn.replaceWith(copyBtn.cloneNode(true));
        const newCopyBtn = document.getElementById('copyTafsirBtn');

        newCopyBtn.addEventListener('click', async () => {
            const textToCopy = tafsirBody.innerText;
            if (!textToCopy || textToCopy.includes('جاري تحميل') || textToCopy.length < 5) return;

            try {
                await navigator.clipboard.writeText(textToCopy);

                // Visual Feedback
                const originalIcon = newCopyBtn.innerHTML;
                newCopyBtn.innerHTML = '<i class="fas fa-check" style="color: #4caf50;"></i>';
                newCopyBtn.style.borderColor = '#4caf50';

                setTimeout(() => {
                    newCopyBtn.innerHTML = originalIcon;
                    newCopyBtn.style.borderColor = '';
                }, 2000);

            } catch (err) {
                console.error('Failed to copy!', err);
                if (window.showPointToast) showPointToast(0, 'تم التحديد، يمكنك النسخ (Ctrl+C)');
            }
        });
    }
}

// Call init when script loads (it's at the end of body)
initTafsirTools();

// Add Selection Listener
const tafsirSelect = document.getElementById('tafsirSelect');
if (tafsirSelect) {
    tafsirSelect.value = window.currentTafsirSource;
    tafsirSelect.addEventListener('change', (e) => {
        window.currentTafsirSource = e.target.value;
        const tafsirBody = document.getElementById('tafsirBody');
        const tafsirVerseRef = document.getElementById('tafsirVerseRef');

        if (tafsirBody) {
            tafsirBody.innerHTML = `
                <div class="tafsir-loading" style="text-align:center; padding:20px;">
                    <div class="spinner" style="margin:0 auto 10px;"></div>
                    <p style="opacity:0.8;">جاري تحميل التفسير الجديد...</p>
                </div>
            `;
        }

        if (tafsirVerseRef) {
            const ref = tafsirVerseRef.textContent.split(':');
            if (ref.length === 2) {
                fetchTafsirData(ref[0], ref[1]);
            }
        }
    });
}
// Also call it when drawer opens (just in case)
/* The drawer open logic is in script.js, but since elements are static in HTML, 
   initializing once here is usually enough unless buttons are re-created. */

// --- Tafsir Offline Download Logic ---
async function downloadCurrentTafsir() {
    const source = window.currentTafsirSource || 'moyassar';
    const slugs = TAFSIR_SLUGS[source];
    if (!slugs || slugs.length === 0) {
        if (window.showPointToast) showPointToast(0, "هذا المصدر غير متاح للتحميل حالياً.");
        return;
    }

    const slug = slugs[0]; // Use the primary slug
    const downloadBtn = document.getElementById('downloadTafsirBtn');
    const originalIcon = downloadBtn.innerHTML;

    if (!confirm(`هل تريد تحميل تفسير ${source} كاملاً (114 سورة) للاستخدام بدون إنترنت؟ قد يستغرق هذا بضع دقائق.`)) {
        return;
    }

    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    let progress = 0;
    const total = 114;

    // Create a progress toast if function exists
    if (window.showPointToast) {
        window.showPointToast(0, `جاري بدء تحميل تفسير ${source}...`);
    }

    try {
        for (let i = 1; i <= total; i++) {
            const url = `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/${slug}/${i}.json`;

            // Fetch will trigger SW to cache it
            await fetch(url).catch(e => console.warn(`Failed to pre-cache surah ${i}`, e));

            progress++;
            if (i % 10 === 0 || i === total) {
                console.log(`Tafsir Download Progress: ${Math.round((progress / total) * 100)}%`);
                if (window.showPointToast && i % 30 === 0) {
                    window.showPointToast(0, `تم تحميل ${i} سورة من التفسير...`);
                }
            }

            // Batch delay every 5 surahs to be safe
            if (i % 5 === 0) {
                await new Promise(r => setTimeout(r, 800));
            }
        }

        downloadBtn.innerHTML = '<i class="fas fa-check-double" style="color: #4caf50;"></i>';
        if (window.showPointToast) {
            window.showPointToast(50, `تم تحميل التفسير كاملاً بنجاح! يمكنك الآن استخدامه أوفلاين.`);
        } else {
            alert("تم تحميل التفسير كاملاً بنجاح!");
        }

    } catch (error) {
        console.error("Tafsir download error:", error);
        downloadBtn.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>';
        alert("حدث خطأ أثناء التحميل. يرجى التأكد من الاتصال والمحاولة لاحقاً.");
    } finally {
        setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalIcon;
        }, 5000);
    }
}

// Ensure it's available globally
window.downloadCurrentTafsir = downloadCurrentTafsir;

// Explicitly define closeTafsir globally here to ensure availability
window.closeTafsir = function () {
    const drawer = document.getElementById('tafsirDrawer');
    if (drawer) {
        drawer.classList.remove('active');
    }
};
