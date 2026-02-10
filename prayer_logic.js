// --- Prayer Times Logic ---

const PRAYER_NAMES = {
    'Fajr': 'الفجر',
    'Sunrise': 'الشروق',
    'Dhuhr': 'الظهر',
    'Asr': 'العصر',
    'Maghrib': 'المغرب',
    'Isha': 'العشاء'
};

let currentPrayerTimes = null;
let currentCity = "";
let countdownInterval = null;

function setupPrayerFeature() {
    const navPrayer = document.getElementById('navPrayer');
    if (navPrayer) {
        navPrayer.addEventListener('click', (e) => {
            e.preventDefault();
            showPrayerPage();
            initPrayerTimes();

            // Set active menu item
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            navPrayer.classList.add('active');
        });
    }

    const refreshBtn = document.getElementById('refreshLocation');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            localStorage.removeItem('manualCity'); // Clear manual override
            initPrayerTimes(true);
        });
    }

    // Manual Location Modal Logic
    const changeBtn = document.getElementById('changeLocationBtn');
    const modal = document.getElementById('locationModal');
    const closeBtn = document.getElementById('closeLocationModal');
    const saveBtn = document.getElementById('saveCityBtn');

    if (changeBtn) {
        changeBtn.addEventListener('click', () => modal.style.display = 'flex');
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', searchAndSetCity);
    }

    // Adhan Toggle Persistence
    const adhanToggle = document.getElementById('adhanToggle');
    const adhanSoundSelect = document.getElementById('adhanSoundSelect');
    const pToggles = document.querySelectorAll('.p-adhan-toggle');

    // Load Main Toggle
    const savedAdhan = localStorage.getItem('adhanEnabled');
    if (adhanToggle) {
        adhanToggle.checked = savedAdhan === 'true';
        adhanToggle.addEventListener('change', (e) => {
            localStorage.setItem('adhanEnabled', e.target.checked);
        });
    }

    // Load Sound Selection
    const savedSound = localStorage.getItem('adhanSoundUrl');
    if (adhanSoundSelect) {
        if (savedSound) adhanSoundSelect.value = savedSound;
        adhanSoundSelect.addEventListener('change', (e) => {
            localStorage.setItem('adhanSoundUrl', e.target.value);
            // Optional: Preview sound?
        });
    }

    // Load Individual Toggles
    const prayerSettings = JSON.parse(localStorage.getItem('prayerAdhanSettings') || '{}');
    pToggles.forEach(toggle => {
        const prayer = toggle.dataset.prayer;
        if (prayerSettings[prayer] !== undefined) {
            toggle.checked = prayerSettings[prayer];
        }
        toggle.addEventListener('change', (e) => {
            const currentSettings = JSON.parse(localStorage.getItem('prayerAdhanSettings') || '{}');
            currentSettings[prayer] = e.target.checked;
            localStorage.setItem('prayerAdhanSettings', JSON.stringify(currentSettings));
        });
    });

    // System Notification Toggle Persistence
    const systemNotifToggle = document.getElementById('systemNotifToggle');
    if (systemNotifToggle) {
        // Sync with permission state and saved setting
        const savedNotif = localStorage.getItem('systemNotifEnabled');
        systemNotifToggle.checked = (Notification.permission === 'granted' && savedNotif !== 'false');

        systemNotifToggle.addEventListener('change', (e) => {
            localStorage.setItem('systemNotifEnabled', e.target.checked);
        });
    }

    // Custom Adhan Upload Handle
    const customAdhanBtn = document.getElementById('uploadAdhanBtn');
    const customAdhanInput = document.getElementById('customAdhanInput');

    if (customAdhanBtn && customAdhanInput) {
        customAdhanBtn.addEventListener('click', () => customAdhanInput.click());

        customAdhanInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                alert("حجم الملف كبير جداً، يرجى اختيار ملف أقل من 5 ميجابايت");
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const base64 = event.target.result;
                localStorage.setItem('customAdhanData', base64);
                // Switch select to custom automatically
                if (adhanSoundSelect) {
                    adhanSoundSelect.value = 'custom';
                    localStorage.setItem('adhanSoundUrl', 'custom');
                }
                alert("تم رفع الأذان الخاص بك بنجاح!");
            };
            reader.readAsDataURL(file);
        });
    }
}

async function initPrayerTimes(forceRefresh = false) {
    const userLocationSpan = document.getElementById('userLocation');

    // 1. Check if user set a manual city override
    const manualCity = localStorage.getItem('manualCity');
    if (manualCity && !forceRefresh) {
        currentCity = manualCity;
        userLocationSpan.innerText = currentCity;
        // Search coords for this city and load
        await searchAndSetCity(manualCity);
        return;
    }

    // Check if we have cached times for today
    const today = new Date().toDateString();
    const cachedData = localStorage.getItem('prayerTimesData');
    const cachedJSON = cachedData ? JSON.parse(cachedData) : null;

    if (!forceRefresh && cachedJSON && cachedJSON.date === today) {
        console.log("Using cached prayer times");
        currentPrayerTimes = cachedJSON.times;
        currentCity = cachedJSON.city;
        userLocationSpan.innerText = currentCity;
        displayPrayerTimes(currentPrayerTimes);
        if (cachedJSON.hijri) {
            document.getElementById('fullDateInfo').innerText = `${cachedJSON.hijri} | ${new Date().toLocaleDateString('ar-DZ')}`;
        }
        startCountdown();
        return;
    }

    userLocationSpan.innerText = "تحديد موقعك...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            await fetchPrayerTimes(lat, lng);
        }, async (error) => {
            console.warn("Geolocation failed, using default (Mecca)");
            await fetchPrayerTimes(21.4225, 39.8262); // Default to Mecca
            userLocationSpan.innerText = "مكة المكرمة (افتراضي)";
        });
    } else {
        await fetchPrayerTimes(21.4225, 39.8262);
        userLocationSpan.innerText = "مكة المكرمة (افتراضي)";
    }
}

async function searchAndSetCity(cityName = null) {
    const input = document.getElementById('citySearchInput');
    const city = (typeof cityName === 'string') ? cityName : input.value.trim();

    if (!city) return;

    const modal = document.getElementById('locationModal');
    document.getElementById('userLocation').innerText = "جاري البحث...";
    if (modal) modal.style.display = 'none';

    try {
        // Geocode city name to Lat/Lng - Using general query 'q' for better results on municipalities/districts
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            // Display name: prioritizes locality/municipality if available
            const displayName = data[0].address.city || data[0].address.town || data[0].address.village || data[0].address.municipality || data[0].display_name.split(',')[0];

            currentCity = displayName;
            localStorage.setItem('manualCity', currentCity);
            await fetchPrayerTimes(lat, lng);
        } else {
            alert("لم يتم العثور على المدينة، يرجى التحقق من الاسم.");
            document.getElementById('userLocation').innerText = "خطأ في التحديد";
        }
    } catch (error) {
        console.error("Geocoding failed", error);
    }
}

async function fetchPrayerTimes(lat, lng) {
    try {
        // Fetch city name from coordinates (Reverse Geocoding)
        const geoResp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`);
        const geoData = await geoResp.json();
        currentCity = geoData.city || geoData.locality || "موقعك الحالي";
        document.getElementById('userLocation').innerText = currentCity;

        // Fetch Prayer Times
        const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=3`); // Method 3 is Muslim World League
        const data = await response.json();

        if (data.code === 200) {
            currentPrayerTimes = data.data.timings;
            const hijri = data.data.date.hijri;
            const hijriDate = `${hijri.day} ${hijri.month.ar} ${hijri.year}`;

            document.getElementById('fullDateInfo').innerText = `${hijriDate} | ${new Date().toLocaleDateString('ar-DZ')}`;

            // Cache results
            localStorage.setItem('prayerTimesData', JSON.stringify({
                date: new Date().toDateString(),
                times: currentPrayerTimes,
                city: currentCity,
                hijri: hijriDate
            }));

            displayPrayerTimes(currentPrayerTimes);
            startCountdown();
        }
    } catch (error) {
        console.error("Failed to fetch prayer times", error);
    }
}

function displayPrayerTimes(times) {
    for (const [key, name] of Object.entries(PRAYER_NAMES)) {
        const timeEl = document.getElementById(`time-${key}`);
        if (timeEl) {
            timeEl.innerText = times[key];
        }
    }
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    // Initial run
    updateNextPrayer();

    // Standard interval
    countdownInterval = setInterval(updateNextPrayer, 1000);

    // --- PRO HACK: Background Watchdog ---
    // This keeps the JS thread alive on many Android devices by mimicking a media session
    startSilentGuard();
}

let silentGuardAudio = null;
function startSilentGuard() {
    if (silentGuardAudio) return;

    // Tiny silent base64 mp3 (0.1s of silence)
    const silentSrc = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

    silentGuardAudio = new Audio(silentSrc);
    silentGuardAudio.loop = true;

    // Logic: Play when app goes to background to keep process alive
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            silentGuardAudio.play().catch(() => {
                console.log("Silent guard blocked by browser. User needs to interact first.");
            });
        }
    });

    // Also try to request Wake Lock if supported
    if ('wakeLock' in navigator) {
        let wakeLock = null;
        const requestWakeLock = async () => {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) { }
        };
        document.addEventListener('visibilitychange', () => {
            if (wakeLock !== null && document.visibilityState === 'visible') requestWakeLock();
        });
        requestWakeLock();
    }
}

function updateNextPrayer() {
    if (!currentPrayerTimes) return;

    const now = new Date();
    const times = [];

    // Convert prayer times to Date objects
    for (const [key, value] of Object.entries(currentPrayerTimes)) {
        if (!PRAYER_NAMES[key]) continue;

        const [hours, minutes] = value.split(':');
        const pDate = new Date();
        pDate.setHours(parseInt(hours), parseInt(minutes), 0);

        times.push({ name: key, time: pDate });
    }

    // Sort times
    times.sort((a, b) => a.time - b.time);

    // Find next prayer
    let next = times.find(p => p.time > now);

    // If no next prayer today, it's Fajr tomorrow
    if (!next) {
        next = { ...times[0] };
        next.time = new Date(next.time.getTime() + 24 * 60 * 60 * 1000);
    }

    // Update UI
    document.getElementById('nextPrayerName').innerText = `الصلاة القادمة: ${PRAYER_NAMES[next.name]}`;
    document.getElementById('nextPrayerTime').innerText = currentPrayerTimes[next.name];

    // Highlight active/previous prayer
    highlightCurrentPrayer(times, now);

    // Calculate diff
    const diff = next.time - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    document.getElementById('prayerCountdown').innerText = `متبقي ${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Check for Adhan Time (with a wider window for background reliability)
    const adhanKey = `adhan_played_${next.name}_${now.toDateString()}`;
    // Increase detection window to 10 seconds for deep sleep wakeups
    if (diff <= 10000 && diff > 0 && !localStorage.getItem(adhanKey)) {
        localStorage.setItem(adhanKey, 'true');
        console.log(`Triggering Adhan for ${next.name}`);
        playAdhan(next.name);
    }

    // Clear old adhan keys at midnight
    if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() < 2) {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('adhan_played_')) localStorage.removeItem(key);
        });
    }
}

function highlightCurrentPrayer(times, now) {
    let current = null;
    for (let i = times.length - 1; i >= 0; i--) {
        if (times[i].time <= now) {
            current = times[i];
            break;
        }
    }

    // If before Fajr, previous was Isha yesterday
    if (!current) current = times[times.length - 1];

    document.querySelectorAll('.prayer-time-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.prayer === current.name) {
            el.classList.add('active');
        }
    });
}

async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.warn("هذا المتصفح لا يدعم التنبيهات");
        return false;
    }

    // Force a visual feedback if already denied
    if (Notification.permission === "denied") {
        alert("تنبيه: لقد قمت بحظر الإشعارات مسبقاً. لكي يعمل الأذان، يرجى تفعيل الإشعارات من إعدادات المتصفح/الهاتف.");
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            return true;
        }
    } catch (e) {
        console.error("Error requesting permission", e);
    }
    return false;
}

function showNotificationSystem(title, options = {}) {
    const defaultOptions = {
        icon: 'favicon.png',
        badge: 'favicon.png',
        vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40],
        tag: options.tag || 'adhan-notification',
        renotify: true,
        requireInteraction: true,
        sticky: true, // For Android: keeps notification until dismissed
        priority: 'max', // Legacy
        importance: 'max', // For modern Android
        silent: false, // Ensure it's not silent
        dir: 'rtl',
        ...options
    };

    // Use ServiceWorkerRegistration for better background reliability
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            // Check for Notification Triggers support (if we want to schedule ahead)
            if (options.scheduleAt && 'showTrigger' in Notification.prototype) {
                defaultOptions.showTrigger = new TimestampTrigger(options.scheduleAt);
            }
            registration.showNotification(title, defaultOptions);
        }).catch(err => {
            console.error("SW Notification failed", err);
            // Final fallback
            if (Notification.permission === "granted") new Notification(title, defaultOptions);
        });
    } else if (Notification.permission === "granted") {
        new Notification(title, defaultOptions);
    }
}

function playAdhan(prayerName) {
    const adhanEnabled = localStorage.getItem('adhanEnabled') === 'true';
    if (!adhanEnabled) return;

    // Check specific prayer setting
    if (prayerName) {
        const prayerSettings = JSON.parse(localStorage.getItem('prayerAdhanSettings') || '{}');
        if (prayerSettings[prayerName] === false) return;
    }

    const adhanAudio = document.getElementById('adhanAudio');
    if (adhanAudio) {
        const selectedSound = localStorage.getItem('adhanSoundUrl');
        if (selectedSound === 'custom') {
            const customData = localStorage.getItem('customAdhanData');
            if (customData) adhanAudio.src = customData;
        } else if (selectedSound) {
            adhanAudio.src = selectedSound;
        }

        // Play immediately
        adhanAudio.play().catch(e => console.warn("Audio play blocked - needs user interaction once"));

        // Trigger Notification
        const title = prayerName ? `حان الآن موعد أذان ${PRAYER_NAMES[prayerName]}` : "حان الآن موعد الأذان";
        showNotificationSystem(title, {
            body: "حي على الصلاة.. حي على الفلاح",
            tag: 'adhan-notification',
            renotify: true,
            requireInteraction: true // Keep notification until user clicks
        });
    }
}

function showPrayerPage() {
    navigateTo('prayerPage');
}

// Global init for navigation
document.addEventListener('DOMContentLoaded', () => {
    setupPrayerFeature();
    initQiblaFeature(); // Initialize Compass Logic

    // Ask for Notification permission
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
});

// --- Qibla Compass Logic ---
let qiblaBearing = 0;

function initQiblaFeature() {
    // 1. Calculate Qibla when user location is found
    // We hook into the existing location logic by checking periodically or event
    // For now, let's just make a function we call when location updates
}

function updateQiblaDirection(lat, lng) {
    const KAABA_LAT = 21.4225;
    const KAABA_LON = 39.8262;

    const toRad = deg => deg * Math.PI / 180;
    const toDeg = rad => rad * 180 / Math.PI;

    const phi1 = toRad(lat);
    const phi2 = toRad(KAABA_LAT);
    const deltaLambda = toRad(KAABA_LON - lng);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    qiblaBearing = (toDeg(Math.atan2(y, x)) + 360) % 360;

    // Rotate the arrow immediately relative to the dial (N is 0)
    const arrow = document.querySelector('.compass-arrow');
    if (arrow) {
        arrow.style.transform = `translate(-50%, -50%) rotate(${qiblaBearing}deg)`;
    }

    document.getElementById('qiblaStatus').innerText = `اتجاه القبلة: ${Math.round(qiblaBearing)}°`;
}

// Hook into fetchPrayerTimes to update Qibla
const originalFetch = fetchPrayerTimes;
fetchPrayerTimes = async function (lat, lng) {
    updateQiblaDirection(lat, lng);
    return await originalFetch(lat, lng);
};

// Device Orientation Handler
function startCompass() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function (event) {
            let heading = event.alpha; // Z-axis rotation

            // Android fallback for absolute heading
            if (event.webkitCompassHeading) {
                heading = event.webkitCompassHeading;
            }

            if (heading == null) return;

            // Rotate the entire compass dial so 'N' points North (-heading)
            const compass = document.getElementById('compass');
            if (compass) {
                // Adjust for Qibla: We want the Arrow (which is at qiblaBearing on dial) to point to real Qibla
                // Visual Dial 'N' is at 0 deg on dial.
                // We want Visual Dial 'N' to point to Real North.
                // Compass Heading = Real Azimuth of device top.
                // So we rotate dial by -heading.
                compass.style.transform = `rotate(${-heading}deg)`;
            }
        }, true);
    } else {
        document.getElementById('qiblaStatus').innerText = "جهازك لا يدعم البوصلة";
    }
}

// Start compass when prayer page opens
const originalShowPrayerPage = showPrayerPage;
showPrayerPage = function () {
    originalShowPrayerPage();
    startCompass();

    // iOS Permission Check
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') startCompass();
            })
            .catch(console.error);
    }
};
