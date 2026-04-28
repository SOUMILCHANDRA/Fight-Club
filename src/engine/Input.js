/**
 * @file E:\Fight Club\src\engine\Input.js
 * @description Senior implementation for Project Mayhem.
 */
export class Input {
    constructor() {
        this.keys = {};
        this.jitter = { x: 0, y: 0 };
        this.inputBuffer = [];
        this.delayTime = 0; // ms
        
        window.addEventListener('keydown', (e) => {
            if (this.delayTime > 0) {
                setTimeout(() => {
                    this.keys[e.code] = true;
                }, this.delayTime);
            } else {
                this.keys[e.code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.delayTime > 0) {
                setTimeout(() => {
                    this.keys[e.code] = false;
                }, this.delayTime);
            } else {
                this.keys[e.code] = false;
            }
        });
    }

    setDelay(ms) {
        this.delayTime = ms;
    }

    isDown(code) {
        return !!this.keys[code];
    }

    // Used during Chaos Mode to simulate loss of control
    updateJitter(intensity) {
        if (intensity > 0) {
            this.jitter.x = (Math.random() - 0.5) * intensity;
            this.jitter.y = (Math.random() - 0.5) * intensity;
        } else {
            this.jitter.x = 0;
            this.jitter.y = 0;
        }
    }

    getMovement() {
        let x = 0;
        let y = 0;

        if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
        if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
        if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
        if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;

        // Apply jitter if any
        return {
            x: x + this.jitter.x,
            y: y + this.jitter.y
        };
    }
}

// End of module: E:\Fight Club\src\engine\Input.js
