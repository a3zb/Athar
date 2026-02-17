// DOM Elements
const homePage = document.getElementById('homePage');
const songDetailPage = document.getElementById('songDetailPage');
const playerPage = document.getElementById('playerPage');
const songListElement = document.getElementById('songList');
const searchInput = document.getElementById('searchInput');

// --- Force Sort Songs Array by ID (Quranic Order) ---
// This ensures everything is sequential from the moment the script runs
if (typeof songs !== 'undefined' && Array.isArray(songs)) {
    songs.sort((a, b) => Number(a.id) - Number(b.id));
    console.log("Global songs array sorted by ID.");
}

const readingPage = document.getElementById('readingPage');
const readingContent = document.getElementById('readingContent');
const readingSurahTitle = document.getElementById('readingSurahTitle');
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const navFavorites = document.getElementById('navFavorites');
const navSettings = document.getElementById('navSettings');
const navHome = document.getElementById('navHome');
const navHadith = document.getElementById('navHadith');
const navPrayer = document.getElementById('navPrayer');
const navAdhkar = document.getElementById('navAdhkar');
const settingsPage = document.getElementById('settingsPage');
const backToHomeFromSettingsBtn = document.getElementById('backToHomeFromSettingsBtn');
const btnShowHowTo = document.getElementById('btnShowHowTo');
const btnShowContact = document.getElementById('btnShowContact');
const syncPage = document.getElementById('syncPage');
const backFromSyncBtn = document.getElementById('backFromSyncBtn');
const markVerseBtn = document.getElementById('markVerseBtn');
const syncSurahTitle = document.getElementById('syncSurahTitle');
const syncCurrentVerseNum = document.getElementById('syncCurrentVerseNum');
const syncTotalVerses = document.getElementById('syncTotalVerses');
const syncVerseText = document.getElementById('syncVerseText');
const syncNextVerseText = document.getElementById('syncNextVerseText');
const syncStepBackBtn = document.getElementById('syncStepBackBtn');
const syncPlayPauseBtn = document.getElementById('syncPlayPauseBtn');
const syncSeekBackBtn = document.getElementById('syncSeekBackBtn');
const syncResultArea = document.getElementById('syncResultArea');
const syncOutputJson = document.getElementById('syncOutputJson');
const copySyncResult = document.getElementById('copySyncResult');

let syncCurrentIndex = 0;
let syncData = [];
let isSyncing = false;

const backToHomeFromDetailBtn = document.getElementById('backToHomeFromDetailBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn'); // Back button from player to home
const bodyElement = document.body;

const backgroundVideoContainer = document.querySelector('.video-background-container');
const backgroundVideo = document.getElementById('backgroundVideo');

// Elements for Song Detail Page - REMOVED (page not used in current version)
// const detailAlbumArt = document.getElementById('detailAlbumArt');
// const detailTrackTitle = document.getElementById('detailTrackTitle');
// const detailTrackArtist = document.getElementById('detailTrackArtist');
// const detailAlbumName = document.getElementById('detailAlbumName');
// const playFromDetailBtn = document.getElementById('playFromDetailBtn');

const audioPlayer = document.getElementById('audioPlayer');
const albumArtPlayer = document.getElementById('albumArt');
const playerTrackTitle = document.getElementById('playerTrackTitle');
const playerTrackArtist = document.getElementById('playerTrackArtist');
const lyricsContainer = document.getElementById('lyricsContainer');

const playerProgressBarContainer = document.getElementById('playerProgressBarContainer');
const playerProgressBar = document.getElementById('playerProgressBar');
const playerCurrentTime = document.getElementById('playerCurrentTime');
const playerTotalDuration = document.getElementById('playerTotalDuration');

const playerPrevBtn = document.getElementById('playerPrevBtn');
const playerPlayPauseBtn = document.getElementById('playerPlayPauseBtn');
const playerNextBtn = document.getElementById('playerNextBtn');
const playerRepeatBtn = document.getElementById('playerRepeatBtn');
const playerShuffleBtn = document.getElementById('playerShuffleBtn');
const playerVolumeSlider = document.getElementById('playerVolumeSlider');
// --- Bookmarks UI elements ---
const addBookmarkBtn = document.getElementById('addBookmarkBtn');
const toggleBookmarksBtn = document.getElementById('toggleBookmarksBtn');
const bookmarksPanel = document.getElementById('bookmarksPanel');
const bookmarksList = document.getElementById('bookmarksList');
const closeBookmarksBtn = document.getElementById('closeBookmarksBtn');
// --- Favorite Surah button ---
const favoriteSurahBtn = document.getElementById('favoriteSurahBtn');
// --- Right action bar buttons ---
const actionFavoritesBtn = document.getElementById('actionFavorites');
const actionHowToBtn = document.getElementById('actionHowTo');
const actionContactBtn = document.getElementById('actionContact');
const helpContent = document.getElementById('helpContent');
const contactContent = document.getElementById('contactContent');
const closeHelpBtn = document.querySelector('.close-help');
const closeContactBtn = document.querySelector('.close-contact');
const downloadSurahBtn = document.getElementById('downloadSurahBtn');

// --- Tafsir UI Elements ---
const tafsirDrawer = document.getElementById('tafsirDrawer');
const tafsirBody = document.getElementById('tafsirBody');
const tafsirVerseRef = document.getElementById('tafsirVerseRef');
const hadithPage = document.getElementById('hadithPage');
const closeTafsirBtn = document.getElementById('closeTafsirBtn');

// App State
// --- Player State (restored) ---
let currentSongIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 2; // Default to 2: Repeat All (Sequential Loop)
let currentReadingIndex = 0;
let currentPlayingSongId = null;
window.localIbnKathirData = null;
// (currentTafsirSource now managed in tafsir_logic.js)

const playerSkipBackBtn = document.getElementById('playerSkipBackBtn');
const playerSkipForwardBtn = document.getElementById('playerSkipForwardBtn');
const decreaseLyricsFont = document.getElementById('decreaseLyricsFont');
const increaseLyricsFont = document.getElementById('increaseLyricsFont');
const lyricsFontSizeValue = document.getElementById('lyricsFontSizeValue');
let lyricsFontSize = 100;

let totalQuranVerses = 0;
let khatmahPlan = null; // { days: number, dailyTarget: number, startDate: timestamp, currentDay: number }
let allVersesFlat = []; // Cached flat list of verses: { surahIndex, verseIndex, text }
// Favorite-only filter state (since the checkbox under search was removed)
let favoriteOnlyState = false;

let adhkarData = {};

async function loadAdhkarData() {
    try {
        const response = await fetch('adkar.json');
        adhkarData = await response.json();
        console.log("✅ Adhkar data loaded successfully");
    } catch (error) {
        console.error("❌ Error loading adhkar.json:", error);
    }
}
loadAdhkarData();



// Helper to check if a URL is cached (Checks multiple caches)
async function isUrlCached(url) {
    if (!('caches' in window)) return false;
    const cacheNames = ['quran-media-cache', 'athar-v1'];
    for (const name of cacheNames) {
        const cache = await caches.open(name);
        const response = await cache.match(url);
        if (response) return true;
    }
    return false;
}

// Function to update the download button UI based on cache status
async function updateDownloadButtonUI() {
    const downloadBtn = document.getElementById('downloadSurahBtn');
    if (!downloadBtn) return;

    const currentSong = songs[currentSongIndex];
    if (!currentSong || !currentSong.audioSrc) return;

    const cached = await isUrlCached(currentSong.audioSrc);

    // Always use the same download icon for uniform look
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.style.color = ""; // Match other buttons exactly

    if (cached) {
        downloadBtn.title = "هذه السورة محملة بالفعل";
        // Optionally add a subtle state class if needed later, but keep color/icon same as requested
    } else {
        downloadBtn.title = "تحميل للاستماع بدون إنترنت";
    }
}

// Listen for messages from Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.action === 'download-complete') {
            console.log('Download complete reported by SW:', event.data.url);
            updateDownloadButtonUI();
            if (typeof showPointToast === 'function') {
                showPointToast(10, "تم تحميل السورة بنجاح! يمكنك الآن الاستماع لها بدون إنترنت.");
            }
        }
    });
}
// Background Pre-caching for Offline Mode (Improved Robustness)
async function preCacheOfflineContent() {
    if (!('serviceWorker' in navigator)) return;

    console.log("🌙 Starting robust background pre-cache...");

    // 1. Core Data Files
    const coreData = ['/adkar.json', '/data.js', '/favicon.png'];

    // 2. Pre-cache all Hadith Books from config in hadiths_logic.js if possible
    const hadithBooks = [
        'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nawawi.json',
        'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.json',
        'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-muslim.json',
        'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-abudawud.json',
        'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-tirmidhi.json',
        'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-nasai.json',
        'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-ibnmajah.json'
    ];

    // 3. Essential Tafsirs
    const EssentialTafsirs = ['ar-tafsir-al-jalalayn', 'ar-tafsir-muyassar'];
    const tafsirUrls = [];
    for (const slug of EssentialTafsirs) {
        for (let i = 1; i <= 20; i++) { // Increase to 20 surahs (including most common short ones)
            tafsirUrls.push(`https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/${slug}/${i}.json`);
        }
    }

    const allUrls = [...coreData, ...hadithBooks, ...tafsirUrls];

    // Process with better parallel handling
    const batchSize = 5;
    for (let i = 0; i < allUrls.length; i += batchSize) {
        const batch = allUrls.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(async url => {
            const cached = await isUrlCached(url);
            if (!cached) {
                // Fetch and let Service Worker store it
                return fetch(url, { mode: 'no-cors' }).catch(() => { });
            }
        }));
        // Small delay to prevent network saturation
        if (i % 15 === 0) await new Promise(r => setTimeout(r, 800));
    }

    console.log("✅ Background text pre-cache verified.");
}

// Master Background Sync: Downloads everything (Audio + Hadith + Tafsir)
async function startMasterOfflineSync() {
    if (!('serviceWorker' in navigator)) {
        if (window.showPointToast) showPointToast(0, "متصفحك لا يدعم نظام الأوفلاين حالياً.");
        return;
    }

    const startBtn = document.getElementById('startMasterSyncBtn');
    const wrapper = document.getElementById('masterSyncProgressWrapper');
    const progressBar = document.getElementById('masterSyncProgressBar');
    const statusText = document.getElementById('masterSyncStatus');

    // Check if already completed and user just clicked again
    if (localStorage.getItem('master_sync_complete') === 'true') {
        if (!confirm("لقد قمت بتحميل المصحف كاملاً بالفعل. هل تريد التحقق من الملفات وإعادة تحميل الناقص منها؟")) {
            return;
        }
    }

    if (!confirm("هل تريد تحميل المصحف كاملاً (كل السور) مع الأحاديث والتفاسير للاستخدام بدون إنترنت؟ سيتم التحميل في الخلفية.")) {
        return;
    }

    startBtn.style.display = 'none';
    wrapper.style.display = 'block';

    statusText.textContent = "جاري تحضير البيانات...";

    // 1. Pre-cache basic text data
    await preCacheOfflineContent();

    // 2. Download Media Assets (Sequential batches for stability)
    const totalItems = songs.length;
    let completed = 0;

    for (let i = 0; i < totalItems; i++) {
        const song = songs[i];
        const assets = [];
        if (song.audioSrc) assets.push(song.audioSrc);
        if (song.videoBgSrc) assets.push(song.videoBgSrc);

        statusText.textContent = `جاري تحميل سورة ${song.title} ومحتوياتها...`;

        // Send assets to SW queue instead of fetching directly
        for (const url of assets) {
            if (!navigator.serviceWorker.controller) continue;

            navigator.serviceWorker.controller.postMessage({
                action: 'download',
                url: url
            });

            // Wait for confirmation or timeout
            await new Promise(resolve => {
                const handler = (e) => {
                    if (e.data.url === url) {
                        navigator.serviceWorker.removeEventListener('message', handler);
                        resolve();
                    }
                };
                navigator.serviceWorker.addEventListener('message', handler);
                // Safety timeout: proceed after 10s even if no confirmation (don't block queue)
                setTimeout(() => {
                    navigator.serviceWorker.removeEventListener('message', handler);
                    resolve();
                }, 10000);
            });
        }

        completed++;
        const percent = Math.round((completed / totalItems) * 100);
        progressBar.style.width = `${percent}%`;

        // Batch control to prevent crashing the browser's network stack
        if (i % 2 === 0) await new Promise(r => setTimeout(r, 300));
    }

    localStorage.setItem('master_sync_complete', 'true');
    statusText.innerHTML = '✅ تم تحميل المصحف كاملاً بنجاح!';
    if (typeof showPointToast === 'function') {
        showPointToast(100, "تم تحميل التطبيق كاملاً بنجاح! يمكنك الآن استخدامه في أي مكان بدون إنترنت.");
    }
    setTimeout(() => {
        wrapper.style.display = 'none';
        startBtn.style.display = 'flex';
        startBtn.innerHTML = '<i class="fas fa-check-circle"></i> <span>تم التحميل</span>';
        startBtn.style.borderColor = '#4caf50';
        startBtn.style.background = 'rgba(76, 175, 80, 0.1)';
        startBtn.style.color = '#4caf50';
    }, 3000);
}

let isNavigating = false;

function navigateTo(pageId, options = {}) {
    if (isNavigating || !document.getElementById(pageId)) return;
    isNavigating = true;

    const currentActivePage = document.querySelector('.page.active');
    const targetPage = document.getElementById(pageId);

    // Toggle Reading Mode class for UI overrides
    document.body.classList.toggle('reading-mode-active', pageId === 'readingPage');

    // If same page, just close sidebar
    if (currentActivePage === targetPage) {
        closeSidebar();
        isNavigating = false;
        return;
    }

    // Handle History/Hash
    if (!options.isBack) {
        let hash = pageId;
        if (options.surahId) hash += `?surah=${options.surahId}`;
        if (options.verseNum) hash += `&verse=${options.verseNum}`;
        if (options.bookKey) hash += `?book=${options.bookKey}`;

        window.location.hash = hash;
    }

    // Transition Logic
    if (currentActivePage) {
        currentActivePage.classList.add('exiting');
        currentActivePage.classList.remove('active');

        setTimeout(() => {
            currentActivePage.classList.remove('exiting');
            currentActivePage.style.display = 'none';

            showTargetPage(targetPage, pageId, options);
        }, 400); // Match CSS transition duration
    } else {
        showTargetPage(targetPage, pageId, options);
    }
}

function showTargetPage(targetPage, pageId, options) {
    targetPage.style.display = 'block';
    // Trigger reflow for animation
    targetPage.offsetHeight;
    targetPage.classList.add('active');

    // Sidebar/BG handling
    handlePageStyles(pageId);
    if (!options.keepSidebar) closeSidebar();

    // Highlight Menu Item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.id === `nav${pageId.charAt(0).toUpperCase() + pageId.slice(1).replace('Page', '')}`) {
            item.classList.add('active');
        }
    });

    // Update Bottom Navigation Active State
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        // Simple check: does the onclick attribute contain the pageId?
        if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${pageId}'`)) {
            item.classList.add('active');
        }
    });

    // Call specific page initializers if needed
    if (pageId === 'hadithPage' && typeof loadHadiths === 'function') {
        // Only load if not already loaded or if specific book requested
        if (options.bookKey) loadHadiths(options.bookKey);
    }

    setTimeout(() => { isNavigating = false; }, 400);
}

/**
 * Handle Routing / Deep Linking
 */
function handleRouting() {
    const hash = window.location.hash.substring(1) || 'homePage';
    const [pageId, queryStr] = hash.split('?');
    const params = new URLSearchParams(queryStr);

    const surahId = params.get('surah');
    const verseNum = params.get('verse');
    const bookKey = params.get('book');

    if (pageId === 'readingPage' && surahId) {
        const surah = songs.find(s => s.id == surahId);
        if (surah) {
            openReadingSurah(surah, verseNum);
            return;
        }
    }

    if (pageId === 'playerPage' && surahId) {
        const sIdx = songs.findIndex(s => s.id == surahId);
        if (sIdx !== -1) {
            currentSongIndex = sIdx;
            loadSong(songs[sIdx]);
            if (params.get('play')) playTrack();
        }
    }

    if (pageId === 'hadithPage' && bookKey) {
        navigateTo('hadithPage', { bookKey: bookKey, isBack: true });
        return;
    }

    // Default navigation
    if (document.getElementById(pageId)) {
        navigateTo(pageId, { isBack: true });
    }
}

// Listen for hash changes
window.addEventListener('hashchange', () => {
    // Only route if we are not already navigating via navigateTo
    if (!isNavigating) handleRouting();
});

function handlePageStyles(pageId) {
    bodyElement.classList.remove('player-active-bg', 'detail-active-bg');
    backgroundVideoContainer.classList.remove('active');

    if (pageId === 'playerPage') {
        bodyElement.classList.add('player-active-bg');
        backgroundVideoContainer.classList.add('active');
    } else if (pageId === 'homePage') {
        // Home page special handling if needed
    }
}

// Handle Browser Back/Forward buttons
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        const currentActive = document.querySelector('.page.active');
        if (!currentActive || currentActive.id !== hash) {
            navigateTo(hash, { isBack: true });
        }
    } else if (!hash) {
        navigateTo('homePage', { isBack: true });
    }
});

// Initial Load Handling
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        if (hash === 'readingPage') {
            showReadingPageList();
        } else {
            navigateTo(hash);
        }
    } else {
        navigateTo('homePage');
    }

    // Restore Verse of the Day
    initDailyVerse();
});

async function initDailyVerse() {
    const container = document.getElementById('dailyVerseContainer');
    const textEl = document.getElementById('dailyVerseText');
    const sourceEl = document.getElementById('dailyVerseSource');
    const hijriEl = document.getElementById('dailyDateHijri');
    if (!container || !textEl || !sourceEl) return;

    if (allVersesFlat.length === 0) flattenVerses();
    if (allVersesFlat.length === 0) return;

    const randomIndex = Math.floor(Math.random() * allVersesFlat.length);
    const verse = allVersesFlat[randomIndex];

    textEl.textContent = verse.text;
    sourceEl.textContent = `سورة ${verse.surahTitle} - آية ${verse.verseIndex + 1}`;
    container.style.display = 'block';

    // Update Hijri Date Safely in background
    try {
        const now = new Date();
        const resp = await fetch(`https://api.aladhan.com/v1/gToH/${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`);
        const hijriData = await resp.json();
        if (hijriData.status === 'OK' && hijriEl) {
            const h = hijriData.data.hijri;
            hijriEl.textContent = `${h.day} ${h.month.ar} ${h.year} هـ`;
        }
    } catch (e) {
        console.warn("Could not update Hijri date (offline)", e);
    }

    // Button handlers
    document.getElementById('playDailyVerseBtn').onclick = (e) => {
        e.stopPropagation();
        currentSongIndex = verse.surahIndex;
        loadSong(songs[currentSongIndex]);
        playTrack();
        showPlayerPage();
    };
    document.getElementById('tafsirDailyVerseBtn').onclick = (e) => {
        e.stopPropagation();
        openTafsir(songs[verse.surahIndex].id, verse.verseIndex + 1);
    };
    document.getElementById('copyDailyVerseBtn').onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`${verse.text} [سورة ${verse.surahTitle}: ${verse.verseIndex + 1}]`);
        if (window.showPointToast) showPointToast(0, "تم نسخ الآية الكريمة");
    };
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active', 'exiting');
        p.style.display = 'none';
    });
}

// Side Menu Listeners are handled at the bottom of the script for proper initialization order
// Khatmah navigation removed

function showSettingsPage() {
    navigateTo('settingsPage');
}

function showSyncPage() {
    navigateTo('syncPage');
    isSyncing = true;
    startSyncMode();
}

function showHomePage() {
    const topNavBar = document.querySelector('.top-nav');
    if (topNavBar) topNavBar.style.display = 'flex';
    navigateTo('homePage');
}

// --- New Reading Page Logic ---

const readingListView = document.getElementById('readingListView');
const readingDetailView = document.getElementById('readingDetailView');
const readingSurahListElement = document.getElementById('readingSurahList');
const readingSearchInput = document.getElementById('readingSearchInput');
let clickTimer = null; // For handling single vs double click

// 1. Show the Surah List (Enhanced with Choice View)
function showReadingPageList() {
    navigateTo('readingPage');

    const choiceView = document.getElementById('readingChoiceView');
    const listView = document.getElementById('readingListView');
    const detailView = document.getElementById('readingDetailView');

    // If an active Khatmah plan exists, show the choice screen first
    if (khatmahPlan && choiceView) {
        choiceView.style.display = 'block';
        if (listView) listView.style.display = 'none';
        if (detailView) detailView.style.display = 'none';
    } else {
        // Normal flow
        if (choiceView) choiceView.style.display = 'none';
        if (listView) listView.style.display = 'block';
        if (detailView) detailView.style.display = 'none';

        // Safety check and render
        if (typeof songs !== 'undefined' && Array.isArray(songs) && songs.length > 0) {
            renderReadingSurahList(songs);
        }
    }

    updateKhatmahUI(); // Ensure planner state is reflected
}



// 2. Render List with Search
function renderReadingSurahList(listToRender) {
    readingSurahListElement.innerHTML = '';

    // Sort by ID to ensure Quran order
    const sortedList = [...listToRender].sort((a, b) => Number(a.id) - Number(b.id));

    sortedList.forEach((surah, index) => {
        const li = document.createElement('li');
        // listItem.setAttribute('data-id', surah.id); // Optional, good for debugging

        li.innerHTML = `
            <img src="${surah.albumArtUrl || 'favicon.png'}" alt="${surah.title}" class="song-art-list">
            <div class="song-info-list">
                <h3>${surah.title}</h3>
                <p>${surah.lyrics ? surah.lyrics.length : 0} آية</p>
            </div>
            ${isLastRead(surah.id) ? '<div class="card-progress-bar" style="bottom:0; width:100%; height:3px; background:#a855f7; position:absolute;"></div>' : ''}
        `;
        li.style.animationDelay = `${index * 0.05}s`; // Add same animation
        li.onclick = () => openReadingSurah(surah);
        readingSurahListElement.appendChild(li);
    });
}

function isLastRead(surahId) {
    const saved = JSON.parse(localStorage.getItem('lastReadProgress') || '{}');
    return saved.surahId == surahId;
}

// Search Logic for Reading Page (Deep Search: Surahs + Verses)
if (readingSearchInput) {
    readingSearchInput.addEventListener('input', (e) => {
        const term = e.target.value.trim();
        if (!term) {
            readingSurahListElement.classList.remove('searching-active');
            const planner = document.getElementById('khatmahPlanner');
            if (planner) planner.style.display = 'block';
            renderReadingSurahList(songs);
            return;
        }
        const planner = document.getElementById('khatmahPlanner');
        if (planner) planner.style.display = 'none';

        const regex = buildArabicDiacriticInsensitiveRegex(term);
        const results = [];

        // 1. Check Surah Titles
        songs.forEach(surah => {
            if (regex.test(surah.title)) {
                results.push({ type: 'surah', data: surah });
            }
            regex.lastIndex = 0; // Reset for next use
        });

        // 2. Check Verse Contents
        // Optimization: If term is clearly a verse (long or multiple words), search verses thoroughly
        const isLikelyVerse = term.length > 4 || term.includes(' ');
        const normalizedTerm = normalizeArabic(term);

        if (isLikelyVerse || results.length === 0) {
            songs.forEach(surah => {
                if (surah.lyrics) {
                    surah.lyrics.forEach((verse, idx) => {
                        // Double check: Regex OR Normalized Comparison
                        let isMatch = false;
                        if (regex.test(verse.text)) {
                            isMatch = true;
                        } else {
                            // Fallback for extremely complex mushaf orthography
                            const normalizedVerse = normalizeArabic(verse.text);
                            if (normalizedVerse.includes(normalizedTerm)) {
                                isMatch = true;
                            }
                        }

                        if (isMatch) {
                            results.push({
                                type: 'verse',
                                surah: surah,
                                verseNum: idx + 1,
                                text: verse.text
                            });
                        }
                        regex.lastIndex = 0;
                    });
                }
            });
        }

        renderReadingSearchResults(results, term);
    });
}

function renderReadingSearchResults(results, term) {
    readingSurahListElement.innerHTML = '';
    readingSurahListElement.classList.add('searching-active');

    if (results.length === 0) {
        readingSurahListElement.innerHTML = '<li class="no-results">لا توجد نتائج مطابقة لبحثك</li>';
        return;
    }

    // Sort: Surahs first, then verses
    results.sort((a, b) => {
        if (a.type === b.type) return 0;
        return a.type === 'surah' ? -1 : 1;
    });

    results.slice(0, 80).forEach((item, index) => { // Increased limit for better coverage
        const li = document.createElement('li');
        li.className = item.type === 'verse' ? 'search-verse-item' : '';

        if (item.type === 'surah') {
            const surah = item.data;
            li.innerHTML = `
                <div class="song-info-list" style="text-align: right; width: 100%;">
                    <h3>${highlightText(surah.title, term)}</h3>
                    <p>${surah.lyrics ? surah.lyrics.length : 0} آية</p>
                </div>
            `;
            li.onclick = () => openReadingSurah(surah);
        } else {
            const surah = item.surah;
            // Use the shared highlightText helper for consistency
            let highlightedText = highlightText(item.text, term);

            li.innerHTML = `
                <div class="song-info-list" style="text-align: right; width: 100%;">
                    <h3 style="font-size: 0.9rem; color: #a855f7; margin-bottom: 8px; opacity: 0.8;">${surah.title} - آية ${item.verseNum}</h3>
                    <p class="search-verse-preview" style="font-family: 'Amiri', serif; color: #fff; font-size: 1.15rem; line-height: 1.8;">${highlightedText}</p>
                </div>
            `;
            li.onclick = () => openReadingSurah(surah, item.verseNum);
        }

        li.style.animationDelay = `${index * 0.03}s`;
        readingSurahListElement.appendChild(li);
    });
}

// 3. Open Specific Surah (Detail View)
function openReadingSurah(surah, targetVerseNum = null) {
    currentReadingIndex = songs.indexOf(surah); // Update global index
    readingListView.style.display = 'none';
    readingDetailView.style.display = 'block';

    // Update Header
    readingSurahTitle.textContent = surah.title;

    // Render Verses
    renderReadingContent(surah);

    // Auto-scroll logic
    const saved = JSON.parse(localStorage.getItem('lastReadProgress') || '{}');
    const verseToFind = targetVerseNum || (saved.surahId == surah.id ? saved.verseNum : null);

    if (verseToFind) {
        setTimeout(() => {
            const verseEl = document.querySelector(`.verse-item[data-verse="${verseToFind}"]`);
            if (verseEl) {
                verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                verseEl.classList.add('marked-read');

                // If it was a search result, maybe give it a temporary flash
                if (targetVerseNum) {
                    verseEl.style.background = 'rgba(168, 85, 247, 0.4)';
                    setTimeout(() => verseEl.style.background = '', 2000);
                }
            }
        }, 300);
    }

    // Apply Font Settings Immediately
    loadReadingSettings();
}

// 4. Render Verses with Click Interactions
function renderReadingContent(song) {
    if (!song) return;
    readingContent.innerHTML = '';

    // Get saved progress for this surah
    const saved = JSON.parse(localStorage.getItem('lastReadProgress') || '{}');

    if (song.lyrics && song.lyrics.length > 0) {
        song.lyrics.forEach((lyric, idx) => {
            const verseNum = idx + 1;
            const verseDiv = document.createElement('div');
            verseDiv.className = 'verse-item reading-verse';
            verseDiv.setAttribute('data-verse', verseNum);

            // Highlight if saved
            if (saved.surahId == song.id && saved.verseNum == verseNum) {
                verseDiv.classList.add('marked-read');
            }

            // Text (with reading-text class for font sizing)
            verseDiv.innerHTML = `
                <span class="verse-text reading-text">${lyric.text}</span>
                <span class="verse-num-badge">(${verseNum})</span>
            `;

            // ROBUST INTERACTION LOGIC: Click (Save) vs Double Click (Tafsir)
            let clicks = 0;
            let timer = null;

            verseDiv.addEventListener('click', (e) => {
                clicks++;
                if (clicks === 1) {
                    timer = setTimeout(() => {
                        // Single Click Action: OPEN TAFSIR (Now default)
                        clicks = 0;
                        openTafsir(song.id, verseNum);
                    }, 300);
                } else {
                    // Double Click Action: SAVE PROGRESS (Mark as Read)
                    clearTimeout(timer);
                    clicks = 0;
                    markVerseAsRead(song.id, verseNum, verseDiv);
                }
            });

            readingContent.appendChild(verseDiv);
        });

        // Navigation Buttons (Next/Prev Surah) at bottom
        addReadingNavigation(song);

    } else {
        readingContent.innerHTML = '<p>الآيات غير متوفرة لهذه السورة حالياً.</p>';
    }
}

function addReadingNavigation(currentSong) {
    const navDiv = document.createElement('div');
    navDiv.className = 'reading-nav-buttons';
    navDiv.style.cssText = 'display:flex; justify-content:space-between; margin-top:30px; padding:20px;';

    const currentIndex = songs.findIndex(s => s.id === currentSong.id);

    // Prev Button
    if (currentIndex > 0) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'secondary-btn';
        prevBtn.innerText = 'السورة السابقة';
        prevBtn.onclick = () => openReadingSurah(songs[currentIndex - 1]);
        navDiv.appendChild(prevBtn);
    } else {
        navDiv.appendChild(document.createElement('div')); // Spacer
    }

    // Next Button
    if (currentIndex < songs.length - 1) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'secondary-btn';
        nextBtn.innerText = 'السورة التالية';
        nextBtn.onclick = () => openReadingSurah(songs[currentIndex + 1]);
        navDiv.appendChild(nextBtn);
    }

    readingContent.appendChild(navDiv);
}

// 5. Save Progress Logic (The Khatmah Core)
function markVerseAsRead(surahId, verseNum, element) {
    // Remove mark from others
    document.querySelectorAll('.verse-item.marked-read').forEach(el => el.classList.remove('marked-read'));

    // Add mark visual
    element.classList.add('marked-read');

    // --- Score Engine Integration ---
    if (window.ScoreEngine) {
        // Estimate: ~15 verses per page, so award points every 15 verses
        const versesRead = parseInt(localStorage.getItem('totalVersesRead') || '0') + 1;
        localStorage.setItem('totalVersesRead', versesRead);

        if (versesRead % 15 === 0) {
            window.ScoreEngine.addReadingScore(1); // 1 page = 10 points
        }
    }
    // ----------------------------------

    // Save to LocalStorage
    const progress = {
        surahId: surahId,
        verseNum: verseNum,
        timestamp: Date.now()
    };
    localStorage.setItem('lastReadProgress', JSON.stringify(progress));

    // Feedback
    // alert("تم حفظ التقدم"); // Optional, maybe too intrusive? Let's use visual only + toast maybe?
    // Using a simple toast if the function exists, else just visual
    if (typeof showPointToast === 'function') {
        showPointToast(0, 'تم حفظ مكان التوقف تلقائياً');
    } else {
        // Fallback visual feedback
        element.style.backgroundColor = 'rgba(168, 85, 247, 0.3)';
        setTimeout(() => element.style.backgroundColor = '', 500);
    }
}

// Back Buttons Logic
const backToHomeFromReadingListBtn = document.getElementById('backToHomeFromReadingListBtn');
if (backToHomeFromReadingListBtn) {
    backToHomeFromReadingListBtn.addEventListener('click', showHomePage);
}

const backToReadingListBtn = document.getElementById('backToReadingListBtn');
if (backToReadingListBtn) {
    backToReadingListBtn.addEventListener('click', () => {
        readingDetailView.style.display = 'none';
        readingListView.style.display = 'block';
    });
}

function openSidebar() {
    sideMenu.classList.add('active');
    // Create overlay if not exists
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', closeSidebar);
    }
    overlay.classList.add('active');
}

function closeSidebar() {
    sideMenu.classList.remove('active');
    const overlay = document.querySelector('.menu-overlay');
    if (overlay) overlay.classList.remove('active');
}

// Function to show song detail page (maintained but not called from song list click)
function showSongDetailPage(song) {
    hideAllPages();
    songDetailPage.classList.add('active');

    detailAlbumArt.src = song.albumArtUrl;
    detailTrackTitle.textContent = song.title;

    // Split artist name into main artist and second artist
    const artistParts = song.artist.split('|').map(part => part.trim());
    detailTrackArtist.textContent = artistParts[0] || song.artist;

    // Set second artist if available
    const detailSecondArtist = document.getElementById('detailTrackSecondArtist');
    if (artistParts[1]) {
        detailSecondArtist.textContent = artistParts[1];
    } else {
        detailSecondArtist.textContent = "";
    }

    detailAlbumName.textContent = song.album || "";

    bodyElement.classList.remove('player-active-bg');
    bodyElement.classList.add('detail-active-bg');
    backgroundVideoContainer.classList.remove('active');
    backgroundVideo.pause(); // Jeda video background
    backgroundVideo.src = ""; // Kosongkan src video
    backgroundVideo.load();
}

function showPlayerPage() {
    navigateTo('playerPage');
    const currentSong = songs[currentSongIndex];
    if (currentSong && currentSong.videoBgSrc) {
        backgroundVideo.src = currentSong.videoBgSrc;
        backgroundVideo.load();
        backgroundVideo.play().catch(e => console.error("Error playing video background:", e));
    } else {
        backgroundVideo.src = "";
        backgroundVideo.load(); // Kosongkan src jika tidak ada video khusus
    }
}

// --- Home Page Logic ---
function renderSongList(filteredSongs = songs, searchTerm = '', searchType = 'all') {
    songListElement.innerHTML = '';
    if (filteredSongs.length === 0) {
        songListElement.innerHTML = '<li class="no-results">لا توجد نتائج مطابقة</li>';
        return;
    }

    filteredSongs.forEach((song, index) => {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-id', song.id);

        // Highlight matching text in title and artist
        let titleHtml = song.title;
        let artistHtml = song.artist;

        if (searchTerm && (searchType === 'all' || searchType === 'surah')) {
            titleHtml = highlightText(song.title, searchTerm);
        }
        if (searchTerm && (searchType === 'all' || searchType === 'reader')) {
            artistHtml = highlightText(song.artist, searchTerm);
        }

        listItem.innerHTML = `
            <img src="${song.albumArtUrl}" alt="${song.title}" class="song-art-list">
            <div class="song-info-list">
                <h3>${titleHtml} ${isSurahFavorite(song.id) ? '<i class="fas fa-heart fav-icon-list"></i>' : ''}</h3>
                <p>${artistHtml}</p>
                ${song.hasMatchingVerses ?
                `<div class="matching-verses">
                        ${song.matchingVerses.slice(0, 2).map(verse =>
                    `<div class="matching-verse" data-time="${verse.time}">${highlightText(verse.text, searchTerm)}</div>`
                ).join('')}
                        ${song.matchingVerses.length > 2 ?
                    `<div class="more-verses">+${song.matchingVerses.length - 2} آيات أخرى</div>` : ''}
                    </div>` : ''}
            </div>
        `;
        listItem.addEventListener('click', (e) => {
            // If user clicked a specific matching verse, handle via verse handler below
            const verseEl = e.target.closest('.matching-verse');
            if (verseEl && verseEl.hasAttribute('data-time')) {
                const startTime = parseFloat(verseEl.getAttribute('data-time')) || 0;
                const realIndex = songs.findIndex(s => s.id === song.id);
                currentSongIndex = realIndex >= 0 ? realIndex : index;
                playSongFromTime(songs[currentSongIndex], startTime);
                showPlayerPage();
                return;
            }

            const realIndex = songs.findIndex(s => s.id === song.id);
            currentSongIndex = realIndex >= 0 ? realIndex : index;
            // If searching verses and this song has matches, start from the first match
            if (searchType === 'verse' && song.hasMatchingVerses && song.matchingVerses.length > 0) {
                const playStart = document.querySelector('input[name="playStart"]:checked')?.value || 'verse';
                if (playStart === 'verse') {
                    const startTime = parseFloat(song.matchingVerses[0].time) || 0;
                    playSongFromTime(songs[currentSongIndex], startTime);
                } else {
                    loadSong(songs[currentSongIndex]);
                    playTrack();
                }
            } else {
                loadSong(songs[currentSongIndex]);
                playTrack();
            }
            showPlayerPage();
        });
        listItem.addEventListener('mouseenter', () => {
            if (homePage.classList.contains('active') && song.videoBgSrc) {
                if (backgroundVideo.src !== song.videoBgSrc) {
                    backgroundVideo.src = song.videoBgSrc;
                }
                backgroundVideoContainer.classList.add('active');
                backgroundVideo.play().catch(e => {
                    if (e.name !== 'AbortError') console.error("Error playing video:", e);
                });
                bodyElement.classList.add('player-active-bg');
            }
        });
        listItem.addEventListener('mouseleave', () => {
            if (homePage.classList.contains('active')) {
                backgroundVideoContainer.classList.remove('active');
                backgroundVideo.pause();
                bodyElement.classList.remove('player-active-bg');
            }
        });
        listItem.style.animationDelay = `${index * 0.05}s`;
        songListElement.appendChild(listItem);
    });
}

// Comprehensive helper to normalize Arabic text for searching and comparison
function normalizeArabic(text) {
    if (!text) return "";
    return text
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // Remove ALL Quranic marks/diacritics
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/[ىي]/g, "ي") // Normalize Yah/Maksura
        .replace(/\s+/g, " ")
        .toLowerCase()
        .trim();
}

// Build a robust regex that matches simplified terms against complex Quranic text
function buildArabicDiacriticInsensitiveRegex(term) {
    if (!term) return null;

    // Normalize term first to ensure we build regex from base characters
    const cleanTerm = normalizeArabic(term);
    if (!cleanTerm) return null;

    const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // All possible Quranic marks that can appear between letters
    const diacs = "[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]*";

    let pattern = escaped
        .replace(/\s+/g, "\\s+")
        .split("")
        .map(ch => {
            if (/[اأإآٱ]/.test(ch)) return `[اأإآٱ]${diacs}`;
            if (/[هه]/.test(ch)) return `[ةه]${diacs}`;
            if (/[يى]/.test(ch)) return `[يى]${diacs}`;
            if (/[و]/.test(ch)) return `[وۥ]${diacs}`; // Handle standard and small Waw
            return `${ch}${diacs}`;
        })
        .join("");
    try {
        return new RegExp(`(${pattern})`, 'giu');
    } catch (e) {
        return new RegExp(`(${escaped})`, 'giu');
    }
}

// Helper function to highlight search terms in text (Arabic diacritic-insensitive)
function highlightText(text, term) {
    if (!term) return text;
    const regex = buildArabicDiacriticInsensitiveRegex(term);
    if (!regex) return text;
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// --- Search Functionality ---

// Play from a specific time (e.g., when a verse is clicked)
function playSongFromTime(song, startTime = 0) {
    // Load song metadata and UI
    loadSong(song);

    const seekAndPlay = () => {
        try {
            audioPlayer.currentTime = Math.max(0, Number(startTime) || 0);
        } catch (e) {
            // Some browsers may require canplay; ignore here
        }
        isPlaying = true;
        audioPlayer.play().catch(err => console.error('Error play after seek:', err));
        updatePlayPauseIcon();
    };

    if (audioPlayer.readyState >= 1) {
        // Metadata is available
        seekAndPlay();
    } else {
        const onLoaded = () => {
            seekAndPlay();
        };
        audioPlayer.addEventListener('loadedmetadata', onLoaded, { once: true });
        audioPlayer.addEventListener('canplay', onLoaded, { once: true });
    }

    // Force a scroll to the verse in the lyrics container after a short delay
    setTimeout(() => {
        const activeVerse = lyricsContainer.querySelector(`.lyric-line[data-time="${startTime}"]`);
        if (activeVerse) {
            activeVerse.scrollIntoView({ behavior: 'smooth', block: 'center' });
            activeVerse.classList.add('highlight');
        }
    }, 500);
}
function filterSongs(searchTerm, searchType = 'all') {
    if (!searchTerm) {
        return songs;
    }
    const regex = buildArabicDiacriticInsensitiveRegex(searchTerm);
    const normalizedTerm = normalizeArabic(searchTerm);
    if (!regex && !normalizedTerm) return songs;

    return songs
        .map(song => {
            const songCopy = { ...song };
            let matches = false;

            // Title (surah) matching
            if (searchType === 'all' || searchType === 'surah') {
                if (song.title && (regex && regex.test(song.title) || normalizeArabic(song.title).includes(normalizedTerm))) {
                    matches = true;
                }
                if (regex) regex.lastIndex = 0;
            }

            // Reader (artist) matching
            if (searchType === 'all' || searchType === 'reader') {
                if (song.artist && (regex && regex.test(song.artist) || normalizeArabic(song.artist).includes(normalizedTerm))) {
                    matches = true;
                }
                if (regex) regex.lastIndex = 0;
            }

            // Verse matching
            if (searchType === 'all' || searchType === 'verse') {
                if (Array.isArray(song.lyrics)) {
                    const matchingLyrics = song.lyrics.filter(l => {
                        if (!l || !l.text) return false;
                        let ok = false;
                        if (regex && regex.test(l.text)) {
                            ok = true;
                        } else {
                            const normalizedVerse = normalizeArabic(l.text);
                            if (normalizedVerse.includes(normalizedTerm)) {
                                ok = true;
                            }
                        }
                        if (regex) regex.lastIndex = 0;
                        return ok;
                    });

                    if (matchingLyrics.length > 0) {
                        songCopy.hasMatchingVerses = true;
                        songCopy.matchingVerses = matchingLyrics.slice();
                        matches = true;
                    }
                }
            }

            return matches ? songCopy : null;
        })
        .filter(Boolean);
}

function updateSearchResults() {
    const searchTerm = searchInput.value.trim();
    const searchType = document.querySelector('input[name="searchType"]:checked')?.value || 'all';
    const favoriteOnlyToggle = document.getElementById('favoriteOnlyToggle');
    // Use global state if checkbox is not present (we removed it from the DOM)
    const favoriteOnly = favoriteOnlyToggle ? !!favoriteOnlyToggle.checked : favoriteOnlyState;

    let filteredSongs = filterSongs(searchTerm, searchType);
    if (favoriteOnly) {
        const favIds = readFavoriteSurahIds();
        filteredSongs = filteredSongs.filter(s => favIds.includes(s.id));
    }

    // Update the song list with filtered results and search context
    renderSongList(filteredSongs, searchTerm, searchType);
}

// Add event listeners for search
if (searchInput) {
    searchInput.addEventListener('input', updateSearchResults);

    // Add event delegation for search type radio buttons
    document.addEventListener('change', (e) => {
        if (e.target.name === 'searchType') {
            updateSearchResults();
            // Toggle play start options based on selected search type
            const playStartOptions = document.getElementById('playStartOptions');
            if (playStartOptions) {
                playStartOptions.style.display = (e.target.value === 'verse') ? 'flex' : 'none';
            }
        }
    });

    // Favorite-only toggle
    const favoriteOnlyToggle = document.getElementById('favoriteOnlyToggle');
    if (favoriteOnlyToggle) {
        favoriteOnlyToggle.addEventListener('change', updateSearchResults);
    }

    // Initial toggle state for playStartOptions
    (function initPlayStartOptionsVisibility() {
        const playStartOptions = document.getElementById('playStartOptions');
        if (!playStartOptions) return;
        const currentType = document.querySelector('input[name="searchType"]:checked')?.value || 'all';
        playStartOptions.style.display = (currentType === 'verse') ? '' : 'none';
    })();

    // Wire search button click to run the same search
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateSearchResults();
        });
    }
}

// Side Menu Favorites wiring
if (navFavorites) {
    navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        // Toggle internal state
        favoriteOnlyState = !favoriteOnlyState;

        // Update UI of the menu item
        if (favoriteOnlyState) {
            navFavorites.classList.add('active-filter');
            navFavorites.querySelector('i').className = 'fas fa-heart';
            navFavorites.querySelector('span').textContent = 'عرض الكل';
        } else {
            navFavorites.classList.remove('active-filter');
            navFavorites.querySelector('i').className = 'far fa-heart';
            navFavorites.querySelector('span').textContent = 'المفضلة';
        }

        updateSearchResults();
        showHomePage();
        closeSidebar();
    });
}

// Settings Page Buttons
if (btnShowHowTo) {
    btnShowHowTo.addEventListener('click', () => {
        if (helpContent) {
            helpContent.classList.add('active');
            helpContent.style.display = 'flex';
        }
    });
}

if (btnShowContact) {
    btnShowContact.addEventListener('click', () => {
        if (contactContent) {
            contactContent.classList.add('active');
            contactContent.style.display = 'flex';
        }
    });
}

if (backToHomeFromSettingsBtn) {
    backToHomeFromSettingsBtn.addEventListener('click', showHomePage);
}

if (navSettings) {
    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('settingsPage');
    });
}


// Back to Home from Player Button
if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', () => {
        showHomePage();
    });
}

// Back to Home from Reading Mode Button
const backToHomeFromReadingBtn = document.getElementById('backToHomeFromReadingBtn');
if (backToHomeFromReadingBtn) {
    backToHomeFromReadingBtn.addEventListener('click', () => {
        showHomePage();
    });
}

// Sync Mode Logic Implementation
function startSyncMode() {
    const song = songs[currentSongIndex];
    if (!song) return;

    syncSurahTitle.textContent = song.title;
    syncTotalVerses.textContent = song.lyrics.length;
    syncCurrentIndex = 0;
    syncData = [];
    syncResultArea.style.display = 'none';

    updateSyncPreview();

    // Play the song
    loadSong(song);
    playTrack();
}

function updateSyncPreview() {
    const song = songs[currentSongIndex];
    if (syncCurrentIndex < song.lyrics.length) {
        syncCurrentVerseNum.textContent = syncCurrentIndex + 1;
        syncVerseText.textContent = song.lyrics[syncCurrentIndex].text;

        // Show next verse preview if available
        if (syncCurrentIndex + 1 < song.lyrics.length) {
            syncNextVerseText.textContent = song.lyrics[syncCurrentIndex + 1].text;
        } else {
            syncNextVerseText.textContent = "(هذه آخر آية في السورة)";
        }
    } else {
        finishSync();
    }
}

function markVerse() {
    if (!isSyncing || syncCurrentIndex >= songs[currentSongIndex].lyrics.length) return;

    const time = parseFloat(audioPlayer.currentTime.toFixed(2));
    const originalText = songs[currentSongIndex].lyrics[syncCurrentIndex].text;

    syncData.push({ time: time, text: originalText });

    syncCurrentIndex++;
    updateSyncPreview();
}

function stepBackSync() {
    if (syncCurrentIndex > 0) {
        syncCurrentIndex--;
        syncData.pop();
        updateSyncPreview();
    }
}


function finishSync() {
    isSyncing = false;
    syncVerseText.textContent = "اكتملت المزامنة!";
    syncResultArea.style.display = 'block';

    const output = JSON.stringify(syncData, null, 4);
    syncOutputJson.value = output;
}

if (markVerseBtn) {
    markVerseBtn.addEventListener('click', markVerse);
}

if (syncStepBackBtn) {
    syncStepBackBtn.addEventListener('click', stepBackSync);
}

if (syncPlayPauseBtn) {
    syncPlayPauseBtn.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play();
            syncPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audioPlayer.pause();
            syncPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
}

if (syncSeekBackBtn) {
    syncSeekBackBtn.addEventListener('click', () => {
        audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
    });
}


if (backFromSyncBtn) {
    backFromSyncBtn.addEventListener('click', () => {
        isSyncing = false;
        pauseTrack();
        showHomePage();
    });
}

if (copySyncResult) {
    copySyncResult.addEventListener('click', () => {
        syncOutputJson.select();
        document.execCommand('copy');
        alert('تم نسخ الكود! يمكنك الآن لصقه في ملف البيانات.');
    });
}

// Global Spacebar listener for Syncing
document.addEventListener('keydown', (e) => {
    if (isSyncing && e.code === 'Space') {
        e.preventDefault();
        markVerse();
    }
});

// Add Sync Mode button to Settings page
const settingsContainer = document.querySelector('.settings-container');
if (settingsContainer) {
    // Check if group exists, if not create one for tools
    let toolsGroup = document.getElementById('settingsToolsGroup');
    if (!toolsGroup) {
        toolsGroup = document.createElement('div');
        toolsGroup.id = 'settingsToolsGroup';
        toolsGroup.className = 'settings-group';
        toolsGroup.innerHTML = '<h3>أدوات المطور</h3>';
        settingsContainer.appendChild(toolsGroup);
    }

    const syncBtn = document.createElement('button');
    syncBtn.className = 'settings-btn';
    syncBtn.innerHTML = '<i class="fas fa-magic"></i> <span>بدء مزامنة السورة الحالية</span>';
    syncBtn.onclick = () => {
        if (!songs[currentSongIndex]) {
            alert('يرجى اختيار سورة أولاً');
            return;
        }
        showSyncPage();
    };
    toolsGroup.appendChild(syncBtn);
}

if (closeHelpBtn && helpContent) {
    closeHelpBtn.addEventListener('click', () => {
        helpContent.classList.remove('active');
        helpContent.style.display = 'none';
    });
}
if (closeContactBtn && contactContent) {
    closeContactBtn.addEventListener('click', () => {
        contactContent.classList.remove('active');
        contactContent.style.display = 'none';
    });
}

// Close modals when clicking outside content
document.addEventListener('click', (e) => {
    if (helpContent && helpContent.classList.contains('active') && e.target === helpContent) {
        helpContent.classList.remove('active');
        helpContent.style.display = 'none';
    }
    if (contactContent && contactContent.classList.contains('active') && e.target === contactContent) {
        contactContent.classList.remove('active');
        contactContent.style.display = 'none';
    }
});

// Close modals with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (helpContent) {
            helpContent.classList.remove('active');
            helpContent.style.display = 'none';
        }
        if (contactContent) {
            contactContent.classList.remove('active');
            contactContent.style.display = 'none';
        }
    }
});

// --- Player Logic ---
function loadSong(song) {
    if (!song) {
        console.error("Lagu tidak ditemukan!");
        return;
    }
    // Set current playing ID for robust next/prev logic
    currentPlayingSongId = song.id;

    albumArtPlayer.src = song.albumArtUrl;
    playerTrackTitle.textContent = song.title;

    // Split artist name into main artist and second artist
    const artistParts = song.artist.split('|').map(part => part.trim());
    playerTrackArtist.textContent = artistParts[0] || song.artist;

    // If there's a second part, show it as the second artist
    const secondArtistElement = document.getElementById('playerTrackSecondArtist');
    if (artistParts[1]) {
        secondArtistElement.textContent = artistParts[1];
    } else {
        secondArtistElement.textContent = "";
    }


    // Also update the detail page if it's the current page
    if (document.getElementById('detailTrackArtist')) {
        document.getElementById('detailTrackArtist').textContent = artistParts[0] || song.artist;
        const detailSecondArtist = document.getElementById('detailTrackSecondArtist');
        if (artistParts[1]) {
            detailSecondArtist.textContent = artistParts[1];
        } else {
            detailSecondArtist.textContent = "";
        }
    }

    renderLyrics(song.lyrics); // Panggil fungsi renderLyrics

    audioPlayer.src = song.audioSrc;

    audioPlayer.onloadedmetadata = () => {
        playerTotalDuration.textContent = formatTime(audioPlayer.duration);
    };
    audioPlayer.load();
    updatePlayPauseIcon();
    updateDownloadButtonUI(); // Check if this new song is cached
    // Refresh bookmarks view if panel is open
    if (typeof renderBookmarks === 'function' && bookmarksPanel && bookmarksPanel.style.display === 'block') {
        renderBookmarks();
    }
    // Update favorite heart state
    if (typeof setFavoriteSurahUI === 'function') {
        setFavoriteSurahUI();
    }
}

// Function to render lyrics
function renderLyrics(lyrics) {
    lyricsContainer.innerHTML = ''; // Clear lyrics container
    if (!lyrics || lyrics.length === 0) {
        lyricsContainer.innerHTML = "<p>الآيات غير متوفرة لهذه السورة حالياً.</p>";
        return;
    }

    lyrics.forEach((line, index) => {
        const span = document.createElement('span');
        span.textContent = line.text;
        span.setAttribute('data-time', line.time); // Simpan timestamp di data-attribute
        span.classList.add('lyric-line'); // Tambahkan kelas untuk styling

        // Add click listener for Tafsir
        span.addEventListener('click', (e) => {
            const currentSong = songs[currentSongIndex];
            if (currentSong) {
                openTafsir(currentSong.id, index + 1);
            }
        });

        lyricsContainer.appendChild(span);
        // Hapus penambahan <br> secara manual, gunakan CSS display:block atau flexbox
        // lyricsContainer.appendChild(document.createElement('br'));
    });
}


function playTrack() {
    if (!audioPlayer.src || audioPlayer.src === window.location.href) {
        if (songs.length > 0) {
            loadSong(songs[currentSongIndex]);
        } else {
            console.log("Tidak ada lagu untuk dimainkan.");
            return;
        }
    }
    isPlaying = true;
    audioPlayer.play().catch(error => console.error("Error saat play:", error));
    updatePlayPauseIcon();
}

function pauseTrack() {
    isPlaying = false;
    audioPlayer.pause();
    updatePlayPauseIcon();
}

function updatePlayPauseIcon() {
    if (isPlaying) {
        playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        playerPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

function prevTrack() {
    if (songs.length === 0) return;

    // Use current ID to find current position in the sorted list
    let realIndex = songs.findIndex(s => s.id === currentPlayingSongId);
    if (realIndex === -1) realIndex = currentSongIndex;

    // Move to previous
    currentSongIndex = (realIndex - 1 + songs.length) % songs.length;

    loadSong(songs[currentSongIndex]);
    playTrack();
    showPlayerPage();
}

function nextTrackLogic() {
    if (songs.length === 0) return;

    // Use current ID to find current position in the sorted list
    let realIndex = songs.findIndex(s => s.id === currentPlayingSongId);
    if (realIndex === -1) realIndex = currentSongIndex;

    // Move to next
    currentSongIndex = realIndex + 1;

    // Check if we've reached the end
    if (currentSongIndex >= songs.length) {
        if (repeatMode === 2) {
            // Repeat all - go back to start
            currentSongIndex = 0;
        } else {
            // No repeat or repeat one - stop
            currentSongIndex = songs.length - 1;
            pauseTrack();
            return;
        }
    }

    loadSong(songs[currentSongIndex]);
    playTrack();
    showPlayerPage();
}


function nextTrack() {
    if (songs.length === 0) return;


    // Force sequential navigation logic
    nextTrackLogic();
}


function playRandomTrack() {
    if (songs.length <= 1) {
        currentSongIndex = 0;
    } else {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * songs.length);
        } while (randomIndex === currentSongIndex);
        currentSongIndex = randomIndex;
    }
    loadSong(songs[currentSongIndex]);
    playTrack();
    showPlayerPage(); // Perbarui video background
}


audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        playerProgressBar.style.width = `${progressPercent}%`;
        playerCurrentTime.textContent = formatTime(audioPlayer.currentTime);

        // Save playback state every 5 seconds
        if (Math.floor(audioPlayer.currentTime) % 5 === 0) {
            savePlaybackState();
        }

        // --- Community Competition Hook (Listening Points) ---
        if (window.ScoreEngine && !audioPlayer.paused) {
            // Award point every minute
            if (audioPlayer.currentTime > 0 && Math.floor(audioPlayer.currentTime) % 60 === 0) {
                // Simple debounce to prevent multiple triggers in the same second
                const nowSec = Math.floor(audioPlayer.currentTime);
                if (window.lastPointSec !== nowSec) {
                    window.ScoreEngine.onListeningTick();
                    window.lastPointSec = nowSec;
                }
            }
        }
        // ---------------------------------------------------

        // --- Logic highlight lirik ---
        const currentTime = audioPlayer.currentTime;
        const lyricLines = lyricsContainer.querySelectorAll('.lyric-line');
        let highlightedLine = null;

        lyricLines.forEach((line, index) => {
            const lineTime = parseFloat(line.getAttribute('data-time'));
            // Tentukan waktu berakhir baris lirik ini. Jika ini baris terakhir, anggap berakhir di akhir lagu.
            // Atau, lebih baik, anggap berakhir tepat sebelum baris berikutnya dimulai.
            let nextLineTime = Infinity;
            if (index + 1 < lyricLines.length) {
                nextLineTime = parseFloat(lyricLines[index + 1].getAttribute('data-time'));
            }

            if (currentTime >= lineTime && currentTime < nextLineTime) {
                line.classList.add('highlight');
                highlightedLine = line;
            } else {
                line.classList.remove('highlight');
            }
        });

        // --- Auto-scroll lirik hanya jika baris yang disorot tidak terlihat ---
        if (highlightedLine) {
            const containerRect = lyricsContainer.getBoundingClientRect();
            const lineRect = highlightedLine.getBoundingClientRect();

            // Periksa apakah baris di luar viewport kontainer
            const isOutsideTop = lineRect.top < containerRect.top;
            const isOutsideBottom = lineRect.bottom > containerRect.bottom;

            if (isOutsideTop || isOutsideBottom) {
                // Scroll agar baris terdekat muncul di dalam viewport, dengan animasi smooth
                highlightedLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

playerProgressBarContainer.addEventListener('click', (e) => {
    if (!audioPlayer.duration || songs.length === 0) return;
    const width = playerProgressBarContainer.clientWidth;
    const clickX = e.offsetX;
    audioPlayer.currentTime = (clickX / width) * audioPlayer.duration;
});

// Button-based Volume Control
const volPlusBtn = document.getElementById('volPlusBtn');
const volMinusBtn = document.getElementById('volMinusBtn');
const volIndicatorFill = document.getElementById('volIndicatorFill');

function updateVolumeUI() {
    if (volIndicatorFill) {
        volIndicatorFill.style.height = `${audioPlayer.volume * 100}%`;
    }
}

if (volPlusBtn && volMinusBtn) {
    volPlusBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent closing popover
        audioPlayer.volume = Math.min(1, audioPlayer.volume + 0.1);
        updateVolumeUI();
    });

    volMinusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audioPlayer.volume = Math.max(0, audioPlayer.volume - 0.1);
        updateVolumeUI();
    });

    // Initialize UI
    updateVolumeUI();
}





playerRepeatBtn.addEventListener('click', () => {
    repeatMode = (repeatMode + 1) % 3;
    updateRepeatButtonUI();
    console.log("Repeat Mode: " + repeatMode);
});

function updateRepeatButtonUI() {
    playerRepeatBtn.classList.remove('active-feature');
    audioPlayer.loop = false;

    if (repeatMode === 0) {
        playerRepeatBtn.innerHTML = '<i class="fas fa-repeat"></i>';
    } else if (repeatMode === 1) {
        playerRepeatBtn.innerHTML = '<i class="fas fa-repeat-1"></i>';
        playerRepeatBtn.classList.add('active-feature');
        audioPlayer.loop = true;
    } else {
        playerRepeatBtn.innerHTML = '<i class="fas fa-repeat"></i>';
        playerRepeatBtn.classList.add('active-feature');
    }
}

playerPlayPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
});
playerPrevBtn.addEventListener('click', prevTrack);
playerNextBtn.addEventListener('click', nextTrackLogic);

// Auto-play next track when current track ends
audioPlayer.addEventListener('ended', () => {
    console.log('Track ended. Repeat mode:', repeatMode, 'Current index:', currentSongIndex);

    if (repeatMode === 1) {
        // Repeat one is handled by audioPlayer.loop = true
        console.log('Repeat one active - loop will handle it');
        return;
    }

    // For all other cases, try to go to next track
    // nextTrackLogic will handle repeat mode 2 (repeat all) and mode 0 (no repeat)
    console.log('Calling nextTrackLogic...');
    nextTrackLogic();
});



// --- New: Jump +/-10s controls ---
const back10Btn = document.getElementById('playerBack10Btn');
const fwd10Btn = document.getElementById('playerForward10Btn');
if (back10Btn) {
    back10Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isNaN(audioPlayer.currentTime)) {
            audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
        }
    });
}
if (fwd10Btn) {
    fwd10Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isNaN(audioPlayer.currentTime) && !isNaN(audioPlayer.duration)) {
            audioPlayer.currentTime = Math.min(audioPlayer.duration || audioPlayer.currentTime + 10, audioPlayer.currentTime + 10);
        }
    });
}

// --- New: Volume popover toggle ---
const volumeToggleBtn = document.getElementById('volumeBtn');
const volumePopover = document.getElementById('volumePopover');
if (volumeToggleBtn && volumePopover) {
    volumeToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        volumePopover.classList.toggle('show');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!volumePopover.classList.contains('show')) return;
        const within = e.target.closest('.volume-control-player');
        if (!within) {
            volumePopover.classList.remove('show');
        }
    });
}

// --- New: Sleep Timer (with fade-out) ---
const sleepTimerBtn = document.getElementById('sleepTimerBtn');
const sleepTimerPopover = document.getElementById('sleepTimerPopover');
const sleepCancelBtn = document.getElementById('sleepCancelBtn');
const sleepRemainingEl = document.getElementById('sleepRemaining');
const sleepCustomMinutes = document.getElementById('sleepCustomMinutes');
const sleepStartCustomBtn = document.getElementById('sleepStartCustomBtn');
let sleepState = {
    endAt: null,
    intervalId: null,
    fadeStarted: false,
    originalVolume: null
};

function formatRemaining(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function clearSleepInterval() {
    if (sleepState.intervalId) {
        clearInterval(sleepState.intervalId);
        sleepState.intervalId = null;
    }
}

function cancelSleep() {
    clearSleepInterval();
    sleepState.endAt = null;
    sleepState.fadeStarted = false;
    if (sleepState.originalVolume != null) {
        audioPlayer.volume = sleepState.originalVolume;
    }
    sleepState.originalVolume = null;
    if (sleepRemainingEl) {
        sleepRemainingEl.style.display = 'none';
        sleepRemainingEl.textContent = '';
    }
    if (sleepCancelBtn) {
        sleepCancelBtn.disabled = true;
    }
}

function startSleep(minutes) {
    if (!audioPlayer) return;
    const now = Date.now();
    const durationMs = minutes * 60 * 1000;
    sleepState.endAt = now + durationMs;
    sleepState.fadeStarted = false;
    sleepState.originalVolume = audioPlayer.volume;

    if (sleepRemainingEl) {
        sleepRemainingEl.style.display = '';
    }
    if (sleepCancelBtn) {
        sleepCancelBtn.disabled = false;
    }

    const fadeMs = 8000; // fade-out duration in ms

    clearSleepInterval();
    sleepState.intervalId = setInterval(() => {
        const remaining = sleepState.endAt - Date.now();
        if (sleepRemainingEl) {
            sleepRemainingEl.textContent = `الوقت المتبقي: ${formatRemaining(remaining)}`;
        }

        if (remaining <= 0) {
            // Ensure volume is zero and stop playback
            audioPlayer.volume = 0;
            audioPlayer.pause();
            cancelSleep();
            if (sleepTimerPopover) sleepTimerPopover.classList.remove('show');
            return;
        }

        if (remaining <= fadeMs && !sleepState.fadeStarted) {
            sleepState.fadeStarted = true;
        }

        if (sleepState.fadeStarted) {
            const frac = Math.max(0, Math.min(1, remaining / fadeMs));
            const targetVol = (sleepState.originalVolume ?? 1) * frac;
            audioPlayer.volume = targetVol;
        }
    }, 250);
}

if (sleepTimerBtn && sleepTimerPopover) {
    // Toggle popover
    sleepTimerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sleepTimerPopover.classList.toggle('show');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!sleepTimerPopover.classList.contains('show')) return;
        const within = e.target.closest('.sleep-control-player');
        if (!within) {
            sleepTimerPopover.classList.remove('show');
        }
    });

    // Options
    const optionButtons = sleepTimerPopover.querySelectorAll('.sleep-option');
    optionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const min = Number(btn.getAttribute('data-min'));
            if (!isNaN(min) && min > 0) {
                startSleep(min);
            }
        });
    });

    if (sleepCancelBtn) {
        sleepCancelBtn.addEventListener('click', () => {
            cancelSleep();
        });
    }

    // Custom minutes start
    if (sleepStartCustomBtn) {
        sleepStartCustomBtn.addEventListener('click', () => {
            if (!sleepCustomMinutes) return;
            const val = Number(sleepCustomMinutes.value);
            if (!isNaN(val) && val >= 1 && val <= 600) {
                startSleep(val);
            } else {
                // Basic feedback via placeholder if invalid
                sleepCustomMinutes.value = '';
                sleepCustomMinutes.placeholder = 'أدخل رقمًا بين 1 و 600';
                sleepCustomMinutes.focus();
            }
        });
    }
    if (sleepCustomMinutes) {
        sleepCustomMinutes.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (sleepStartCustomBtn) sleepStartCustomBtn.click();
            }
        });
    }
}

// Auto-advance when a surah ends (respecting repeat/shuffle modes)
audioPlayer.addEventListener('ended', () => {
    if (repeatMode === 1) {
        // Repeat-one handled via audio.loop = true
        return;
    }
    nextTrack();
});

// --- Bookmarks (per surah) ---
function getCurrentSong() {
    return songs[currentSongIndex];
}

function bookmarksKeyForSong(song) {
    if (!song || song.id == null) return null;
    return `bookmarks:${song.id}`;
}

function readBookmarks(song) {
    const key = bookmarksKeyForSong(song);
    if (!key) return [];
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.warn('Failed to read bookmarks', e);
        return [];
    }
}

function writeBookmarks(song, arr) {
    const key = bookmarksKeyForSong(song);
    if (!key) return;
    try {
        localStorage.setItem(key, JSON.stringify(arr || []));
    } catch (e) {
        console.warn('Failed to write bookmarks', e);
    }
}

function findCurrentLyricTextAt(timeSec) {
    const lines = lyricsContainer ? lyricsContainer.querySelectorAll('.lyric-line') : [];
    let chosen = '';
    for (let i = 0; i < lines.length; i++) {
        const t = parseFloat(lines[i].getAttribute('data-time')) || 0;
        const nextT = (i + 1 < lines.length) ? parseFloat(lines[i + 1].getAttribute('data-time')) : Infinity;
        if (timeSec >= t && timeSec < nextT) {
            chosen = lines[i].textContent || '';
            break;
        }
        if (timeSec >= t) {
            chosen = lines[i].textContent || chosen;
        }
    }
    return chosen;
}

function renderBookmarks() {
    if (!bookmarksList) return;
    const song = getCurrentSong();
    const arr = readBookmarks(song);
    bookmarksList.innerHTML = '';
    if (!arr.length) {
        const li = document.createElement('li');
        li.textContent = 'لا توجد إشارات بعد';
        li.style.opacity = '0.8';
        bookmarksList.appendChild(li);
        return;
    }

    arr.forEach((bm, idx) => {
        const li = document.createElement('li');
        li.className = 'bookmark-item';

        const info = document.createElement('div');
        info.className = 'bookmark-info';
        const t = document.createElement('div');
        t.className = 'bookmark-time';
        t.textContent = formatTime(bm.time || 0);
        const txt = document.createElement('div');
        txt.className = 'bookmark-text';
        txt.textContent = bm.text || '';
        info.appendChild(t);
        info.appendChild(txt);

        const actions = document.createElement('div');
        actions.className = 'bookmark-actions';
        const playBtn = document.createElement('button');
        playBtn.className = 'bookmark-btn';
        playBtn.textContent = 'تشغيل';
        playBtn.addEventListener('click', () => {
            if (!isNaN(bm.time)) {
                if (audioPlayer) {
                    audioPlayer.currentTime = bm.time;
                    playTrack();
                }
            }
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'bookmark-btn';
        delBtn.textContent = 'حذف';
        delBtn.addEventListener('click', () => {
            const song = getCurrentSong();
            const list = readBookmarks(song);
            list.splice(idx, 1);
            writeBookmarks(song, list);
            renderBookmarks();
        });

        actions.appendChild(playBtn);
        actions.appendChild(delBtn);

        li.appendChild(info);
        li.appendChild(actions);
        bookmarksList.appendChild(li);
    });
}

function addCurrentBookmark() {
    const song = getCurrentSong();
    if (!song) return;
    const time = Math.floor(audioPlayer.currentTime || 0);
    const text = findCurrentLyricTextAt(time);
    const list = readBookmarks(song);
    list.push({ time, text });
    writeBookmarks(song, list);
    renderBookmarks();
}

if (toggleBookmarksBtn && bookmarksPanel) {
    toggleBookmarksBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const show = bookmarksPanel.style.display !== 'block';
        bookmarksPanel.style.display = show ? 'block' : 'none';
        if (show) renderBookmarks();
    });
}
if (closeBookmarksBtn && bookmarksPanel) {
    closeBookmarksBtn.addEventListener('click', () => {
        bookmarksPanel.style.display = 'none';
    });
}
if (addBookmarkBtn) {
    addBookmarkBtn.addEventListener('click', addCurrentBookmark);
}

// --- Favorite Surah (per surah) ---
function readFavoriteSurahIds() {
    try {
        const raw = localStorage.getItem('favoriteSurahs');
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        console.warn('Failed to read favoriteSurahs', e);
        return [];
    }
}

function writeFavoriteSurahIds(arr) {
    try {
        localStorage.setItem('favoriteSurahs', JSON.stringify(arr || []));
    } catch (e) {
        console.warn('Failed to write favoriteSurahs', e);
    }
}

function isSurahFavorite(id) {
    const list = readFavoriteSurahIds();
    return list.includes(id);
}

function toggleFavoriteSurah() {
    const song = getCurrentSong();
    if (!song || song.id == null) return;
    const list = readFavoriteSurahIds();
    const idx = list.indexOf(song.id);
    if (idx >= 0) {
        list.splice(idx, 1);
    } else {
        list.push(song.id);
    }
    writeFavoriteSurahIds(list);
    setFavoriteSurahUI();
}

function setFavoriteSurahUI() {
    if (!favoriteSurahBtn) return;
    const song = getCurrentSong();
    const fav = song && song.id != null ? isSurahFavorite(song.id) : false;
    favoriteSurahBtn.innerHTML = fav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    favoriteSurahBtn.title = fav ? 'إزالة من المفضلة' : 'سورة مفضلة';
}

if (favoriteSurahBtn) {
    favoriteSurahBtn.addEventListener('click', toggleFavoriteSurah);
}

// --- Dua al-Khatmah Logic ---
const duaKhatmahBtn = document.getElementById('duaKhatmahBtn');

const DUA_KHATMAH_CONTENT = [
    "اللهم ارحمني بالقرآن واجعله لي إماما ونورا وهدى ورحمة",
    "اللهم ذكرني منه ما نسيت وعلمني منه ما جهلت وارزقني تلاوته آناء الليل وأطراف النهار واجعله لي حجة يا رب العالمين",
    "اللهم أصلح لي ديني الذي هو عصمة أمري وأصلح لي دنياي التي فيها معاشي وأصلح لي آخرتي التي فيها معادي",
    "واجعل الحياة زيادة لي في كل خير واجعل الموت راحة لي من كل شر",
    "اللهم اجعل خير عمري آخره وخير عملي خواتمه وخير أيامي يوم ألقاك فيه",
    "اللهم إني أسألك عيشة هنية وميتة سوية ومردا غير مخز ولا فاضح",
    "اللهم إني أسألك خير المسألة وخير الدعاء وخير النجاح وخير العلم وخير العمل وخير الثواب وخير الحياة وخير الممات",
    "وثبتني وثقل موازيني وحقق إيماني وارفع درجتي وتقبل صلاتي واغفر خطيئاتي وأسألك العلا من الجنة",
    "اللهم إني أسألك موجبات رحمتك وعزائم مغفرتك والسلامة من كل إثم والغنيمة من كل بر والفوز بالجنة والنجاة من النار",
    "اللهم أحسن عاقبتنا في الأمور كلها وأجرنا من خزي الدنيا وعذاب الآخرة",
    "اللهم اقسم لنا من خشيتك ما تحول به بيننا وبين معصيتك ومن طاعتك ما تبلغنا بها جنتك ومن اليقين ما تهون به علينا مصائب الدنيا",
    "ومتعنا بأسماعنا وأبصارنا وقوتنا ما أحييتنا واجعله الوارث منا واجعل ثأرنا على من ظلمنا وانصرنا على من عادانا ولا تجعل مصيبتنا في ديننا ولا تجعل الدنيا أكبر همنا ولا مبلغ علمنا ولا تسلط علينا من لا يرحمنا",
    "اللهم لا تدع لنا ذنبا إلا غفرته ولا هما إلا فرجته ولا دينا إلا قضيته ولا حاجة من حوائج الدنيا والآخرة إلا قضيتها يا أرحم الراحمين",
    "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار",
    "وصلى الله على نبينا محمد وعلى آله وأصحابه الأخيار وسلم تسليما كثيرا"
];

function openDuaReading() {
    readingListView.style.display = 'none';
    readingDetailView.style.display = 'block';
    readingSurahTitle.textContent = "دعاء ختم القرآن الكريم";
    readingContent.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'dua-reading-container';
    container.style.padding = '20px';
    container.style.textAlign = 'center';

    DUA_KHATMAH_CONTENT.forEach((line, idx) => {
        const p = document.createElement('p');
        p.className = 'verse-text reading-text';
        p.style.marginBottom = '20px';
        p.style.lineHeight = '2';
        p.textContent = line;
        container.appendChild(p);
    });

    readingContent.appendChild(container);

    // Add back button at bottom
    const navDiv = document.createElement('div');
    navDiv.className = 'reading-nav-buttons';
    navDiv.style.cssText = 'display:flex; justify-content:center; margin-top:30px; padding:20px;';
    const backBtn = document.createElement('button');
    backBtn.className = 'secondary-btn';
    backBtn.innerText = 'العودة للقائمة';
    backBtn.onclick = () => {
        readingDetailView.style.display = 'none';
        readingListView.style.display = 'block';
    };
    navDiv.appendChild(backBtn);
    readingContent.appendChild(navDiv);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (duaKhatmahBtn) {
    duaKhatmahBtn.onclick = openDuaReading;
}
const duaKhatmahBtnStatic = document.getElementById('duaKhatmahBtnStatic');
if (duaKhatmahBtnStatic) {
    duaKhatmahBtnStatic.onclick = openDuaReading;
}
// --- Side Menu Logic ---

// Event Listeners for Side Menu
if (menuBtn) menuBtn.addEventListener('click', openSidebar);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeSidebar);
if (navHome) navHome.addEventListener('click', (e) => {
    e.preventDefault();
    showHomePage();
    closeSidebar();
});
if (navReading) navReading.addEventListener('click', (e) => {
    e.preventDefault();
    showReadingPageList(); // This centralized function handles both choice view and list
    closeSidebar();
});

// Reading Page Controls (backToHomeFromReadingBtn already defined at top of file)

const listenFromReadingBtn = document.getElementById('listenFromReadingBtn');
if (listenFromReadingBtn) {
    listenFromReadingBtn.addEventListener('click', () => {
        currentSongIndex = currentReadingIndex;
        loadSong(songs[currentSongIndex]);
        playTrack();
        showPlayerPage();
    });
}

const prevSurahReading = document.getElementById('prevSurahReading');
const nextSurahReading = document.getElementById('nextSurahReading');

if (prevSurahReading) {
    prevSurahReading.addEventListener('click', () => {
        if (currentReadingIndex > 0) {
            showReadingPage(currentReadingIndex - 1);
            readingPage.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}
if (nextSurahReading) {
    nextSurahReading.addEventListener('click', () => {
        // Award points for completing the current Surah
        const currentSurah = songs[currentReadingIndex];

        // Robust Verse Count Logic
        let verseCount = 0;
        if (currentSurah) {
            if (currentSurah.lyrics && currentSurah.lyrics.length > 0) {
                verseCount = currentSurah.lyrics.length;
            } else if (currentSurah.totalVerses) {
                verseCount = currentSurah.totalVerses;
            } else {
                verseCount = 15; // Fallback average if data missing
            }
        }

        if (verseCount > 0) {
            awardPoints(verseCount, 'قراءة سورة ' + (currentSurah ? currentSurah.title : ''));
        }

        if (currentReadingIndex < songs.length - 1) {
            showReadingPage(currentReadingIndex + 1);
            readingPage.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// Event Listeners for tombol navigasi
backToHomeFromDetailBtn.addEventListener('click', showHomePage); // Dari halaman detail ke home
backToHomeBtn.addEventListener('click', showHomePage); // Dari halaman player ke home

// Event Listener for tombol play dari halaman detail (jika Anda ingin menggunakannya)
playFromDetailBtn.addEventListener('click', () => {
    loadSong(songs[currentSongIndex]);
    playTrack();
    showPlayerPage();
});

// --- Resume Playback Feature ---
function savePlaybackState() {
    const currentState = {
        songIndex: currentSongIndex,
        currentTime: audioPlayer.currentTime,
        timestamp: Date.now()
    };
    localStorage.setItem('lastPlaybackState', JSON.stringify(currentState));
}

function checkResumePlayback() {
    const savedState = localStorage.getItem('lastPlaybackState');
    if (savedState) {
        const state = JSON.parse(savedState);
        // Only show if it's less than 24 hours old OR just always show it
        const surah = songs[state.songIndex];
        if (surah && state.currentTime > 5) {
            const prompt = document.getElementById('resumePrompt');
            const resumeText = document.getElementById('resumeText');
            if (prompt && resumeText) {
                resumeText.textContent = `هل تريد الاستمرار في ${surah.title} من حيث توقفت؟`;
                prompt.style.display = 'block';

                document.getElementById('resumeYesBtn').onclick = () => {
                    currentSongIndex = state.songIndex;
                    loadSong(songs[currentSongIndex]);
                    audioPlayer.currentTime = state.currentTime;
                    playTrack();
                    showPlayerPage();
                    prompt.style.display = 'none';
                };

                document.getElementById('resumeNoBtn').onclick = () => {
                    prompt.style.display = 'none';
                };
            }
        }
    }
}

// --- Khatmah Planner Logic ---
const khatmahPlannerCard = document.getElementById('khatmahPlanner');
const khatmahModal = document.getElementById('khatmahModal');
const khatmahSettingsBtn = document.getElementById('khatmahSettingsBtn');
const closeKhatmahModal = document.getElementById('closeKhatmahModal');
const closePlannerBtn = document.getElementById('closePlannerBtn');
const dailyStatusText = document.getElementById('dailyStatusText');
const currentKhatmahDayBadge = document.getElementById('currentKhatmahDayBadge');
const khatmahStreakSpan = document.getElementById('khatmahStreak');
let readingFontSize = 100;

function flattenVerses() {
    allVersesFlat = [];
    songs.forEach((song, sIdx) => {
        if (song.lyrics) {
            song.lyrics.forEach((lyric, vIdx) => {
                allVersesFlat.push({
                    surahIndex: sIdx,
                    verseIndex: vIdx,
                    text: lyric.text,
                    surahTitle: song.title
                });
            });
        }
    });
}

function calculateTotalVerses() {
    if (allVersesFlat.length === 0) flattenVerses();
    return allVersesFlat.length;
}

function initKhatmah() {
    totalQuranVerses = calculateTotalVerses();
    const savedPlan = localStorage.getItem('khatmahPlan');
    if (savedPlan) {
        khatmahPlan = JSON.parse(savedPlan);
        if (khatmahPlan && !khatmahPlan.currentDay) khatmahPlan.currentDay = 1;
        if (khatmahPlan && !khatmahPlan.streak) khatmahPlan.streak = 0;
        updateKhatmahUI();
    }
}

function setKhatmahPlan(days) {
    if (!totalQuranVerses) totalQuranVerses = calculateTotalVerses();
    const dailyTarget = Math.ceil(totalQuranVerses / days);
    khatmahPlan = {
        days: days,
        dailyTarget: dailyTarget,
        currentDay: 1,
        streak: 0,
        lastInteractionDate: null,
        startDate: Date.now()
    };
    localStorage.setItem('khatmahPlan', JSON.stringify(khatmahPlan));

    khatmahModal.style.display = 'none';
    khatmahPlannerCard.style.display = 'block';

    // Switch to reading page and show daily target
    showReadingPageWithKhatmah();
}

function showReadingPageWithKhatmah() {
    if (!khatmahPlan) return;

    // Explicitly manage sub-view visibility
    const choiceView = document.getElementById('readingChoiceView');
    const listView = document.getElementById('readingListView');
    const detailView = document.getElementById('readingDetailView');

    if (choiceView) choiceView.style.display = 'none';
    if (listView) listView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';

    renderDailyKhatmahVerses();
    updateKhatmahUI();
    navigateTo('readingPage');
}

function renderDailyKhatmahVerses() {
    if (!khatmahPlan) return;
    if (allVersesFlat.length === 0) flattenVerses();
    if (allVersesFlat.length === 0) return;

    const day = khatmahPlan.currentDay;
    const target = khatmahPlan.dailyTarget;
    const startIndex = (day - 1) * target;
    const endIndex = Math.min(day * target, allVersesFlat.length);

    const todaysVerses = allVersesFlat.slice(startIndex, endIndex);
    const lastReadIdx = khatmahPlan.lastReadIndexInDay || -1;

    readingSurahTitle.textContent = `ورد اليوم ${day} من الختمة`;
    readingContent.innerHTML = '';

    // Group verses by surah for better display
    let lastSurah = '';
    const dailyInfo = document.createElement('div');
    dailyInfo.className = 'daily-target-info';
    dailyInfo.innerHTML = `مقدار هذا اليوم: من <strong>${todaysVerses[0].surahTitle}</strong> إلى <strong>${todaysVerses[todaysVerses.length - 1].surahTitle}</strong> (${todaysVerses.length} آية)`;
    readingContent.appendChild(dailyInfo);

    todaysVerses.forEach((verse, idx) => {
        if (verse.surahTitle !== lastSurah) {
            const surahSeparator = document.createElement('h4');
            surahSeparator.className = 'surah-separator';
            surahSeparator.style = "color: #a855f7; margin: 30px 0 15px; border-bottom: 1px solid rgba(168,85,247,0.2); pb: 5px;";
            surahSeparator.textContent = verse.surahTitle;
            readingContent.appendChild(surahSeparator);
            lastSurah = verse.surahTitle;
        }

        const verseDiv = document.createElement('div');
        verseDiv.className = 'verse-item';
        if (idx <= lastReadIdx) verseDiv.classList.add('read');
        if (idx === lastReadIdx) verseDiv.classList.add('last-read-marker');

        verseDiv.innerHTML = `
            <span class="verse-num-badge">${verse.verseIndex + 1}</span>
            <span class="verse-text">${verse.text}</span>
        `;

        verseDiv.addEventListener('click', () => {
            markVerseAsRead(idx);
        });

        readingContent.appendChild(verseDiv);
    });

    // Add Done Button
    const doneContainer = document.createElement('div');
    doneContainer.className = 'done-btn-container';
    const doneBtn = document.createElement('button');
    doneBtn.className = 'khatmah-done-btn';
    doneBtn.innerHTML = '<i class="fas fa-check-circle"></i> أكملت ورد اليوم';
    doneBtn.onclick = completeKhatmahDay;
    doneContainer.appendChild(doneBtn);
    readingContent.appendChild(doneContainer);

    // Scroll to last read verse if possible
    if (lastReadIdx !== -1) {
        setTimeout(() => {
            const lastReadElem = readingContent.querySelector('.last-read-marker');
            if (lastReadElem) {
                lastReadElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    }
}

function markVerseAsRead(idx) {
    if (!khatmahPlan) return;
    khatmahPlan.lastReadIndexInDay = idx;
    localStorage.setItem('khatmahPlan', JSON.stringify(khatmahPlan));
    renderDailyKhatmahVerses(); // Refresh UI to show progress
}

function completeKhatmahDay() {
    if (!khatmahPlan) return;

    // Update streak logic
    const now = new Date();
    const lastDate = khatmahPlan.lastInteractionDate ? new Date(khatmahPlan.lastInteractionDate) : null;

    if (lastDate) {
        const diffInHours = (now - lastDate) / (1000 * 60 * 60);
        if (diffInHours < 48) {
            // Check if it's a new calendar day to increase streak
            if (now.toDateString() !== lastDate.toDateString()) {
                khatmahPlan.streak = (khatmahPlan.streak || 0) + 1;
            }
        } else {
            khatmahPlan.streak = 1; // Reset streak if missed more than a day
        }
    } else {
        khatmahPlan.streak = 1;
    }

    khatmahPlan.lastInteractionDate = now.getTime();

    if (khatmahPlan.currentDay < khatmahPlan.days) {
        // Award points for the completed daily wird
        const points = 50; // Standard points for daily khatmah
        if (typeof awardPoints === 'function') awardPoints(points, `ورد اليوم ${khatmahPlan.currentDay}`);

        khatmahPlan.currentDay++;
        khatmahPlan.lastReadIndexInDay = -1; // Reset progress for the new day
        localStorage.setItem('khatmahPlan', JSON.stringify(khatmahPlan));

        // Notification Reminder: Schedule for tomorrow
        scheduleKhatmahReminder();

        setTimeout(() => {
            if (window.showPointToast) {
                showPointToast(points, "بارك الله فيك! تم إكمال ورد اليوم بنجاح وارتفع الستريك الخاص بك 🔥");
            }
        }, 500);

        renderDailyKhatmahVerses();
        updateKhatmahUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Completed the whole Khatmah!
        if (typeof awardPoints === 'function') awardPoints(500, 'إتمام ختمة كاملة');
        if (window.showPointToast) {
            showPointToast(0, 'مبارك! لقد أتممت ختمة القرآن الكريم كاملة. يجعلها الله في ميزان حسناتك.');
        }
        localStorage.removeItem('khatmahPlan');
        khatmahPlan = null;
        navigateTo('homePage');
    }
}

function scheduleKhatmahReminder() {
    const systemEnabled = localStorage.getItem('systemNotifEnabled') !== 'false';
    if (systemEnabled && Notification.permission === "granted") {
        // Since we can't do true background scheduling without a dedicated server or Push API,
        // we use the AI companion's periodic check to see if a reminder is needed.
        localStorage.setItem('khatmah_reminder_needed', 'true');
        localStorage.setItem('khatmah_reminder_time', (Date.now() + 24 * 60 * 60 * 1000).toString());
    }
}

function updateKhatmahUI() {
    const activeContent = document.getElementById('activeKhatmahContent');
    const noContent = document.getElementById('noKhatmahContent');
    const dailyVerseCountSpan = document.getElementById('dailyVerseCount');
    const khatmahDaysSpan = document.getElementById('khatmahDays');
    const dailyProgress = document.getElementById('dailyProgress');
    const dailyStatusText = document.getElementById('dailyStatusText');
    const khatmahStreakSpan = document.getElementById('khatmahStreak');
    const cardElement = document.getElementById('khatmahPlanner');

    if (!cardElement) return;

    // Force display always as requested
    cardElement.style.display = 'block';
    cardElement.style.opacity = '1';

    if (!khatmahPlan) {
        if (activeContent) activeContent.style.display = 'none';
        if (noContent) noContent.style.display = 'block';
        return;
    }

    if (activeContent) activeContent.style.display = 'block';
    if (noContent) noContent.style.display = 'none';

    if (dailyVerseCountSpan) dailyVerseCountSpan.textContent = khatmahPlan.dailyTarget;
    if (khatmahDaysSpan) khatmahDaysSpan.textContent = khatmahPlan.days;

    const currentKhatmahDayBadge = document.getElementById('currentKhatmahDayBadge');
    if (currentKhatmahDayBadge) currentKhatmahDayBadge.textContent = `اليوم ${khatmahPlan.currentDay}`;

    if (khatmahStreakSpan) {
        khatmahStreakSpan.innerHTML = `<i class="fas fa-fire" style="color:#ff4500;"></i> ستريك: ${khatmahPlan.streak || 0} يوم`;
    }

    const progress = Math.min(100, ((khatmahPlan.currentDay - 1) / khatmahPlan.days) * 100);
    if (dailyProgress) dailyProgress.style.width = `${progress}%`;
    if (dailyStatusText) dailyStatusText.textContent = `أكملتُ ورد ${khatmahPlan.currentDay - 1} يومًا من أصل ${khatmahPlan.days}`;
}

// Global helper for the new buttons
window.showKhatmahPlanModal = function () {
    const modal = document.getElementById('khatmahModal');
    if (modal) modal.style.display = 'flex';
};

if (khatmahSettingsBtn) {
    khatmahSettingsBtn.addEventListener('click', () => {
        khatmahModal.style.display = 'flex';
    });
}

if (closeKhatmahModal) {
    closeKhatmahModal.addEventListener('click', () => {
        const modal = document.getElementById('khatmahModal');
        if (modal) modal.style.display = 'none';
    });
}

// Close logic removed as per user request to keep planner permanent

document.querySelectorAll('.khatmah-opt').forEach(btn => {
    btn.addEventListener('click', () => {
        const days = parseInt(btn.getAttribute('data-days'));
        setKhatmahPlan(days);
    });
});

const setCustomKhatmahBtn = document.getElementById('setCustomKhatmahBtn');
const customDaysInput = document.getElementById('customDaysInput');
if (setCustomKhatmahBtn && customDaysInput) {
    setCustomKhatmahBtn.addEventListener('click', () => {
        const days = parseInt(customDaysInput.value);
        if (days > 0) setKhatmahPlan(days);
    });
}



// Reading Settings Bar Logic
const increaseFontBtn = document.getElementById('increaseFont');
const decreaseFontBtn = document.getElementById('decreaseFont');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const readingContainer = document.querySelector('.reading-container');

function updateFontSize() {
    // Update global font size variable or specific elements
    document.querySelectorAll('.reading-text').forEach(el => {
        el.style.fontSize = `${readingFontSize}%`;
    });
    // Also save to container for new elements
    if (readingContent) readingContent.style.fontSize = `${readingFontSize}%`;

    if (fontSizeDisplay) fontSizeDisplay.textContent = `${readingFontSize}%`;
    localStorage.setItem('readingFontSize', readingFontSize);
}

if (increaseFontBtn) {
    increaseFontBtn.addEventListener('click', () => {
        if (readingFontSize < 250) {
            readingFontSize += 10;
            updateFontSize();
        }
    });
}

if (decreaseFontBtn) {
    decreaseFontBtn.addEventListener('click', () => {
        if (readingFontSize > 70) {
            readingFontSize -= 10;
            updateFontSize();
        }
    });
}

document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');

        // Remove existing theme classes
        readingContainer.classList.remove('default', 'sepia', 'night');
        readingContainer.classList.add(theme);

        // Update active class on buttons
        document.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        localStorage.setItem('readingTheme', theme);
    });
});

// Load saved reading settings helper
function loadReadingSettings() {
    const savedFontSize = localStorage.getItem('readingFontSize');
    if (savedFontSize) {
        readingFontSize = parseInt(savedFontSize);
        updateFontSize();
    }

    const savedTheme = localStorage.getItem('readingTheme');
    if (savedTheme) {
        const themeBtn = document.querySelector(`.theme-opt[data-theme="${savedTheme}"]`);
        if (themeBtn) themeBtn.click();
    }
}

// Player skip buttons
if (playerSkipBackBtn) {
    playerSkipBackBtn.addEventListener('click', () => {
        audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
    });
}

if (playerSkipForwardBtn) {
    playerSkipForwardBtn.addEventListener('click', () => {
        audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 10);
    });
}

// Lyrics Font Control Logic
function updateLyricsFontSize() {
    if (lyricsContainer) {
        lyricsContainer.style.fontSize = `${lyricsFontSize}%`;
        if (lyricsFontSizeValue) lyricsFontSizeValue.textContent = `${lyricsFontSize}%`;
        localStorage.setItem('lyricsFontSize', lyricsFontSize);
    }
}

if (increaseLyricsFont) {
    increaseLyricsFont.addEventListener('click', () => {
        if (lyricsFontSize < 300) {
            lyricsFontSize += 10;
            updateLyricsFontSize();
        }
    });
}

if (decreaseLyricsFont) {
    decreaseLyricsFont.addEventListener('click', () => {
        if (lyricsFontSize > 50) {
            lyricsFontSize -= 10;
            updateLyricsFontSize();
        }
    });
}

function loadLyricsSettings() {
    const savedSize = localStorage.getItem('lyricsFontSize');
    if (savedSize) {
        lyricsFontSize = parseInt(savedSize);
    }
    updateLyricsFontSize();
}

// Download Surah functionality (Service Worker Cache)
if (downloadSurahBtn) {
    downloadSurahBtn.addEventListener('click', () => {
        const song = songs[currentSongIndex];
        if (!song || !song.audioSrc) {
            showPointToast(0, 'لا توجد سورة محملة للتحميل');
            return;
        }

        // Check if already cached
        isUrlCached(song.audioSrc).then(cached => {
            if (cached) {
                if (confirm('هذه السورة محملة بالفعل. هل تريد إعادة تحميلها؟')) {
                    triggerDownload();
                }
            } else {
                triggerDownload();
            }
        });

        function triggerDownload() {
            downloadSurahBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';

            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                // Send download message to SW
                navigator.serviceWorker.controller.postMessage({
                    action: 'download',
                    url: song.audioSrc
                });
            } else {
                // Fallback: Just open in new tab
                window.open(song.audioSrc, '_blank');
                showPointToast(0, 'عذراً، نظام التحميل التلقائي غير مفعل حالياً. سيتم فتح الملف للتحميل اليدوي.');
            }
        }
    });
}


// Button-based Volume Control Function
function setupVolumeControls() {
    console.log("Setting up volume controls...");
    const volPlusBtn = document.getElementById('volPlusBtn');
    const volMinusBtn = document.getElementById('volMinusBtn');
    const volIndicatorFill = document.getElementById('volIndicatorFill');

    function updateVolumeUI() {
        if (volIndicatorFill && audioPlayer) {
            volIndicatorFill.style.height = `${audioPlayer.volume * 100}%`;
        }
    }

    if (volPlusBtn && volMinusBtn) {
        volPlusBtn.onclick = (e) => {
            e.stopPropagation();
            if (audioPlayer) {
                let current = Math.round(audioPlayer.volume * 10) / 10;
                let newVal = Math.min(1, current + 0.1);
                audioPlayer.volume = newVal;
                updateVolumeUI();
            }
        };

        volMinusBtn.onclick = (e) => {
            e.stopPropagation();
            if (audioPlayer) {
                let current = Math.round(audioPlayer.volume * 10) / 10;
                let newVal = Math.max(0, current - 0.1);
                audioPlayer.volume = newVal;
                updateVolumeUI();
            }
        };

        if (audioPlayer) updateVolumeUI();
    }
}

// --- Initialization ---
function init() {
    console.log("Initializing...");

    // Force sort songs by ID to ensure correct Quranic order (1, 2, 3...)
    if (songs && songs.length > 0) {
        songs.sort((a, b) => a.id - b.id);
    }

    initKhatmah();
    loadReadingSettings();
    loadLyricsSettings();
    renderSongList();

    if (songs.length > 0) {
        loadSong(songs[currentSongIndex]);
    } else {
        albumArtPlayer.src = "https://placehold.co/100x100/3a3a4e/e0e0e0?text=Athar";
        playerTrackTitle.textContent = "لا توجد سورة";
        playerTrackArtist.textContent = "يرجى اختيار سورة من القائمة";
        lyricsContainer.innerHTML = "<p>يرجى اختيار سورة لبدء القراءة والاستماع.</p>";
    }

    // Initialize volume controls
    setupVolumeControls();

    // Remove this line as we use setupVolumeControls now
    // audioPlayer.volume = playerVolumeSlider.value; 

    updatePlayPauseIcon();
    updateRepeatButtonUI();

    // Check Routing / Deep Links
    handleRouting();

    // Check for resume after a short delay to ensure UI is ready
    setTimeout(checkResumePlayback, 1000);

    // Initialize Daily Verse & Adhkar
    initDailyVerse();
    setupAdhkarFeature();

    console.log("Initialization complete.");

    // Start background caching for offline use after a delay
    setTimeout(preCacheOfflineContent, 5000);
}


// --- Adhkar System Logic ---



let tasbeehCount = 0;

function setupAdhkarFeature() {
    const navAdhkar = document.getElementById('navAdhkar');
    const adhkarPage = document.getElementById('adhkarPage');
    const adhkarHome = document.getElementById('adhkarHome');
    const adhkarDetails = document.getElementById('adhkarDetails');
    const tasbeehView = document.getElementById('tasbeehView');
    const backBtn = document.getElementById('adhkarBackBtn');
    const pageTitle = document.getElementById('adhkarPageTitle');
    const sideMenu = document.getElementById('sideMenu');

    // Nav Click
    if (navAdhkar) {
        navAdhkar.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('adhkarPage');

            // Reset views
            adhkarHome.style.display = 'grid';
            adhkarDetails.style.display = 'none';
            tasbeehView.style.display = 'none';
            backBtn.style.display = 'none';
            pageTitle.textContent = "الأذكار والسبحة";
        });
    }

    // Back Button Logic
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            adhkarHome.style.display = 'grid';
            adhkarDetails.style.display = 'none';
            tasbeehView.style.display = 'none';
            backBtn.style.display = 'none';
            pageTitle.textContent = "الأذكار والسبحة";
        });
    }

    // Tasbeeh Logic
    const tasbeehBtn = document.getElementById('tasbeehBtn');
    const tasbeehCountEl = document.getElementById('tasbeehCount');

    if (tasbeehBtn) {
        tasbeehBtn.addEventListener('click', () => {
            tasbeehCount++;
            tasbeehCountEl.textContent = tasbeehCount;
            if (navigator.vibrate) navigator.vibrate(50);
        });
    }
}

function openAdhkarCategory(type) {
    const home = document.getElementById('adhkarHome');
    const details = document.getElementById('adhkarDetails');
    const tasbeeh = document.getElementById('tasbeehView');
    const back = document.getElementById('adhkarBackBtn');
    const title = document.getElementById('adhkarPageTitle');
    const list = document.getElementById('adhkarList');

    home.style.display = 'none';
    back.style.display = 'block';

    if (type === 'tasbeeh') {
        tasbeeh.style.display = 'block';
        title.textContent = "السبحة الإلكترونية";
    } else {
        details.style.display = 'block';
        const data = adhkarData[type];
        title.textContent = type; // Use the category name directly as title

        if (window.renderAdhkarList) {
            window.renderAdhkarList(data, list);
        } else {
            renderAdhkarList(data, list);
        }

        // Initialize progress bar
        setTimeout(() => updateAdhkarProgress(), 100);
    }
}

function updateAdhkarProgress() {
    const list = document.getElementById('adhkarList');
    const items = list.querySelectorAll('.dhikr-count-badge');
    if (items.length === 0) return;

    const completed = Array.from(items).filter(el => el.textContent.includes('تم')).length;
    const total = items.length;
    const percent = Math.round((completed / total) * 100);

    const progressBar = document.getElementById('adhkarProgressBar');
    const percentEl = document.getElementById('adhkarProgressPercent');
    const statusEl = document.getElementById('adhkarProgressStatus');

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (statusEl) statusEl.textContent = `اكتمل ${completed} من ${total}`;

    // Update bar color based on progress
    if (percent === 100) {
        if (progressBar) progressBar.style.background = 'linear-gradient(90deg, #22c55e, #16a34a)';
    } else {
        if (progressBar) progressBar.style.background = 'linear-gradient(90deg, #a855f7, #ec4899)';
    }
}

function renderAdhkarList(data, container) {
    container.innerHTML = '';
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'dhikr-item';
        // Handle both data structures (new JSON uses 'content'/'description', old used 'text'/'reward')
        const text = item.content || item.text || "";
        const reward = item.description || item.reward || "";

        div.innerHTML = `
            <div class="dhikr-text">${text}</div>
            <div class="dhikr-meta">
                <div class="dhikr-reward">${reward}</div>
                <div class="dhikr-count-badge" onclick="decrementDhikr(this, ${item.count})">
                    العدد: <span class="count-val">${item.count}</span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function decrementDhikr(el, max) {
    const span = el.querySelector('.count-val');
    if (!span) return; // Already completed (shows "تم")

    let current = parseInt(span.textContent);
    if (current > 0) {
        current--;
        span.textContent = current;
        if (navigator.vibrate) navigator.vibrate(30);

        if (current === 0) {
            el.style.background = '#22c55e'; // Green when done
            el.innerHTML = '<i class="fas fa-check"></i> تم';

            // Points Hook!
            checkAdhkarCategoryCompletion();
        }

        // Update global progress bar
        updateAdhkarProgress();
    }
}

function checkAdhkarCategoryCompletion() {
    const list = document.getElementById('adhkarList');
    const items = list.querySelectorAll('.dhikr-count-badge');
    const allDone = Array.from(items).every(el => el.textContent.includes('تم'));

    if (allDone && items.length > 0) {
        // Corrected ID from adhkarCategoryTitle to adhkarPageTitle
        const titleEl = document.getElementById('adhkarPageTitle');
        const title = titleEl ? titleEl.textContent : "";

        // Award points for any completed Adhkar category, not just morning/evening
        // 120 points for major adhkar, 50 for others
        const points = (title.includes('الصباح') || title.includes('المساء')) ? 120 : 50;

        awardPoints(points, 'أذكار');
        // Alert removed in favor of Toast
    }
}

function resetTasbeeh() {
    tasbeehCount = 0;
    document.getElementById('tasbeehCount').textContent = '0';
}

init();
loadLocalTafsirFiles();
loadAdhkarData(); // تحميل جميع الأذكار من ملفات JSON

// (Tafsir selection listener moved to tafsir_logic.js)

// --- Tafsir Feature Logic ---
function openTafsir(surahNum, verseNum) {
    if (!tafsirDrawer) return;

    tafsirDrawer.classList.add('active');
    tafsirVerseRef.textContent = `${surahNum}:${verseNum}`;

    // Show loading state
    tafsirBody.innerHTML = `
        <div class="tafsir-loading">
            <div class="spinner"></div>
            <p>جاري تحميل التفسير...</p>
        </div>
    `;

    fetchTafsirData(surahNum, verseNum);
}

window.closeTafsir = function () {
    if (tafsirDrawer) {
        tafsirDrawer.classList.remove('active');
    }
};

// --- Local Tafsir Loader ---
async function loadLocalTafsirFiles() {
    // Load Jalalayn
    try {
        const response = await fetch('ar.jalalayn.txt');
        if (response.ok) {
            const text = await response.text();
            localTafsirData = parseTafsirText(text);
            console.log("Successfully loaded local Tafsir (Jalalayn)");
        }
    } catch (e) { console.error("Error loading Jalalayn:", e); }

    // Load Ibn Kathir
    try {
        const response = await fetch('ar.ibnkathir.txt');
        if (response.ok) {
            const text = await response.text();
            window.localIbnKathirData = parseTafsirText(text);
            console.log("Successfully loaded local Tafsir (Ibn Kathir)");
        }
    } catch (e) { console.error("Error loading Ibn Kathir:", e); }
}

function parseTafsirText(text) {
    const data = {};
    const lines = text.split(/\r?\n/);
    lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split('|');
        if (parts.length >= 3) {
            const key = `${parts[0]}:${parts[1]}`;
            data[key] = parts.slice(2).join('|').trim();
        }
    });
    return data;
}




// Collective Khatmah Logic Removed (Cleaned Up)

// Local Creation Fallback
// Khatmah functions removed

function openGroupDetails(id) {
    activeGroupId = id;
    const group = collectiveGroups.find(g => g.id === id);
    if (!group) return;

    document.getElementById('collInitialView').style.display = 'none';
    const detailView = document.getElementById('groupDetailsView');
    detailView.style.display = 'block';

    document.getElementById('activeGroupName').textContent = group.name;
    document.getElementById('activeGroupDeadline').textContent = `الختم خلال: ${group.duration} يوم (${group.deadline}) | الكود: ${group.code}`;
    document.getElementById('groupMemberCount').textContent = group.members.length;

    // Admin Controls
    const headerContent = detailView.querySelector('.active-group-header');
    let adminControls = document.getElementById('adminControls');

    // Create controls if not exist
    if (!adminControls) {
        adminControls = document.createElement('div');
        adminControls.id = 'adminControls';
        adminControls.className = 'admin-controls';
        headerContent.appendChild(adminControls);
    }

    if (group.admin === "أنت") {
        adminControls.innerHTML = `
            <button onclick="deleteGroup(${group.id})" class="admin-btn delete-btn">
                <i class="fas fa-trash-alt"></i> حذف المجموعة
            </button>
        `;
        adminControls.style.display = 'block';
    } else {
        adminControls.style.display = 'none';
    }

    renderLeaderboard(group);
}

function renderLeaderboard(group) {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';

    // Sort members by points descending
    const sortedMembers = [...group.members].sort((a, b) => (b.points || 0) - (a.points || 0));
    const maxPoints = Math.max(...group.members.map(m => m.points || 1));

    if (document.getElementById('groupTotalPoints')) {
        document.getElementById('groupTotalPoints').textContent = group.members.reduce((acc, m) => acc + (m.points || 0), 0);
    }

    sortedMembers.forEach((m, index) => {
        const item = document.createElement('div');
        item.className = `rank-item ${index === 0 ? 'top-1' : ''}`;

        const avatarColor = m.isMe ? '#a855f7' : '#4f46e5';
        const percent = Math.round(((m.points || 0) / maxPoints) * 100);

        item.innerHTML = `
            <div class="rank-badge">${index + 1}</div>
            <div class="rank-avatar" style="background:${avatarColor}">${m.name[0]}</div>
            <div class="rank-info">
                <div class="rank-name-row">
                    <span class="rank-name">${m.name} ${m.isMe ? '(أنت)' : ''}</span>
                    <span class="rank-percent">${m.points || 0} نقطة</span>
                </div>
                <div class="rank-progress-bg">
                    <div class="rank-progress-fill" style="width: ${percent}%"></div>
                </div>
            </div>
            ${index === 0 ? '<i class="fas fa-crown" style="color:#eab308; margin-right:10px;"></i>' : ''}
        `;
        list.appendChild(item);
    });
}

// Khatmah related functions removed

function copyGroupCode() {
    const group = collectiveGroups.find(g => g.id === activeGroupId);
    if (group) {
        navigator.clipboard.writeText(group.code).then(() => {
            alert("تم نسخ رمز المجموعة: " + group.code);
        });
    }
}

function renderGroups() {
    const list = document.getElementById('activeGroupsList');
    if (!list) return;

    if (collectiveGroups.length === 0) {
        list.innerHTML = '<p class="empty-msg">لا توجد مجموعات منضمة حالياً</p>';
        return;
    }

    list.innerHTML = '';
    collectiveGroups.forEach(g => {
        const div = document.createElement('div');
        div.className = 'group-item';
        div.style.cssText = "background:rgba(255,255,255,0.05); border-radius:12px; padding:15px; margin-bottom:10px; cursor:pointer;";
        div.onclick = () => openGroupDetails(g.id);
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 style="margin:0; color:#fff;">${g.name}</h4>
                    <span style="font-size:0.8rem; color:#888;">الكود: ${g.code}</span>
                </div>
                <i class="fas fa-chevron-left" style="color:#a855f7;"></i>
            </div>
        `;
        list.appendChild(div);
    });
}

// --- New Khatmah Page Logic ---
function showKhatmahPage() {
    navigateTo('khatmahPage');
    switchKhatmahPageTab('myGroups'); // Default to my groups
}
const backToHomeFromKhatmahBtn = document.getElementById('backToHomeFromKhatmahBtn');
if (backToHomeFromKhatmahBtn) backToHomeFromKhatmahBtn.onclick = () => navigateTo('homePage');

function switchKhatmahPageTab(tabName) {
    document.querySelectorAll('.k-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.khatmah-section').forEach(s => s.style.display = 'none');

    if (tabName === 'myGroups') {
        document.getElementById('tabMyGroups').classList.add('active');
        document.getElementById('myGroupsSection').style.display = 'block';
        renderGroups(); // Refresh my groups
    } else {
        document.getElementById('tabGlobalRank').classList.add('active');
        document.getElementById('globalRankSection').style.display = 'block';
        renderGlobalLeaderboard();
    }
}

function renderGlobalLeaderboard() {
    const list = document.getElementById('globalGroupsList');
    list.innerHTML = '';

    // Generate Mock Data for Top 50
    const mockData = [];
    const groupNamesPrefix = ["مجموعة", "حلقة", "أهل", "شباب", "فتيات", "صحبة"];
    const groupNamesSuffix = ["القرآن", "النور", "الهدى", "الجنة", "الفلاح", "التدبر", "الإخلاص", "الريان"];

    // Use REAL groups from storage
    if (collectiveGroups.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:30px; color:#cbd5e1; background:rgba(255,255,255,0.05); border-radius:12px;">
                <i class="fas fa-trophy" style="font-size:3rem; margin-bottom:15px; color:#64748b; opacity:0.5;"></i>
                <p>لا توجد مجموعات متصدرة حتى الان.</p>
                <p style="font-size:0.85rem; color:#94a3b8;">أنشئ مجموعتك الأولى واجمع النقاط لتتصدر القائمة!</p>
            </div>
        `;
        return;
    }

    // Calculate Score for each group & Sort
    const rankedGroups = collectiveGroups.map(g => {
        const totalPoints = g.members.reduce((acc, m) => acc + (m.points || 0), 0);
        return { ...g, totalPoints };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    rankedGroups.forEach((g, index) => {
        const rank = index + 1;
        const item = document.createElement('div');
        item.className = `global-rank-item ${rank <= 3 ? 'top-rank' : ''}`;

        let trophy = '';
        if (rank === 1) trophy = '<i class="fas fa-trophy" style="color:#fbbf24"></i>';
        else if (rank === 2) trophy = '<i class="fas fa-trophy" style="color:#94a3b8"></i>';
        else if (rank === 3) trophy = '<i class="fas fa-trophy" style="color:#b45309"></i>';
        else trophy = `<span class="rank-num">#${rank}</span>`;

        item.innerHTML = `
            <div class="g-rank-pos">${trophy}</div>
            <div class="g-rank-info">
                <div class="g-group-name">${g.name}</div>
                <div class="g-group-meta">
                    <span><i class="fas fa-users"></i> ${g.members.length}</span>
                    <span style="font-size:0.75rem; margin-right:5px; opacity:0.7;">(الكود: ${g.code})</span>
                </div>
            </div>
            <div class="g-rank-score">${g.totalPoints} نقطة</div>
        `;
        list.appendChild(item);
    });

    // End of real logic, ignoring the rest of the old function which will be invalid now.
    // I will return early to avoid running the old loop.
    return;

    /* OLD MOCK DATA LOOP BELOW (Disabled) */
    if (false) {
        for (let i = 0; i < 50; i++) {
            // Uniform naming as requested: "أقوى مجموعة في الموقع"
            // Adding a number to distinguish them, or just keeping the text clean if strict match needed.
            // User said: "اكتب اقوى مجموعة في الموقع" (singular). 
            // To make it a list, "أقوى مجموعة في الموقع 1", "أقوى مجموعة في الموقع 2", etc. makes sense contextually.
            let name = `أقوى مجموعة في الموقع ${i + 1}`;

            let score = 0;
            if (i === 0) score = 5000;
            else score = Math.floor(5000 - (i * (Math.random() * 80 + 20)));

            mockData.push({ name, score, rank: i + 1, members: Math.floor(Math.random() * 20 + 5) });
        }
    }

    // Attempt to inject user's best group if high enough (Simulator)
    // collectiveGroups.forEach(g => ... ) - Out of scope for simple mock, keeping it strict to mock data + user request

    mockData.forEach(g => {
        const item = document.createElement('div');
        item.className = `global-rank-item ${g.rank <= 3 ? 'top-rank' : ''}`;

        let trophy = '';
        if (g.rank === 1) trophy = '<i class="fas fa-trophy" style="color:#fbbf24"></i>';
        else if (g.rank === 2) trophy = '<i class="fas fa-trophy" style="color:#94a3b8"></i>';
        else if (g.rank === 3) trophy = '<i class="fas fa-trophy" style="color:#b45309"></i>';
        else trophy = `<span class="rank-num">#${g.rank}</span>`;

        item.innerHTML = `
            <div class="g-rank-pos">${trophy}</div>
            <div class="g-rank-info">
                <div class="g-group-name">${g.name}</div>
                <div class="g-group-meta"><i class="fas fa-users"></i> ${g.members} عضو</div>
            </div>
            <div class="g-rank-score">${g.score} نقطة</div>
        `;
        list.appendChild(item);
    });
}

// Automatically update progress when reading
function hookProgressToGroups(versesRead) {
    awardPoints(versesRead, 'قراءة'); // 1 verse = 1 point
    // Also check if we should update global leaderboard logic (not needed for mock)
}

// Add global listener for Tafsir Close button
if (closeTafsirBtn) {
    closeTafsirBtn.onclick = (e) => {
        e.preventDefault();
        closeTafsir();
    };
}

function updateActiveNav(element) {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

/* --- Side Menu Logic for Bottom Nav --- */
function openSideMenu() {
    const menu = document.getElementById('sideMenu');
    if (menu) {
        menu.classList.add('active');
        // Ensure z-index is higher than bottom nav
        menu.style.zIndex = '10000';
    }
}

function closeSidebar() {
    const menu = document.getElementById('sideMenu');
    if (menu) menu.classList.remove('active');
}

// Ensure close button works
const closeBtn = document.getElementById('closeMenuBtn');
if (closeBtn) closeBtn.onclick = closeSidebar;

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('sideMenu');
    const menuBtn = document.getElementById('menuBtn');

    if (menu && menu.classList.contains('active') &&
        !menu.contains(e.target) &&
        !e.target.closest('.nav-item') && // Don't close if clicking the bottom nav button
        !e.target.closest('#menuBtn')) {
        closeSidebar();
    }
});

/* --- Immersive Mode Logic --- */
const toggleImmersiveBtn = document.getElementById('toggleImmersiveBtn');
if (toggleImmersiveBtn) {
    toggleImmersiveBtn.addEventListener('click', toggleImmersiveMode);
}

// Create Exit Button dynamically
const exitBtn = document.createElement('button');
exitBtn.id = 'exitImmersiveBtn';
exitBtn.innerHTML = '<i class="fas fa-compress"></i>';
exitBtn.title = 'خروج من وضع التدبر';
exitBtn.onclick = toggleImmersiveMode;
document.body.appendChild(exitBtn);

function toggleImmersiveMode() {
    document.body.classList.toggle('immersive-mode');

    // Auto-hide side menu if open
    if (sideMenu && sideMenu.classList.contains('active')) {
        sideMenu.classList.remove('active');
    }
}

// --- New Khatmah Buttons Logic ---

// showKhatmahPlanModal moved to global window scope earlier for modal support
function showCurrentKhatmahStatus() {
    const savedPlan = localStorage.getItem('khatmahPlan');
    if (savedPlan) {
        const plan = JSON.parse(savedPlan);
        const day = plan.currentDay || 1;
        showPointToast(0, `خطتك الحالية: اليوم ${day} من ${plan.days}`);
    } else {
        showKhatmahPlanModal();
    }
}

function resumeReading() {
    const saved = JSON.parse(localStorage.getItem('lastReadProgress') || 'null');
    if (saved && saved.surahId) {
        const surah = songs.find(s => s.id == saved.surahId);
        if (surah) {
            openReadingSurah(surah);
        }
    } else {
        if (typeof showPointToast === 'function') {
            showPointToast(0, "لم تقرأ شيئاً بعد للمتابعة");
        } else {
            showPointToast(0, "لا يوجد تقدم محفوظ للمتابعة");
        }
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }

    // --- Smart Assistant Settings Logic ---
    const aiToggle = document.getElementById('aiToggle');
    if (aiToggle) {
        // Initialize toggle state from localStorage (default is true)
        aiToggle.checked = localStorage.getItem('ai_enabled') !== 'false';

        // Handle toggle change
        aiToggle.addEventListener('change', (e) => {
            if (window.SmartCompanion) {
                window.SmartCompanion.toggleAI(e.target.checked);
            }
        });
    }
}

/**
 * Premium Toast System for Points and Feedback
 * Replaces primitive alerts with high-end floating notifications
 */
function showPointToast(points, message) {
    let container = document.getElementById('point-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'point-toast-container';
        container.className = 'point-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'point-toast';

    // Arabic RTL Check
    const isArabic = /[\u0600-\u06FF]/.test(message);
    if (isArabic) toast.style.direction = 'rtl';

    let content = '';
    if (points > 0) {
        content += `<div class="toast-points">+${points}</div>`;
    }
    content += `<div class="toast-msg">${message}</div>`;

    toast.innerHTML = content;
    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 500);
    }, 4000);
}

// Ensure it's globally accessible
window.showPointToast = showPointToast;

/**
 * Global bridge to ScoreEngine for awarding points from various modules
 */
function awardPoints(points, reason) {
    if (window.ScoreEngine) {
        // Convert points to 'pages' unit for the Reading engine (1 page = 10 points)
        const units = Math.round(points / 10);
        if (units > 0) {
            window.ScoreEngine.addReadingScore(units);
        }
    }
}
window.awardPoints = awardPoints;