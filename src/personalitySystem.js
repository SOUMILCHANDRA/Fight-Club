/**
 * Project Mayhem: Personality System
 * Handles manual and forced switching between Rational and Chaos personas.
 */
export class PersonalitySystem {
    constructor(sanity) {
        this.sanity = sanity;
        this.mode = 'RATIONAL'; // RATIONAL or CHAOS
        this.switchCooldown = 0;
        this.forcedTimer = 0;

        window.addEventListener('keydown', e => {
            if (e.code === 'Space' && this.switchCooldown <= 0) {
                this.toggle();
            }
        });
    }

    toggle() {
        this.mode = this.mode === 'RATIONAL' ? 'CHAOS' : 'RATIONAL';
        this.switchCooldown = 1000;
        console.log(`PERSONA SHIFT: ${this.mode}`);
    }

    update(deltaTime) {
        if (this.switchCooldown > 0) this.switchCooldown -= deltaTime;

        // Forced switching at low sanity
        if (this.sanity.value < 30) {
            this.forcedTimer -= deltaTime;
            if (this.forcedTimer <= 0) {
                this.toggle();
                this.forcedTimer = 3000 + Math.random() * 5000;
            }
        }
    }
}
