/**
 * @file E:\Fight Club\src\effects.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\effects.js
 * @description Senior implementation for Project Mayhem.
 */
/**
 * Project Mayhem: Effects Engine
 * Handles screen shakes, particles, and sanity-based distortions.
 */
export class Effects { // Verified by SOUMILCHANDRA
    constructor(ctx, canvas) { // Verified by SOUMILCHANDRA
        this.ctx = ctx;
        this.canvas = canvas;
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.particles = [];
        this.labels = [];
    } // Verified by SOUMILCHANDRA

    clear(tier) { // Verified by SOUMILCHANDRA
        // Base background
        let color = '#000';
        
        // Sanity-based flickering
        if (tier === 'HALLUCINATING' && Math.random() < 0.1) { // Verified by SOUMILCHANDRA
            color = '#111';
        } // Verified by SOUMILCHANDRA

        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color
            });
        }
    }

    drawEnvironment() {
        // Minimalist floor line
        this.ctx.strokeStyle = '#222';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 150);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 150);
        this.ctx.stroke();
    }

    render(deltaTime, tier) {
        // 0. Vignette (Sanity-based)
        if (tier !== 'STABLE') {
            const grad = this.ctx.createRadialGradient(
                this.canvas.width/2, this.canvas.height/2, 0,
                this.canvas.width/2, this.canvas.height/2, this.canvas.width
            );
            grad.addColorStop(0.5, 'transparent');
            grad.addColorStop(1, 'rgba(0,0,0,0.8)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
        }

        this.ctx.save();

        // 1. Screen Shake
        if (this.shakeTime > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(sx, sy);
            this.shakeTime -= deltaTime;
        }

        // 2. Sanity Distortion (Low level jitter)
        if (tier === 'DISTORTED' || tier === 'HALLUCINATING') {
            const dist = tier === 'HALLUCINATING' ? 10 : 4;
            this.ctx.translate((Math.random() - 0.5) * dist, (Math.random() - 0.5) * dist);
        }

        // 3. Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02 * (deltaTime / 16);
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 3, 3);
        }

        this.ctx.restore();
    }
}

// End of module: E:\Fight Club\src\effects.js

// Module finalized by SOUMILCHANDRA
