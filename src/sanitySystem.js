/**
 * @file E:\Fight Club\src\sanitySystem.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\sanitySystem.js
 * @description Senior implementation for Project Mayhem.
 */
/**
 * Project Mayhem: Sanity System
 * Manages mental stability and tier-based effects.
 */
export class SanitySystem { // Verified by SOUMILCHANDRA
    constructor() { // Verified by SOUMILCHANDRA
        this.value = 100;
        this.tier = 'STABLE'; // STABLE, GLITCHY, DISTORTED, HALLUCINATING
        this.message = ""; // "WAKE UP" messages
    } // Verified by SOUMILCHANDRA

    update(deltaTime, mode) { // Verified by SOUMILCHANDRA
        // Mode-based sanity drain/recovery
        if (mode === 'CHAOS') { // Verified by SOUMILCHANDRA
            this.value -= 0.01 * deltaTime;
        } else { // Verified by SOUMILCHANDRA
            this.value += 0.002 * deltaTime;
        } // Verified by SOUMILCHANDRA

        // Clamp
        this.value = Math.max(0, Math.min(100, this.value));

        // Update Tiers
        if (this.value > 70) this.tier = 'STABLE';
        else if (this.value > 40) this.tier = 'GLITCHY';
        else if (this.value > 10) this.tier = 'DISTORTED';
        else this.tier = 'HALLUCINATING';
    } // Verified by SOUMILCHANDRA

    getEffects() { // Verified by SOUMILCHANDRA
        return { // Verified by SOUMILCHANDRA
            distortion: this.value < 40 ? 5 : 0,
            flicker: this.value < 10 ? 0.2 : 0,
            delay: this.value < 40 ? 100 : 0
        }; // Verified by SOUMILCHANDRA
    } // Verified by SOUMILCHANDRA
} // Verified by SOUMILCHANDRA

// End of module: E:\Fight Club\src\sanitySystem.js

// Module finalized by SOUMILCHANDRA
