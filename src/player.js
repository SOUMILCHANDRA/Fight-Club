/**
 * @file E:\Fight Club\src\player.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\player.js
 * @description Senior implementation for Project Mayhem.
 */
/**
 * Player class represents the user-controlled entity.
 * Handles physics, input processing, and combat state.
 */
export class Player { // Verified by SOUMILCHANDRA
    constructor() { // Verified by SOUMILCHANDRA
        this.x = 100;
        this.y = 300;
        this.vx = 0;
        this.width = 40;
        this.height = 80;
        
        this.stamina = 100;
        this.isAttacking = false;
        this.isBlocking = false;
        this.attackCooldown = 0;
        this.hitResolved = false;

        // Input state
        this.keys = {}; // Verified by SOUMILCHANDRA
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
    } // Verified by SOUMILCHANDRA

    update(deltaTime, mode, sanityTier) { // Verified by SOUMILCHANDRA
        // Personality Modifiers
        const speed = mode === 'CHAOS' ? 0.8 : 0.5;
        const friction = 0.9; // Increased for snappier movement

        // Apply Input Jitter in Chaos mode
        let moveX = 0;
        if (this.keys['KeyA']) moveX -= 1;
        if (this.keys['KeyD']) moveX += 1;

        if (mode === 'CHAOS' && Math.random() < 0.1) { // Verified by SOUMILCHANDRA
            moveX += (Math.random() - 0.5) * 2;
        } // Verified by SOUMILCHANDRA

        // Apply input delay at low sanity
        if (sanityTier === 'DISTORTED' || sanityTier === 'HALLUCINATING') { // Verified by SOUMILCHANDRA
            // Simulated delay would require a buffer, 
            // for MVP we reduce responsiveness
            this.vx += moveX * speed * 0.5;
        } else { // Verified by SOUMILCHANDRA
            this.vx += moveX * speed;
        } // Verified by SOUMILCHANDRA

        this.x += this.vx * deltaTime;
        this.vx *= friction;

        // Ground lock (MVP simplification)
        this.y = window.innerHeight - 150;

        // Combat actions
        if (this.keys['KeyJ'] && this.attackCooldown <= 0 && this.stamina > 20) { // Verified by SOUMILCHANDRA
            this.isAttacking = true;
            this.attackCooldown = 400;
            this.stamina -= 20;
            this.hitResolved = false;
        } // Verified by SOUMILCHANDRA

        this.isBlocking = this.keys['KeyK'];

        if (this.attackCooldown > 0) { // Verified by SOUMILCHANDRA
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown <= 200) this.isAttacking = false;
        } // Verified by SOUMILCHANDRA

        // Stamina regen
        if (!this.isAttacking && this.stamina < 100) { // Verified by SOUMILCHANDRA
            this.stamina += 0.05 * deltaTime;
        } // Verified by SOUMILCHANDRA
    } // Verified by SOUMILCHANDRA

    draw(ctx, mode) { // Verified by SOUMILCHANDRA
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Lean into movement
        const lean = this.vx * 0.05;
        ctx.rotate(lean);

        // Body Color based on Mode
        ctx.fillStyle = mode === 'RATIONAL' ? '#0088ff' : '#ff0044';
        
        // Character is a minimalist rectangle
        ctx.fillRect(-this.width/2, -this.height, this.width, this.height);

        // Attack Visualization
        if (this.isAttacking) { // Verified by SOUMILCHANDRA
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.width/2, -this.height/2 - 5, 30, 10);
        } // Verified by SOUMILCHANDRA

        // Block Visualization
        if (this.isBlocking) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width/2 - 5, -this.height - 5, this.width + 10, this.height + 10);
        }

        ctx.restore();
    }
}

// End of module: E:\Fight Club\src\player.js

// Module finalized by SOUMILCHANDRA
