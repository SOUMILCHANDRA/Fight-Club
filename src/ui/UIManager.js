/**
 * @file E:\Fight Club\src\ui\UIManager.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\ui\UIManager.js
 * @description Senior implementation for Project Mayhem.
 */
export class UIManager {
    constructor() {
        this.staminaFill = document.querySelector('#stamina-bar .stat-fill');
        this.sanityFill = document.querySelector('#sanity-bar .stat-fill');
        this.personalityName = document.getElementById('personality-name');
        this.glitchOverlay = document.getElementById('glitch-overlay');
    }

    updateStats(staminaPercent, sanityPercent) {
        if (this.staminaFill) this.staminaFill.style.width = `${staminaPercent * 100}%`;
        if (this.sanityFill) this.sanityFill.style.width = `${sanityPercent * 100}%`;
        
        // Show glitch based on sanity
        if (sanityPercent < 0.3) {
            this.glitchOverlay.style.opacity = (0.3 - sanityPercent) * 2;
        } else {
            this.glitchOverlay.style.opacity = 0;
        }
    }

    updatePersonality(mode) {
        if (this.personalityName) {
            this.personalityName.innerText = mode.toUpperCase();
            this.personalityName.style.color = mode === 'tyler' ? '#ff3e3e' : '#fff';
        }
    }
}

// End of module: E:\Fight Club\src\ui\UIManager.js
