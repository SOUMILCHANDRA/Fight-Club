/**
 * @file E:\Fight Club\src\game\Player.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\game\Player.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\game\Player.js
 * @description Senior implementation for Project Mayhem.
 */
import { Entity } from './Entity.js';

export class Player extends Entity {
    constructor(x, y, input, gameState) {
        super(x, y);
        this.type = 'player';
        this.input = input;
        this.gameState = gameState;
        
        this.personality = 'RATIONAL';
        this.spacePressed = false;
    }

    update(deltaTime, worldWidth, worldHeight) {
        this.personality = this.gameState.personalityMode;

        // Apply Personality Modifiers
        const speedMultiplier = this.personality === 'RATIONAL' ? 1.0 : 1.5;
        this.damage = this.personality === 'RATIONAL' ? 10 : 25;
        
        // Handle Input
        if (!this.isStunned) {
            const move = this.input.getMovement();
            
            // Chaos mode adds jitter to input
            if (this.personality === 'CHAOS') {
                this.input.updateJitter(0.2);
            } else {
                this.input.updateJitter(0);
            }

            this.vx += move.x * this.speed * speedMultiplier;
            
            // Attack
            if (this.input.isDown('KeyJ')) {
                this.attack();
            }

            // Block
            this.isBlocking = this.input.isDown('KeyK');

            // Personality Switch (Manual)
            if (this.input.isDown('Space')) {
                if (!this.spacePressed) {
                    this.gameState.togglePersonality();
                    this.spacePressed = true;
                }
            } else {
                this.spacePressed = false;
            }
        }

        super.update(deltaTime, worldWidth, worldHeight);
    }
}

// End of module: E:\Fight Club\src\game\Player.js

// Module finalized by SOUMILCHANDRA

// Module finalized by SOUMILCHANDRA
