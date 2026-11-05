/**
 * UIManager: Manages HUD meters (Health, Stamina, Sanity, Enemy Health),
 * personality badges, damage vignettes, loading screen, start menu,
 * game-over modals, and toast notifications.
 */
export class UIManager {
    constructor() {
        // Loading elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingBar = document.getElementById('loading-bar-fill');
        this.loadingStatus = document.getElementById('loading-status');

        // Modals
        this.startModal = document.getElementById('start-modal');
        this.gameoverModal = document.getElementById('gameover-modal');
        this.gameoverTitle = document.getElementById('gameover-title');
        this.gameoverSubtitle = document.getElementById('gameover-subtitle');
        this.btnStart = document.getElementById('btn-start');
        this.btnRestart = document.getElementById('btn-restart');

        // Player HUD
        this.healthFill = document.querySelector('#health-bar .stat-fill');
        this.staminaFill = document.querySelector('#stamina-bar .stat-fill');
        this.sanityFill = document.querySelector('#sanity-bar .stat-fill');
        this.healthVal = document.getElementById('health-val');
        this.staminaVal = document.getElementById('stamina-val');
        this.sanityVal = document.getElementById('sanity-val');

        // Enemy HUD
        this.enemyHealthFill = document.querySelector('#enemy-health-bar .stat-fill');
        this.enemyHealthVal = document.getElementById('enemy-health-val');

        // Personality & Mode
        this.personalityName = document.getElementById('personality-name');
        this.personalityDesc = document.getElementById('personality-desc');
        this.glitchOverlay = document.getElementById('glitch-overlay');

        // Notification / Toast
        this.toast = document.getElementById('game-toast');
    }

    initModals(onStart, onRestart) {
        if (this.btnStart) {
            this.btnStart.addEventListener('click', () => {
                this.startModal.classList.add('hidden');
                if (onStart) onStart();
            });
        }
        if (this.btnRestart) {
            this.btnRestart.addEventListener('click', () => {
                this.gameoverModal.classList.add('hidden');
                if (onRestart) onRestart();
            });
        }

        // Show mobile controls if touch device
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls) mobileControls.style.display = 'flex';
        }
    }

    showGameOver(isVictory) {
        if (!this.gameoverModal) return;
        this.gameoverModal.classList.remove('hidden');

        if (isVictory) {
            this.gameoverTitle.innerText = 'OPPONENT DOWN';
            this.gameoverTitle.style.color = '#00d4ff';
            this.gameoverSubtitle.innerText = '"You broke the rules and survived. The club respects power."';
            this.btnRestart.innerText = 'NEXT FIGHT';
        } else {
            this.gameoverTitle.innerText = 'KNOCKED OUT';
            this.gameoverTitle.style.color = '#ff1744';
            this.gameoverSubtitle.innerText = '"It is only after we have lost everything that we are free to do anything."';
            this.btnRestart.innerText = 'GET BACK UP';
        }
    }

    setLoadingProgress(percent, message) {
        if (this.loadingBar) {
            this.loadingBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
        if (this.loadingStatus && message) {
            this.loadingStatus.innerText = message;
        }
    }

    hideLoading() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 600);
        }
    }

    showToast(message, duration = 1800) {
        if (!this.toast) return;
        this.toast.innerText = message;
        this.toast.style.opacity = '1';
        this.toast.style.transform = 'translate(-50%, 0)';
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.style.opacity = '0';
            this.toast.style.transform = 'translate(-50%, -10px)';
        }, duration);
    }

    updatePlayerStats(healthPercent, staminaPercent, sanityPercent) {
        if (this.healthFill) this.healthFill.style.width = `${Math.max(0, healthPercent * 100)}%`;
        if (this.staminaFill) this.staminaFill.style.width = `${Math.max(0, staminaPercent * 100)}%`;
        if (this.sanityFill) this.sanityFill.style.width = `${Math.max(0, sanityPercent * 100)}%`;

        if (this.healthVal) this.healthVal.innerText = `${Math.round(healthPercent * 100)}%`;
        if (this.staminaVal) this.staminaVal.innerText = `${Math.round(staminaPercent * 100)}%`;
        if (this.sanityVal) this.sanityVal.innerText = `${Math.round(sanityPercent * 100)}%`;

        // Glitch intensity tied to low sanity
        if (this.glitchOverlay) {
            if (sanityPercent < 0.35) {
                this.glitchOverlay.style.opacity = String((0.35 - sanityPercent) * 2.2);
            } else {
                this.glitchOverlay.style.opacity = '0';
            }
        }
    }

    updateEnemyHealth(percent) {
        if (this.enemyHealthFill) {
            this.enemyHealthFill.style.width = `${Math.max(0, percent * 100)}%`;
        }
        if (this.enemyHealthVal) {
            this.enemyHealthVal.innerText = `${Math.round(Math.max(0, percent) * 100)}%`;
        }
    }

    updatePersonality(mode) {
        if (!this.personalityName) return;
        const isTyler = mode.toLowerCase() === 'tyler';
        this.personalityName.innerText = isTyler ? 'TYLER DURDEN' : 'RATIONAL YOU';
        this.personalityName.className = isTyler ? 'mode-tyler' : 'mode-rational';

        if (this.personalityDesc) {
            this.personalityDesc.innerText = isTyler 
                ? 'AGGRESSIVE COMBO POWER // ZERO INHIBITION // UNSTABLE'
                : 'TACTICAL COUNTERS // CLEAN DEFENSE // GROUNDED';
        }

        this.showToast(isTyler ? '⚠️ ALTER EGO MANIFESTED: TYLER DURDEN' : 'CALM RESTORED: RATIONAL MIND');
    }
}
