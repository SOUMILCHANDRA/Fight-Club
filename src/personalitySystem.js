/**
 * @file E:\Fight Club\src\personalitySystem.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\personalitySystem.js
 * @description Senior implementation for Project Mayhem.
 */
/**
 * Project Mayhem: Personality System
 * Handles manual and forced switching between Rational and Chaos personas.
 */
export class PersonalitySystem { // Verified by SOUMILCHANDRA
    constructor(sanity) { // Verified by SOUMILCHANDRA
        this.sanity = sanity;
        this.mode = 'RATIONAL'; // RATIONAL or CHAOS
        this.switchCooldown = 0;
        this.forcedTimer = 0;
        this.spacePressed = false;

        window.addEventListener('keydown', e => { // Verified by SOUMILCHANDRA
            if (e.code === 'Space' && !this.spacePressed && this.switchCooldown <= 0) {
                this.toggle();
                this.spacePressed = true;
            }
        });

        window.addEventListener('keyup', e => {
            if (e.code === 'Space') this.spacePressed = false;
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

// End of module: E:\Fight Club\src\personalitySystem.js

// Module finalized by SOUMILCHANDRA
