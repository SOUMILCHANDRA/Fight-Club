/**
 * SanitySystem: Tracks the psychological collapse of the protagonist.
 * Drains on taking damage; recovers on clean dodges/blocks.
 * At low sanity, automatically triggers Tyler Durden takeover, visual distortion,
 * and hallucinations.
 */
export class SanitySystem {
    constructor(game) {
        this.game = game;
        this.currentSanity = 100;
        this.maxSanity = 100;
        this.tier = 'STABLE'; // 'STABLE', 'DISTORTED', 'CRITICAL'
        this.forcedTakeoverCooldown = 0;
    }

    update(dt) {
        const player = this.game.player;
        if (!player || player.isDead) return;

        // Baseline slow drain in Tyler mode, slight passive recovery in Rational mode
        if (player.currentMode === 'tyler') {
            this.currentSanity = Math.max(0, this.currentSanity - 3.2 * dt);
        } else {
            if (this.currentSanity < 80) {
                this.currentSanity = Math.min(100, this.currentSanity + 0.6 * dt);
            }
        }

        // Tier classification
        if (this.currentSanity > 65) {
            this.tier = 'STABLE';
        } else if (this.currentSanity > 30) {
            this.tier = 'DISTORTED';
        } else {
            this.tier = 'CRITICAL';
        }

        // Automatic Tyler takeover when sanity collapses
        this.forcedTakeoverCooldown -= dt;
        if (this.currentSanity <= 30 && player.currentMode === 'rational' && this.forcedTakeoverCooldown <= 0) {
            player.switchMode('tyler');
            if (this.game.audio) this.game.audio.playTylerGlitch();
            this.forcedTakeoverCooldown = 10.0;
        } else if (this.currentSanity >= 70 && player.currentMode === 'tyler' && this.forcedTakeoverCooldown <= 0) {
            // Rational control restored
            player.switchMode('rational');
            this.forcedTakeoverCooldown = 6.0;
        }

        // Sync UI
        if (this.game.ui) {
            const staminaPercent = player.stamina / player.stats[player.currentMode].maxStamina;
            const healthPercent = player.health / player.stats[player.currentMode].maxHealth;
            const sanityPercent = this.currentSanity / this.maxSanity;
            this.game.ui.updatePlayerStats(healthPercent, staminaPercent, sanityPercent);
        }
    }

    loseSanity(amount) {
        this.currentSanity = Math.max(0, this.currentSanity - amount);
    }

    gainSanity(amount) {
        this.currentSanity = Math.min(100, this.currentSanity + amount);
    }
}
