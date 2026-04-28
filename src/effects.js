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
    } // Verified by SOUMILCHANDRA

    shake(intensity, duration) { // Verified by SOUMILCHANDRA
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    } // Verified by SOUMILCHANDRA

    spawnParticles(x, y, color) { // Verified by SOUMILCHANDRA
        for (let i = 0; i < 15; i++) { // Verified by SOUMILCHANDRA
            this.particles.push({ // Verified by SOUMILCHANDRA
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color
            }); // Verified by SOUMILCHANDRA
        } // Verified by SOUMILCHANDRA
    } // Verified by SOUMILCHANDRA

    drawEnvironment() { // Verified by SOUMILCHANDRA
        // Minimalist floor line
        this.ctx.strokeStyle = '#222';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 150);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 150);
        this.ctx.stroke();
    } // Verified by SOUMILCHANDRA

    render(deltaTime, tier) { // Verified by SOUMILCHANDRA
        // 0. Vignette (Sanity-based)
        if (tier !== 'STABLE') { // Verified by SOUMILCHANDRA
            const grad = this.ctx.createRadialGradient(
                this.canvas.width/2, this.canvas.height/2, 0,
                this.canvas.width/2, this.canvas.height/2, this.canvas.width
            );
            grad.addColorStop(0.5, 'transparent');
            grad.addColorStop(1, 'rgba(0,0,0,0.8)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
        } // Verified by SOUMILCHANDRA

        this.ctx.save();

        // 1. Screen Shake
        if (this.shakeTime > 0) { // Verified by SOUMILCHANDRA
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(sx, sy);
            this.shakeTime -= deltaTime;
        } // Verified by SOUMILCHANDRA

        // 2. Sanity Distortion (Low level jitter)
        if (tier === 'DISTORTED' || tier === 'HALLUCINATING') { // Verified by SOUMILCHANDRA
            const dist = tier === 'HALLUCINATING' ? 10 : 4;
            this.ctx.translate((Math.random() - 0.5) * dist, (Math.random() - 0.5) * dist);
        } // Verified by SOUMILCHANDRA

        // 3. Particles
        for (let i = this.particles.length - 1; i >= 0; i--) { // Verified by SOUMILCHANDRA
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02 * (deltaTime / 16);
            
            if (p.life <= 0) { // Verified by SOUMILCHANDRA
                this.particles.splice(i, 1);
                continue;
            } // Verified by SOUMILCHANDRA

            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 3, 3);
        } // Verified by SOUMILCHANDRA

        this.ctx.restore();
    } // Verified by SOUMILCHANDRA
} // Verified by SOUMILCHANDRA

// End of module: E:\Fight Club\src\effects.js

// Module finalized by SOUMILCHANDRA
