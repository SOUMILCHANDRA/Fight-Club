/**
 * @file E:\Fight Club\src\game\GameState.js
 * @description Senior implementation for Project Mayhem.
 */
export class GameState {
    constructor() {
        this.sanity = 100;
        this.reputation = 0;
        this.personalityMode = 'RATIONAL'; // RATIONAL or CHAOS
        this.forcedSwitchTimer = 0;
        
        this.policeAttention = 0;
        this.currentMission = null;
        this.sanityTier = 'STABLE'; // STABLE, GLITCHY, DISTORTED, HALLUCINATING
    }

    reset() {
        this.sanity = 100;
        this.reputation = 0;
        this.policeAttention = 0;
        this.personalityMode = 'RATIONAL';
    }

    togglePersonality() {
        this.personalityMode = this.personalityMode === 'RATIONAL' ? 'CHAOS' : 'RATIONAL';
        console.log(`Switching to ${this.personalityMode} mode`);
    }

    update(deltaTime) {
        // Sanity logic
        if (this.personalityMode === 'CHAOS') {
            this.sanity -= 0.015 * deltaTime; // Faster drain
        } else {
            this.sanity += 0.005 * deltaTime; 
        }

        this.sanity = Math.max(0, Math.min(100, this.sanity));

        // Update Sanity Tier
        if (this.sanity > 70) this.sanityTier = 'STABLE';
        else if (this.sanity > 40) this.sanityTier = 'GLITCHY';
        else if (this.sanity > 10) this.sanityTier = 'DISTORTED';
        else this.sanityTier = 'HALLUCINATING';

        // Forced switching at low sanity
        if (this.sanity < 30) {
            this.forcedSwitchTimer -= deltaTime;
            if (this.forcedSwitchTimer <= 0) {
                this.togglePersonality();
                this.forcedSwitchTimer = Math.random() * 5000 + 2000; // Switch again in 2-7 seconds
            }
        }
    }

    addReputation(amount) {
        this.reputation += amount;
    }
}

// End of module: E:\Fight Club\src\game\GameState.js
