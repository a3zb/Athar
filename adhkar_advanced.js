
// --- Advanced Adhkar Features (Smart Notifications, Stats, Challenge) ---

const ADHKAR_STATS_KEY = 'adhkar_stats_v1';
const ADHKAR_FAVS_KEY = 'adhkar_favs_v1';

// 1. Storage Helper
function getAdhkarStats() {
    return JSON.parse(localStorage.getItem(ADHKAR_STATS_KEY)) || { total: 0, distinct: 0, streak: 0, lastRead: null };
}

function saveAdhkarStats(stats) {
    localStorage.setItem(ADHKAR_STATS_KEY, JSON.stringify(stats));
}

function getFavorites() {
    return JSON.parse(localStorage.getItem(ADHKAR_FAVS_KEY)) || [];
}

function toggleFavorite(text) {
    let favs = getFavorites();
    if (favs.includes(text)) {
        favs = favs.filter(t => t !== text);
    } else {
        favs.push(text);
    }
    localStorage.setItem(ADHKAR_FAVS_KEY, JSON.stringify(favs));
    return favs.includes(text);
}

// 2. Smart Notifications Logic
function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
                scheduleAdhkarNotifications();
            }
        });
    }
}

function scheduleAdhkarNotifications() {
    // This function checks time periodically and sends notification if matched
    // Ideally ran every minute
    setInterval(() => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Morning Adhkar (e.g., 5:00 AM)
        if (hours === 5 && minutes === 0) {
            sendNotification("أذكار الصباح", "حان الآن وقت أذكار الصباح، بداية يوم مبارك! ☀️");
        }

        // Evening Adhkar (e.g., 5:00 PM / 17:00)
        if (hours === 17 && minutes === 0) {
            sendNotification("أذكار المساء", "حان الآن وقت أذكار المساء، حصن نفسك! 🌙");
        }
    }, 60000); // Check every minute
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: 'favicon.png', // Assuming favicon exists
            dir: 'rtl'
        });
    }
}

// 3. Analytics & Progress Logic
function updateAdhkarProgress() {
    let stats = getAdhkarStats();
    stats.total++;

    // Simple streak logic
    const today = new Date().toDateString();
    if (stats.lastRead !== today) {
        // If yesterday was last read, increment streak, else reset
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (stats.lastRead === yesterday.toDateString()) {
            stats.streak++;
        } else {
            stats.streak = 1; // New streak or reset
        }
        stats.lastRead = today;
    }

    saveAdhkarStats(stats);
    updateStatsDisplay();
}

// UI Updater for Stats
function updateStatsDisplay() {
    const statsContainer = document.getElementById('adhkarStatsBoard');
    if (!statsContainer) return; // Only if element exists

    const stats = getAdhkarStats();
    statsContainer.innerHTML = `
        <div class="stat-card">
            <span class="stat-val">${stats.total}</span>
            <span class="stat-label">ذكر قرأته</span>
        </div>
        <div class="stat-card">
            <span class="stat-val">${stats.streak}</span>
            <span class="stat-label">أيام متتالية 🔥</span>
        </div>
    `;
}

// 4. Overriding/Enhancing renderAdhkarList from script.js
// We hook into the global scope to replace the render function seamlessly
window.renderAdhkarListAdvanced = function (data, container) {
    if (!container || !data) return;
    container.innerHTML = '';
    const favs = getFavorites();

    data.forEach((item, index) => {
        const text = item.content || item.text || "";
        const reward = item.description || item.reward || 'فضائل الذكر';
        const count = parseInt(item.count) || 1;

        const isFav = favs.includes(text);
        const div = document.createElement('div');
        div.className = 'dhikr-item';
        div.innerHTML = `
            <div class="dhikr-header">
                 <button class="fav-btn ${isFav ? 'active' : ''}" onclick="window.handleFavClick(this, '${text.replace(/'/g, "\\'")}')">
                    <i class="fas ${isFav ? 'fa-heart' : 'fa-heart'}"></i>
                 </button>
            </div>
            <div class="dhikr-text">${text}</div>
            <div class="dhikr-meta">
                <div class="dhikr-reward">${reward}</div>
                <div class="dhikr-actions">
                    <div class="dhikr-count-badge" id="badge-${index}" onclick="window.handleDecrement(this, ${count})">
                        <span class="dhikr-label">العدد</span>
                        <span class="count-val">${count}</span>
                    </div>
                </div>
            </div>
            <div class="progress-bar-bg"><div class="progress-bar-fill" id="progress-${index}" style="width:0%"></div></div>
        `;
        container.appendChild(div);
    });
};

// Global handlers for HTML interaction
window.handleFavClick = function (btn, text) {
    const isNowFav = toggleFavorite(text);
    btn.classList.toggle('active', isNowFav);

    // Visual pop animation
    btn.style.transform = 'scale(1.2)';
    setTimeout(() => btn.style.transform = 'scale(1)', 200);
};

window.handleDecrement = function (el, max) {
    const span = el.querySelector('.count-val');
    const id = el.id.split('-')[1];
    const progressFill = document.getElementById(`progress-${id}`);

    let current = parseInt(span.textContent);

    if (current > 0) {
        current--;
        span.textContent = current;

        // Update progress bar
        const percent = ((max - current) / max) * 100;
        if (progressFill) progressFill.style.width = `${percent}%`;

        if (navigator.vibrate) navigator.vibrate(30);

        // --- Score Engine Integration ---
        if (window.ScoreEngine) {
            window.ScoreEngine.addAdhkarScore(1);
        }
        // ----------------------------------

        if (current === 0) {
            el.classList.add('completed');
            el.innerHTML = '<i class="fas fa-check"></i> <span class="dhikr-label">تم</span>';
            if (progressFill) progressFill.style.background = '#4caf50';

            // Update global stats
            updateAdhkarProgress();

            // Celebration effect
            confettiEffect(el);
        }
    }
};

// Simple confetti effect for completion
function confettiEffect(element) {
    // Simple visual feedback (scale up/down)
    element.parentElement.parentElement.parentElement.style.transform = "scale(1.02)";
    setTimeout(() => {
        element.parentElement.parentElement.parentElement.style.transform = "scale(1)";
    }, 200);
}

// Initial Run
document.addEventListener('DOMContentLoaded', () => {
    requestNotificationPermission(); // Ask permission on load
    // Inject stats board if missing
    const header = document.querySelector('#adhkarPage .page-header');
    if (header && !document.getElementById('adhkarStatsBoard')) {
        const statsDiv = document.createElement('div');
        statsDiv.id = 'adhkarStatsBoard';
        statsDiv.className = 'stats-board';
        header.appendChild(statsDiv);
        updateStatsDisplay();
    }
});

// Override the original render function from script.js to use the new advanced one
if (window.renderAdhkarListAdvanced) {
    window.renderAdhkarList = window.renderAdhkarListAdvanced;
    console.log("✅ Advanced Adhkar System Activated");
}
