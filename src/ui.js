/**
 * @file E:\Fight Club\src\ui.js
 * @description Senior implementation for Project Mayhem.
 */
/**
 * Project Mayhem: UI Manager
 * Handles syncing game state with the text-based HUD.
 */
export class UI {
    constructor() {
        this.elements = {
            sanity: document.getElementById('sanity-status'),
            personality: document.getElementById('personality-status'),
            stamina: document.getElementById('stamina-status'),
            rep: document.getElementById('rep-status'),
            heat: document.getElementById('heat-status')
        };
    }

    sync(player, sanity, personality) {
        // Stability Sync
        this.elements.sanity.textContent = `STABILITY: ${sanity.tier}`;
        if (sanity.tier === 'HALLUCINATING') {
            this.elements.sanity.style.color = '#ff0044';
        } else {
            this.elements.sanity.style.color = '#fff';
        }

        // Personality Sync
        this.elements.personality.textContent = `MODE: ${personality.mode}`;
        this.elements.personality.style.color = personality.mode === 'RATIONAL' ? '#0088ff' : '#ff0044';

        // Vitality Sync
        this.elements.stamina.textContent = `VITALITY: ${Math.floor(player.stamina)}%`;

        // Rep & Heat (Static for now in MVP)
        // In a full game, these would come from clubSystem
    }

    showOverlay(title, msg) {
        const overlay = document.getElementById('overlay');
        document.getElementById('title').textContent = title;
        document.getElementById('message').textContent = msg;
        overlay.classList.add('active');
        overlay.classList.remove('hidden');
    }

    hideOverlay() {
        const overlay = document.getElementById('overlay');
        overlay.classList.remove('active');
        overlay.classList.add('hidden');
    }

    showFailure() {
        this.showOverlay("SYSTEM FAILURE", "Reality buffer overflow. Memory corruption detected.");
        document.getElementById('overlay').style.color = '#ff0044';
    }
}

// End of module: E:\Fight Club\src\ui.js
