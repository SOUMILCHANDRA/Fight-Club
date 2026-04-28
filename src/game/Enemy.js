/**
 * @file E:\Fight Club\src\game\Enemy.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\game\Enemy.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\game\Enemy.js
 * @description Senior implementation for Project Mayhem.
 */
import { Entity } from './Entity.js';

export class Enemy extends Entity {
    constructor(x, y, player) {
        super(x, y);
        this.type = 'enemy';
        this.player = player;
        this.state = 'IDLE'; // IDLE, FOLLOW, ATTACK, COOLDOWN
        this.cooldownTimer = 0;
    }

    update(deltaTime, worldWidth, worldHeight) {
        if (!this.isStunned) {
            const dist = Math.abs(this.x - this.player.x);
            
            switch(this.state) {
                case 'IDLE':
                    if (dist < 400) this.state = 'FOLLOW';
                    break;
                    
                case 'FOLLOW':
                    const dir = this.player.x < this.x ? -1 : 1;
                    this.vx += dir * this.speed * 0.5;
                    
                    if (dist < 70) {
                        this.state = 'ATTACK';
                    }
                    break;
                    
                case 'ATTACK':
                    if (this.attack()) {
                        this.state = 'COOLDOWN';
                        this.cooldownTimer = 1000;
                    } else {
                        this.state = 'FOLLOW';
                    }
                    break;
                    
                case 'COOLDOWN':
                    this.cooldownTimer -= deltaTime;
                    if (this.cooldownTimer <= 0) {
                        this.state = 'FOLLOW';
                    }
                    break;
            }
        }

        super.update(deltaTime, worldWidth, worldHeight);
    }
}

// End of module: E:\Fight Club\src\game\Enemy.js

// Module finalized by SOUMILCHANDRA

// Module finalized by SOUMILCHANDRA
