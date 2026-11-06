/**
 * PersonalitySystem: Manages the psychological duality between the Narrator
 * and Tyler Durden. Governs autonomous takeovers, sanity thresholds, blackout events,
 * and the visceral struggle to regain conscious control.
 */
export class PersonalitySystem {
    constructor(game) {
        this.game = game;

        // Core identity state
        this.activePersona = 'narrator'; // 'narrator' | 'tyler'
        this.isTylerAutonomous = false;

        // Control struggle meter (0 - 100)
        this.controlMeter = 0;
        this.takeoverTimer = 0;
        this.minTakeoverDuration = 8.5; // Tyler controls the body for at least 8.5 - 12s

        // Blackout event timer at medium sanity (30% - 65%)
        this.blackoutCooldown = 22.0 + Math.random() * 12.0;

        // Subtitle monologue lines for the sideline out-of-body experience
        this.monologueLines = [
            '"I wasn\'t in control."',
            '"I just stood there and watched."',
            '"Whose hands are those?"',
            '"Tyler\'s words coming out of my mouth."',
            '"I know this because Tyler knows this."',
            '"A copy of a copy of a copy."',
            '"Every punch felt like somebody else\'s knuckles."'
        ];
        this.monologueIndex = 0;
        this.monologueTimer = 0;
    }

    /**
     * Tries a voluntary persona shift via TAB key.
     * Can only switch voluntarily if sanity is low enough (< 60%).
     */
    tryVoluntaryShift() {
        if (this.isTylerAutonomous) {
            // Mashing TAB while in autonomous takeover fights for control!
            this.pumpControl(12);
            return;
        }

        const sanity = this.game.sanity ? this.game.sanity.currentSanity : 100;

        if (this.activePersona === 'narrator') {
            if (sanity <= 60) {
                // Mind is fractured enough for Tyler to emerge voluntarily
                this.setPersona('tyler');
            } else {
                // High sanity resists shift
                if (this.game.audio) this.game.audio.playBlock();
                if (this.game.effects) this.game.effects.glitchBurst(0.2);
                if (this.game.ui) {
                    this.game.ui.showToast('RESISTED: MIND TOO LUCID TO MANIFEST TYLER', 1800);
                }
            }
        } else {
            // Voluntary return to Narrator if not autonomous
            this.setPersona('narrator');
        }
    }

    setPersona(persona) {
        if (this.activePersona === persona) return;
        this.activePersona = persona;

        // Re-theme player model
        if (this.game.player) {
            this.game.player.currentMode = persona === 'tyler' ? 'tyler' : 'rational';
            this.game.player.loadModel(this.game.player.currentMode);
            if (this.game.player.rimLight) {
                this.game.player.rimLight.color.setHex(persona === 'tyler' ? 0xff1744 : 0x00d4ff);
            }
        }

        // Visual transition
        if (this.game.effects) this.game.effects.glitchBurst(0.4);
        if (this.game.audio) this.game.audio.playTylerGlitch();

        // Update HUD
        if (this.game.ui) {
            this.game.ui.updatePersonality(this.activePersona);
        }
    }

    /**
     * Triggers autonomous Tyler takeover where player loses control of the body.
     */
    triggerTylerTakeover(reason = 'sanity_break') {
        if (this.isTylerAutonomous) return;

        this.isTylerAutonomous = true;
        this.activePersona = 'tyler';
        this.takeoverTimer = 0;
        this.controlMeter = 0;
        this.monologueIndex = Math.floor(Math.random() * this.monologueLines.length);
        this.monologueTimer = 0.5;

        // Apply Tyler mode and stats
        if (this.game.player) {
            this.game.player.currentMode = 'tyler';
            this.game.player.loadModel('tyler');
            if (this.game.player.rimLight) {
                this.game.player.rimLight.color.setHex(0xff1744);
            }
        }

        // Hard flash cut, heartbeat audio, chromatic burst
        if (this.game.audio) {
            this.game.audio.playHeartbeat();
            this.game.audio.playTylerGlitch();
        }
        if (this.game.effects) {
            this.game.effects.glitchBurst(0.7);
        }

        // Switch camera to ringside sideline view
        if (this.game.cameraDirector) {
            this.game.cameraDirector.setMode('sideline');
        }

        // Update UI
        if (this.game.ui) {
            this.game.ui.updatePersonality('tyler');
            this.game.ui.setTylerTakeoverUI(true);
            const msg = reason === 'blackout' 
                ? '⚠️ BLACKOUT EVENT: TYLER SEIZED CONTROL' 
                : '⚠️ PSYCHOLOGICAL COLLAPSE: TYLER TOOK OVER';
            this.game.ui.showToast(msg, 3200);
        }
    }

    /**
     * Pumps struggle meter when player mashes TAB or holds L.
     */
    pumpControl(amount = 12) {
        if (!this.isTylerAutonomous) return;
        this.controlMeter = Math.min(100, this.controlMeter + amount);

        if (this.game.ui) {
            this.game.ui.updateControlMeter(this.controlMeter);
        }

        // If threshold reached and minimum takeover duration elapsed, regain control
        if (this.controlMeter >= 100 && this.takeoverTimer >= this.minTakeoverDuration) {
            this.regainControl();
        }
    }

    /**
     * Regains conscious control of the body back to the Narrator.
     */
    regainControl() {
        if (!this.isTylerAutonomous) return;

        this.isTylerAutonomous = false;
        this.activePersona = 'narrator';
        this.controlMeter = 0;

        // Restore Narrator model and attire (retains whatever wounds Tyler took!)
        if (this.game.player) {
            this.game.player.currentMode = 'rational';
            this.game.player.loadModel('rational');
            if (this.game.player.rimLight) {
                this.game.player.rimLight.color.setHex(0x00d4ff);
            }
            this.game.player.updateInjuries();
        }

        // Flash cut back to third-person camera
        if (this.game.cameraDirector) {
            this.game.cameraDirector.setMode('fight');
        }

        // Gasp audio and screen blur fade-in
        if (this.game.audio) {
            this.game.audio.playGasp();
        }
        if (this.game.effects) {
            this.game.effects.glitchBurst(0.35);
        }

        // Restore HUD
        if (this.game.ui) {
            this.game.ui.updatePersonality('narrator');
            this.game.ui.setTylerTakeoverUI(false);
            this.game.ui.showToast('GASP... CONSCIOUSNESS RESTORED: NARRATOR', 2400);
        }

        // Reset blackout timer
        this.blackoutCooldown = 25.0 + Math.random() * 15.0;
    }

    update(dt) {
        const sanity = this.game.sanity ? this.game.sanity.currentSanity : 100;

        if (this.isTylerAutonomous) {
            this.takeoverTimer += dt;

            // Handle L guard hold struggle
            if (this.game.input && (this.game.input.isPressed('l') || this.game.input.isPressed('L'))) {
                this.pumpControl(18 * dt);
            }

            // Meter decay (harder to regain control at very low sanity)
            const decayRate = 3.5 + (1.0 - sanity / 100) * 12.0;
            this.controlMeter = Math.max(0, this.controlMeter - decayRate * dt);

            if (this.game.ui) {
                this.game.ui.updateControlMeter(this.controlMeter);
            }

            // Subtitle monologue progression
            this.monologueTimer -= dt;
            if (this.monologueTimer <= 0) {
                const line = this.monologueLines[this.monologueIndex % this.monologueLines.length];
                if (this.game.ui) {
                    this.game.ui.showSubtitle(line, 3.2);
                }
                this.monologueIndex++;
                this.monologueTimer = 4.2;
            }

            // Can auto-resolve after 14s if player kept struggle high
            if (this.takeoverTimer > 13.5 && this.controlMeter > 60) {
                this.regainControl();
            }
        } else {
            // 1. Check low-sanity trigger (< 30%)
            if (sanity < 30) {
                this.triggerTylerTakeover('sanity_break');
                return;
            }

            // 2. Check random blackout events at medium sanity (30% - 65%)
            if (sanity >= 30 && sanity <= 65) {
                this.blackoutCooldown -= dt;
                if (this.blackoutCooldown <= 0) {
                    // Random blackout seizure
                    if (Math.random() < 0.75) {
                        this.triggerTylerTakeover('blackout');
                    } else {
                        this.blackoutCooldown = 18.0 + Math.random() * 10.0;
                    }
                }
            }
        }
    }
}
