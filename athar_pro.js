/**
 * Athar Pro - Advanced App Logic
 * Points: 1 (Offline Hub), 2 (Visual Journey), 3 (Silent Guardian), 6 (Progress Share)
 */

window.AtharPro = {
    init() {
        console.log("💎 Athar Pro Features Initialized");
        this.updateStorageUI();
        this.refreshMilestones();
        this.initSilentGuardian();
        this.updateStatsDashboard();
        this.requestPersistence(); // Ask browser to keep data safe

        // Default back to classic theme and remove old saved themes
        localStorage.removeItem('mushaf_theme');
        this.setMushafTheme('classic');
    },

    async requestPersistence() {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persisted();
            if (!isPersisted) {
                await navigator.storage.persist();
            }
        }
    },

    // --- 1. Offline Hub Logic ---
    async updateStorageUI() {
        if (!('caches' in window)) return;

        const storageContainer = document.getElementById('offlineManagerList');
        const statsText = document.getElementById('storageStatsText');
        const storageBar = document.getElementById('storageBarFill');
        if (!storageContainer) return;

        storageContainer.innerHTML = '<p style="text-align:center; padding:10px; opacity:0.5;">جاري فحص الذاكرة...</p>';

        try {
            const cache = await caches.open('quran-media-cache');
            const keys = await cache.keys();

            if (keys.length === 0) {
                storageContainer.innerHTML = '<p style="text-align:center; padding:20px; opacity:0.5;">لا توجد سور محملة حالياً.</p>';
                if (statsText) statsText.textContent = "0 MB مستخدم";
                if (storageBar) storageBar.style.width = "0%";
                return;
            }

            storageContainer.innerHTML = '';
            const downloadedMap = new Map();

            for (const request of keys) {
                const url = request.url;
                const song = songs.find(s => s.audioSrc === url || s.videoBgSrc === url);
                if (song) {
                    if (!downloadedMap.has(song.id)) downloadedMap.set(song.id, { title: song.title, count: 0 });
                    downloadedMap.get(song.id).count++;
                }
            }

            downloadedMap.forEach((info, id) => {
                const item = document.createElement('div');
                item.className = 'downloaded-item';
                item.innerHTML = `
                    <span>سورة ${info.title}</span>
                    <button class="delete-download-btn" onclick="AtharPro.deleteSurahDownload('${id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                `;
                storageContainer.appendChild(item);
            });

            // Use native storage estimation for accuracy
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const usedMB = (estimate.usage / (1024 * 1024)).toFixed(1);

                if (statsText) statsText.textContent = `${usedMB} MB مستخدم من الذاكرة`;

                const percent = Math.min(100, (estimate.usage / estimate.quota) * 100) || 0;
                if (storageBar) {
                    storageBar.style.width = `${percent}%`;
                    // Color coding based on usage
                    if (percent < 50) storageBar.style.background = 'linear-gradient(90deg, #22c55e, #10b981)'; // Green
                    else if (percent < 80) storageBar.style.background = 'linear-gradient(90deg, #facc15, #eab308)'; // Yellow
                    else storageBar.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)'; // Red
                }
            } else {
                // Fallback for older browsers
                const mbUsed = Math.round(keys.length * 3.5);
                if (statsText) statsText.textContent = `${mbUsed} MB مستخدم تقريباً`;
                const percent = Math.min(100, (mbUsed / 500) * 100);
                if (storageBar) storageBar.style.width = `${percent}%`;
            }

        } catch (e) {
            console.error("Storage UI error", e);
        }
    },

    async deleteSurahDownload(surahId) {
        const song = songs.find(s => s.id == surahId);
        if (!song || !confirm(`هل أنت متأكد من حذف ملفات سورة ${song.title} لتوفير مساحة؟`)) return;

        const cache = await caches.open('quran-media-cache');
        if (song.audioSrc) await cache.delete(song.audioSrc);
        if (song.videoBgSrc) await cache.delete(song.videoBgSrc);

        if (typeof showPointToast === 'function') showPointToast(0, `تم حذف ملفات سورة ${song.title}`);
        this.updateStorageUI();
    },

    // --- 2. Visual Journey Logic ---
    refreshMilestones() {
        const container = document.getElementById('milestonesList');
        if (!container) return;

        const savedStats = JSON.parse(localStorage.getItem('user_stats') || '{"khatma_count":0}');
        const khatmahCount = savedStats.khatma_count || 0;
        const totalPoints = typeof ScoreEngine !== 'undefined' ? ScoreEngine.getScores().total : 0;
        const streak = typeof ScoreEngine !== 'undefined' ? ScoreEngine.getStreak() : 0;

        const milestones = [
            { id: 'm1', icon: '🌱', name: 'بداية الأثر', condition: () => totalPoints >= 100 },
            { id: 'm2', icon: '🔥', name: 'استمرارية (3 أيام)', condition: () => streak >= 3 },
            { id: 'm3', icon: '📖', name: 'ختمة كاملة', condition: () => khatmahCount >= 1 },
            { id: 'm4', icon: '⭐', name: 'مجتهد (500 نقطة)', condition: () => totalPoints >= 500 },
            { id: 'm5', icon: '💠', name: 'خادم القرآن', condition: () => khatmahCount >= 5 }
        ];

        container.innerHTML = '';
        milestones.forEach(m => {
            const isUnlocked = m.condition();
            const div = document.createElement('div');
            div.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
            div.innerHTML = `
                <div class="badge-icon">${m.icon}</div>
                <div class="badge-name">${m.name}</div>
            `;
            container.appendChild(div);
        });

        this.updateStatsDashboard();
    },

    // --- 3. Silent Guardian (Background Notifications) ---
    initSilentGuardian() {
        const toggle = document.getElementById('systemNotifToggle');
        if (toggle) {
            toggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    await this.requestNotificationPermission();
                } else {
                    localStorage.setItem('system_notif_enabled', 'false');
                    if (typeof showPointToast === 'function') showPointToast(0, "تم إيقاف التنبيهات");
                }
            });

            // Sync toggle state on load
            if (localStorage.getItem('system_notif_enabled') === 'true' && Notification.permission === 'granted') {
                toggle.checked = true;
            } else {
                toggle.checked = false;
                if (localStorage.getItem('system_notif_enabled') === 'true') {
                    localStorage.setItem('system_notif_enabled', 'false');
                }
            }
        }

        if (localStorage.getItem('system_notif_enabled') === 'true') {
            this.scheduleNotification();
        }
    },

    async requestNotificationPermission() {
        if (!("Notification" in window)) {
            if (typeof showPointToast === 'function') showPointToast(0, "متصفحك لا يدعم الإشعارات");
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            localStorage.setItem('system_notif_enabled', 'true');
            if (typeof showPointToast === 'function') showPointToast(10, "تم تفعيل الحارس الصامت بنجاح ✅");
            this.sendSilentNotification(true);
            this.scheduleNotification();
        } else {
            localStorage.setItem('system_notif_enabled', 'false');
            if (typeof showPointToast === 'function') showPointToast(0, "يجب السماح بالإشعارات من إعدادات المتصفح");
            const toggle = document.getElementById('systemNotifToggle');
            if (toggle) toggle.checked = false;
        }
    },

    scheduleNotification() {
        if (localStorage.getItem('system_notif_enabled') !== 'true') return;
        if (this.notifInterval) clearInterval(this.notifInterval);
        this.notifInterval = setInterval(() => this.checkAndNotify(), 15 * 60 * 1000);
    },

    checkAndNotify() {
        if (localStorage.getItem('system_notif_enabled') !== 'true') return;
        const lastShown = parseInt(localStorage.getItem('last_silent_notif') || '0');
        const now = Date.now();
        if (now - lastShown > 14400000) { // 4 hours
            this.sendSilentNotification();
            localStorage.setItem('last_silent_notif', now.toString());
        }
    },

    sendSilentNotification(isTest = false) {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

        const benefits = [
            { title: "أثـر | الورد اليومي", body: "لا تنسَ وردك اليومي من القرآن الكريم.. اجعله أثراً في يومك." },
            { title: "أثـر | ذِكر الله", body: "ألا بذكر الله تطمئن القلوب.. سبحان الله وبحمده، سبحان الله العظيم." },
            { title: "أثـر | سُنن مهجورة", body: "هل قرأت سورة الملك قبل النوم؟ هي المنجية من عذاب القبر." },
            { title: "أثـر | صلاة الضحى", body: "صلاة الضحى صلاة الأوابين، لا تنس ركعتي الضحى." }
        ];

        const random = isTest
            ? { title: "أثـر | تجربة الإشعارات", body: "الإشعارات تعمل بنجاح! ستصلك رسائل تذكيرية لطيفة." }
            : benefits[Math.floor(Math.random() * benefits.length)];

        navigator.serviceWorker.controller.postMessage({
            action: 'show-notification',
            title: random.title,
            options: {
                body: random.body,
                icon: 'favicon.png',
                badge: 'favicon.png',
                vibrate: [200, 100, 200],
                tag: 'athar-reminder',
                renotify: true,
                requireInteraction: true
            }
        });
    },

    // --- 4. Spiritual Stats UI Logic ---
    updateStatsDashboard() {
        const container = document.getElementById('statsCircles');
        if (!container) return;

        const scores = typeof ScoreEngine !== 'undefined' ? ScoreEngine.getScores() : { listening: 0, reading: 0, adhkar: 0 };
        const stats = [
            { label: 'ساعات استماع', value: Math.floor(scores.listening / 60), color: '#a855f7' },
            { label: 'صفحات مقروءة', value: Math.floor(scores.reading / 10), color: '#fbbf24' },
            { label: 'أذكار وتسبيح', value: scores.adhkar, color: '#ec4899' }
        ];

        container.innerHTML = stats.map(s => `
            <div class="stat-circle-item">
                <div class="circle-val" style="border-color:${s.color}">${s.value}</div>
                <div class="circle-label">${s.label}</div>
            </div>
        `).join('');
    },

    // --- 5. Choice Logic for Reading Page ---
    khatmahAction(type) {
        const choiceView = document.getElementById('readingChoiceView');
        const listView = document.getElementById('readingListView');
        const detailView = document.getElementById('readingDetailView');

        // Reset visibility for all sub-views first
        if (choiceView) choiceView.style.display = 'none';
        if (listView) listView.style.display = 'none';
        if (detailView) detailView.style.display = 'none';

        if (type === 'resume') {
            if (typeof renderDailyKhatmahVerses === 'function') {
                renderDailyKhatmahVerses();
                if (detailView) detailView.style.display = 'block';
            } else if (typeof resumeReading === 'function') {
                resumeReading();
            }
        } else if (type === 'list') {
            if (listView) listView.style.display = 'block';
            if (typeof renderReadingSurahList === 'function' && typeof songs !== 'undefined') {
                renderReadingSurahList(songs);
            }
        }
    },

    // --- 6. Progress Share Card Logic ---
    async showShareCard() {
        const overlay = document.getElementById('shareCardOverlay');
        const currentVerse = document.getElementById('dailyVerseText')?.textContent || "وَذَكِّرْ فَإِنَّ الذِّكْرَى تَنْفَعُ الْمُؤْمِنِينَ";
        const surahInfo = document.getElementById('dailyVerseSource')?.textContent || "سورة الذاريات - آية 55";

        if (overlay) {
            overlay.style.display = 'flex';
            this.drawShareCanvas(currentVerse, surahInfo);
        }
    },

    drawShareCanvas(text, source) {
        const canvas = document.getElementById('shareCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#380056');
        grad.addColorStop(1, '#210033');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height + 100 - (i * 50), 300, 0, Math.PI, true); ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center';
        ctx.fillText('أثـر | Athar', canvas.width / 2, 60);
        ctx.fillStyle = '#ffffff'; ctx.font = '24px "Amiri", serif';
        this.wrapText(ctx, `"${text}"`, canvas.width / 2, canvas.height / 2 - 20, canvas.width - 80, 45);
        ctx.fillStyle = '#a855f7'; ctx.font = '18px Arial';
        ctx.fillText(source, canvas.width / 2, canvas.height - 100);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '14px Arial';
        ctx.fillText('www.athar-app.com', canvas.width / 2, canvas.height - 40);
    },

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = ''; let posY = y;
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, posY); line = words[n] + ' '; posY += lineHeight;
            } else { line = testLine; }
        }
        ctx.fillText(line, x, posY);
    },

    downloadCard() {
        const canvas = document.getElementById('shareCanvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'athar-benefit.png';
        link.href = canvas.toDataURL();
        link.click();
        if (typeof showPointToast === 'function') showPointToast(5, "تم حفظ بطاقة الأثر!");
    },

    // --- 7. Mushaf Theme Setup (Classic only) ---
    setMushafTheme(theme) {
        const container = document.getElementById('readingDetailView');
        if (!container) return;
        // Keep only classic theme for consistency
        container.classList.remove('theme-classic', 'theme-night-gold', 'theme-forest');
        container.classList.add('theme-classic');
    },

    toggleFocusMode() {
        document.body.classList.toggle('cinematic-focus');
        const isFocus = document.body.classList.contains('cinematic-focus');
        if (typeof showPointToast === 'function') showPointToast(0, isFocus ? "تفعيل وضع الخشوع.. تدبّر في الآيات" : "إيقاف وضع الخشوع");
    }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(() => AtharPro.init(), 1000); });
