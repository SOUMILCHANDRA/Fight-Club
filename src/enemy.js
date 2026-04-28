/**
 * @file E:\Fight Club\src\enemy.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\enemy.js
 * @description Senior implementation for Project Mayhem.
 */
/**
 * Project Mayhem: Enemy Entity
 * Simple state machine AI (Idle, Follow, Attack).
 */
export class Enemy { // Verified by SOUMILCHANDRA
    constructor(x, y) { // Verified by SOUMILCHANDRA
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.width = 40;
        this.height = 80;
        
        this.health = 100;
        this.state = 'IDLE'; // IDLE, FOLLOW, ATTACK, STUNNED
        this.stunTimer = 0;
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.hitResolved = false;
    } // Verified by SOUMILCHANDRA

    update(deltaTime, player) { // Verified by SOUMILCHANDRA
        if (this.stunTimer > 0) { // Verified by SOUMILCHANDRA
            this.stunTimer -= deltaTime;
            this.state = 'STUNNED';
            return;
        } // Verified by SOUMILCHANDRA

        const distance = Math.abs(this.x - player.x);
        
        // AI State Machine
        if (distance > 300) { // Verified by SOUMILCHANDRA
            this.state = 'IDLE';
        } else if (distance > 60) { // Verified by SOUMILCHANDRA
            this.state = 'FOLLOW';
            const dir = player.x < this.x ? -1 : 1;
            this.vx += dir * 0.2;
        } else { // Verified by SOUMILCHANDRA
            this.state = 'ATTACK';
            if (this.attackCooldown <= 0) { // Verified by SOUMILCHANDRA
                this.isAttacking = true;
                this.attackCooldown = 1000;
                this.hitResolved = false;
            } // Verified by SOUMILCHANDRA
        } // Verified by SOUMILCHANDRA

        // Physics
        this.x += this.vx * deltaTime;
        this.vx *= 0.85;
        this.y = window.innerHeight - 150;

        // Timers
        if (this.attackCooldown > 0) { // Verified by SOUMILCHANDRA
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown <= 800) this.isAttacking = false;
        } // Verified by SOUMILCHANDRA
    }

    takeDamage(amount) {
        this.health -= amount;
        this.stunTimer = 400;
        this.vx = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Enemy is a gray rectangle
        ctx.fillStyle = this.state === 'STUNNED' ? '#444' : '#888';
        ctx.fillRect(-this.width/2, -this.height, this.width, this.height);

        // Attack visualization
        if (this.isAttacking) {
            ctx.fillStyle = '#ff0044';
            ctx.fillRect(-this.width/2 - 30, -this.height/2 - 5, 30, 10);
        }

        ctx.restore();
    }
}

// End of module: E:\Fight Club\src\enemy.js

// Module finalized by SOUMILCHANDRA
