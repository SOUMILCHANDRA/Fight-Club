/**
 * @file E:\Fight Club\src\engine\Renderer.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\engine\Renderer.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\engine\Renderer.js
 * @description Senior implementation for Project Mayhem.
 */
export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.particles = [];
        this.flickerTimer = 0;
    }

    clear(tier) {
        let bgColor = '#0a0a0a';
        
        // Flicker effect at low sanity
        if (tier === 'HALLUCINATING' || tier === 'DISTORTED') {
            if (Math.random() < 0.05) {
                bgColor = '#1a1a1a'; // Quick flash
            }
        }

        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    spawnParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: color
            });
        }
    }

    drawEnvironment() {
        this.ctx.save();
        
        // Draw some "underground" floor textures
        const floorHeight = 100;
        const y = this.canvas.height - floorHeight;
        
        this.ctx.fillStyle = '#151515';
        this.ctx.fillRect(0, y, this.canvas.width, floorHeight);
        
        // Grid lines for perspective
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.beginPath();
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.moveTo(i, y);
            this.ctx.lineTo(i, this.canvas.height);
        }
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawEntity(entity) {
        this.ctx.save();
        
        // Apply Screen Shake
        if (this.shakeDuration > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(sx, sy);
            this.shakeDuration -= 16; // Approx 60fps
        }

        // Draw Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(entity.x, entity.y + entity.height - 10, 30, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw Entity (Silhouette style)
        this.ctx.translate(entity.x, entity.y);
        
        // Body color based on personality/state
        let color = '#fff';
        if (entity.type === 'player') {
            color = entity.personality === 'RATIONAL' ? '#00d2ff' : '#ff0055';
        } else {
            color = '#888'; // Enemy
        }

        if (entity.isStunned) color = '#555';
        if (entity.isBlocking) color = '#aaa';

        this.ctx.fillStyle = color;
        
        // Simple procedural silhouette
        // Head
        this.ctx.beginPath();
        this.ctx.arc(0, -20, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Body
        this.ctx.fillRect(-15, 0, 30, 60);

        // Arms (simple animation based on state)
        if (entity.isAttacking) {
            this.ctx.fillRect(10, 5, 40, 10); // Punch
        } else if (entity.isBlocking) {
            this.ctx.fillRect(-25, 5, 15, 30); // Block left
            this.ctx.fillRect(10, 5, 15, 30);  // Block right
        }

        this.ctx.restore();
    }

    postProcess(mode, tier) {
        // Apply Distortion based on tier
        if (tier === 'DISTORTED' || tier === 'HALLUCINATING') {
            this.ctx.save();
            const distortion = tier === 'HALLUCINATING' ? 10 : 5;
            this.ctx.translate((Math.random() - 0.5) * distortion, (Math.random() - 0.5) * distortion);
            // We could use drawImage to shift the whole canvas, but for now we'll do simple jitter
        }

        if (mode === 'CHAOS' || tier !== 'STABLE') {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'screen';
            
            let overlayColor = 'rgba(255, 0, 85, 0.05)';
            if (tier === 'DISTORTED') overlayColor = 'rgba(255, 0, 85, 0.15)';
            if (tier === 'HALLUCINATING') overlayColor = 'rgba(255, 0, 85, 0.25)';
            
            this.ctx.fillStyle = overlayColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        if (tier === 'DISTORTED' || tier === 'HALLUCINATING') {
            this.ctx.restore(); // Restore from distortion translate
        }
    }

    drawGhostEntity(x, y) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3; // Faint ghost
        this.ctx.translate(x, y);
        
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(0, -20, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(-15, 0, 30, 60);
        
        this.ctx.restore();
    }

    drawParticles(deltaTime) {
        this.ctx.save();
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
            this.ctx.fillRect(p.x, p.y, 4, 4);
        }
        this.ctx.restore();
    }
}

// End of module: E:\Fight Club\src\engine\Renderer.js

// Module finalized by SOUMILCHANDRA
