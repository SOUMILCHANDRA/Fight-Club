import * as THREE from 'three';

/**
 * UIManager: Manages HUD meters (Health, Stamina, Sanity, Enemy Health),
 * floating combat damage indicators, personality badges (Narrator vs Tyler),
 * struggle control meter during autonomous takeover, sideline monologue subtitles,
 * film grain overlays, screen flash transitions, and victory/game-over screens.
 */
export class UIManager {
    constructor() {
        this.game = null;

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
        this.modeBadge = document.getElementById('mode-badge');
        this.glitchOverlay = document.getElementById('glitch-overlay');
        this.screenFlash = document.getElementById('screen-flash');
        this.damageVignette = document.getElementById('damage-vignette');
        this.filmGrainOverlay = document.getElementById('film-grain-overlay');

        // Takeover & Struggle HUD
        this.controlMeterContainer = document.getElementById('control-meter-container');
        this.controlBarFill = document.getElementById('control-bar-fill');
        this.subtitleMonologue = document.getElementById('subtitle-monologue');
        this.controlsWrapper = document.getElementById('controls-wrapper');
        this.controlsPanel = document.getElementById('controls-panel');

        // Toast & Floating Damage container
        this.toast = document.getElementById('game-toast');
        this.damageContainer = document.getElementById('damage-container');
        this.subtitleTimeout = null;
        this.toastTimeout = null;
    }

    setGame(game) {
        this.game = game;
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

    showGameOver(isVictory, isTylerTakeoverLoss = false) {
        if (!this.gameoverModal) return;
        this.gameoverModal.classList.remove('hidden');

        if (isTylerTakeoverLoss) {
            this.gameoverTitle.innerText = 'TYLER WON. YOU LOST.';
            this.gameoverTitle.style.color = '#ff1744';
            this.gameoverSubtitle.innerText = '"Tyler took your body, beat the enemy into pulp, but you died in the process. A copy of a copy."';
            this.btnRestart.innerText = 'WAKE UP';
        } else if (isVictory) {
            this.gameoverTitle.innerText = 'YOU WIN // OPPONENT DOWN';
            this.gameoverTitle.style.color = '#00d4ff';
            this.gameoverSubtitle.innerText = '"You broke the rules and survived. The club respects power."';
            this.btnRestart.innerText = 'NEXT OPPONENT';
        } else {
            this.gameoverTitle.innerText = 'YOU DIED // KNOCKED OUT';
            this.gameoverTitle.style.color = '#ff1744';
            this.gameoverSubtitle.innerText = '"It is only after we have lost everything that we are free to do anything."';
            this.btnRestart.innerText = 'RETRY FIGHT';
        }
    }

    showDamageText(worldPos, text, color = '#ff1744') {
        if (!this.damageContainer || !this.game || !this.game.camera) return;

        // Project 3D world position to 2D screen space
        const pos = worldPos.clone().add(new THREE.Vector3(0, 1.4, 0));
        pos.project(this.game.camera);

        const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

        const el = document.createElement('div');
        el.className = 'damage-number';
        el.innerText = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.color = color;
        this.damageContainer.appendChild(el);

        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 800);
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

    pulseDamageVignette() {
        if (!this.damageVignette) return;
        this.damageVignette.style.opacity = '0.9';
        clearTimeout(this.vignetteTimeout);
        this.vignetteTimeout = setTimeout(() => {
            if (this.damageVignette) {
                const healthRatio = this.game && this.game.player ? this.game.player.health / 100 : 1;
                this.damageVignette.style.opacity = healthRatio < 0.3 ? '0.35' : '0';
            }
        }, 280);
    }

    updatePersonality(mode) {
        if (!this.personalityName) return;
        const isTyler = mode.toLowerCase() === 'tyler';
        this.personalityName.innerText = isTyler ? 'TYLER DURDEN' : 'NARRATOR';
        this.personalityName.className = isTyler ? 'mode-tyler' : 'mode-rational';

        // Update controls panel TAB badge
        if (this.modeBadge) {
            this.modeBadge.innerText = isTyler ? '[TYLER]' : '[NARRATOR]';
            this.modeBadge.style.color = isTyler ? '#ff1744' : '#00d4ff';
            this.modeBadge.style.textShadow = isTyler 
                ? '0 0 10px rgba(255, 23, 68, 0.8)' 
                : '0 0 8px rgba(0, 212, 255, 0.6)';
        }

        if (this.personalityDesc) {
            this.personalityDesc.innerText = isTyler 
                ? 'RECKLESS // HITS HARDER // IGNORES PAIN // DRAINS SANITY'
                : 'CAREFUL // TACTICAL // EASILY HURT // BLOCKS REGAIN STAMINA';
        }

        // Screen Flash Transition with color change
        if (this.screenFlash) {
            this.screenFlash.style.backgroundColor = isTyler ? 'rgba(255, 23, 68, 0.45)' : 'rgba(0, 212, 255, 0.45)';
            this.screenFlash.style.opacity = '1';
            setTimeout(() => {
                this.screenFlash.style.opacity = '0';
            }, 200);
        }
    }

    setTylerTakeoverUI(active) {
        if (this.controlMeterContainer) {
            if (active) {
                this.controlMeterContainer.classList.remove('hidden');
            } else {
                this.controlMeterContainer.classList.add('hidden');
            }
        }

        if (this.controlsWrapper) {
            if (active) {
                this.controlsWrapper.classList.add('no-control');
            } else {
                this.controlsWrapper.classList.remove('no-control');
            }
        }

        if (this.controlsPanel) {
            if (active) {
                this.controlsPanel.classList.add('no-control');
            } else {
                this.controlsPanel.classList.remove('no-control');
            }
        }

        if (this.filmGrainOverlay) {
            if (active) {
                this.filmGrainOverlay.classList.add('active');
            } else {
                this.filmGrainOverlay.classList.remove('active');
            }
        }

        if (!active && this.subtitleMonologue) {
            this.subtitleMonologue.classList.remove('active');
        }
    }

    updateControlMeter(percent) {
        if (this.controlBarFill) {
            this.controlBarFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }

    showSubtitle(text, duration = 3.5) {
        if (!this.subtitleMonologue) return;
        this.subtitleMonologue.innerText = text;
        this.subtitleMonologue.classList.add('active');

        clearTimeout(this.subtitleTimeout);
        this.subtitleTimeout = setTimeout(() => {
            if (this.subtitleMonologue) {
                this.subtitleMonologue.classList.remove('active');
            }
        }, duration * 1000);
    }
}
