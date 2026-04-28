/**
 * @file E:\Fight Club\src\game\Entity.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\game\Entity.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\game\Entity.js
 * @description Senior implementation for Project Mayhem.
 */
export class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 30;
        this.height = 80;
        this.speed = 0.5;
        this.friction = 0.85;
        
        this.stamina = 100;
        this.maxStamina = 100;
        
        this.isAttacking = false;
        this.attackTimer = 0;
        this.isBlocking = false;
        this.isStunned = false;
        this.stunTimer = 0;
        
        this.hitResolved = false;
        this.damage = 10;
    }

    update(deltaTime, worldWidth, worldHeight) {
        // Physics
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Ground constraints
        const groundY = worldHeight - 150;
        if (this.y > groundY) {
            this.y = groundY;
            this.vy = 0;
        }

        // Boundary constraints
        if (this.x < 50) this.x = 50;
        if (this.x > worldWidth - 50) this.x = worldWidth - 50;

        // Timers
        if (this.attackTimer > 0) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.hitResolved = false;
            }
        }

        if (this.stunTimer > 0) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
            }
        }

        // Stamina recovery
        if (!this.isAttacking && !this.isBlocking && !this.isStunned) {
            this.stamina += 0.02 * deltaTime;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
        }
    }

    attack() {
        if (this.stamina >= 20 && !this.isAttacking && !this.isStunned) {
            this.isAttacking = true;
            this.attackTimer = 300;
            this.stamina -= 20;
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        if (this.isBlocking) {
            this.stamina -= amount * 0.5;
            if (this.stamina < 0) {
                this.stamina = 0;
                this.isBlocking = false;
                this.isStunned = true;
                this.stunTimer = 1000;
            }
        } else {
            this.stamina -= amount;
            this.isStunned = true;
            this.stunTimer = 500;
        }
    }
}

// End of module: E:\Fight Club\src\game\Entity.js

// Module finalized by SOUMILCHANDRA

// Module finalized by SOUMILCHANDRA
