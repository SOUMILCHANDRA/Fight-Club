/**
 * Input System: Unified keyboard tracking for Project Mayhem.
 * Supports WASD, attacks (J/K), block (L), dodge (Space), debug (H), and mode switch (Tab).
 * Integrates subtle psychological input delay when sanity drops to critical tier.
 */
export class Input {
    constructor(game = null) {
        this.game = game;
        this.keys = {};
        this.prevKeys = {};
        this.delayedQueue = [];

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === 'Tab') {
                e.preventDefault();
            }

            const key = e.key;
            const kLow = e.key.toLowerCase();
            const code = e.code;

            // Check if psychological input latency applies (< 30% sanity)
            const isCriticalSanity = this.game?.sanity?.currentSanity < 30;
            if (isCriticalSanity && !this.keys[key]) {
                const delayMs = 60 + Math.random() * 40;
                setTimeout(() => {
                    this.keys[key] = true;
                    this.keys[kLow] = true;
                    this.keys[code] = true;
                }, delayMs);
            } else {
                this.keys[key] = true;
                this.keys[kLow] = true;
                this.keys[code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key;
            const kLow = e.key.toLowerCase();
            const code = e.code;

            this.keys[key] = false;
            this.keys[kLow] = false;
            this.keys[code] = false;
        });
    }

    isPressed(key) {
        return !!this.keys[key] || !!this.keys[key.toLowerCase()];
    }

    isJustPressed(key) {
        const k = key.toLowerCase();
        const pressed = !!(this.keys[key] || this.keys[k]);
        const prev = !!(this.prevKeys[key] || this.prevKeys[k]);
        return pressed && !prev;
    }

    update() {
        this.prevKeys = { ...this.keys };
    }
}
