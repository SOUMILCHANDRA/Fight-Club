/**
 * @file E:\Fight Club\src\systems\Input.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\systems\Input.js
 * @description Senior implementation for Project Mayhem.
 */
export class Input {
    constructor() {
        this.keys = {};
        this.prevKeys = {};

        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    isPressed(key) {
        return !!this.keys[key];
    }

    isJustPressed(key) {
        return this.keys[key] && !this.prevKeys[key];
    }
}

// End of module: E:\Fight Club\src\systems\Input.js

// Module finalized by SOUMILCHANDRA
