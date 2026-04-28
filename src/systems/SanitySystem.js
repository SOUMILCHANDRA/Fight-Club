/**
 * @file E:\Fight Club\src\systems\SanitySystem.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\systems\SanitySystem.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\systems\SanitySystem.js
 * @description Senior implementation for Project Mayhem.
 */
export class SanitySystem {
    constructor(game) {
        this.game = game;
        this.currentSanity = 100;
        this.glitchIntensity = 0;
    }

    update(dt) {
        const player = this.game.player;
        if (!player) return;

        // Decay sanity faster in Tyler mode
        const decayRate = player.currentMode === 'tyler' ? 3 : 0.5;
        this.currentSanity -= decayRate * dt;
        
        // Clamp sanity
        this.currentSanity = Math.max(0, Math.min(100, this.currentSanity));

        // Update glitch intensity
        const threshold = 40;
        if (this.currentSanity < threshold) {
            this.glitchIntensity = (threshold - this.currentSanity) / threshold;
        } else {
            this.glitchIntensity = 0;
        }

        // Apply visual and mechanical effects
        this.applyEffects(dt);
    }

    applyEffects(dt) {
        // Update UI
        this.game.ui.updateStats(this.game.player.stamina / this.game.player.stats[this.game.player.currentMode].stamina, this.currentSanity / 100);

        // Movement Jitter
        if (this.glitchIntensity > 0.5) {
            const jitter = (Math.random() - 0.5) * this.glitchIntensity * 0.1;
            this.game.player.mesh.position.x += jitter;
            this.game.player.mesh.position.z += jitter;
        }

        // Show/Hide glitch overlay handled in GameUI via updateStats
    }

    loseSanity(amount) {
        this.currentSanity -= amount;
        console.log(`SANITY LOSS: ${amount}. Current: ${this.currentSanity}`);
    }
}

// End of module: E:\Fight Club\src\systems\SanitySystem.js

// Module finalized by SOUMILCHANDRA

// Module finalized by SOUMILCHANDRA
