/**
 * GameLoop: Orchestrates frame timing, delta-time calculation,
 * hit-stop frame freezes, and decoupled update/render phases.
 */
export class GameLoop {
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        
        this.lastTime = 0;
        this.isRunning = false;
        this.hitStopTimer = 0;
        this.animFrameId = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.isRunning = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    triggerHitStop(duration = 0.05) {
        this.hitStopTimer = duration;
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        // Calculate delta time in seconds
        const elapsedMs = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Clamp delta-time (minimum 0, maximum 0.1s to avoid physics explosion on tab switches)
        const dt = Math.min(Math.max(0, elapsedMs / 1000), 0.1);

        // Handle hit-stop freeze frames
        if (this.hitStopTimer > 0) {
            this.hitStopTimer -= dt;
            if (this.renderFn) this.renderFn(0);
            this.animFrameId = requestAnimationFrame((t) => this.loop(t));
            return;
        }

        // 1. UPDATE PHASE
        if (this.updateFn) {
            this.updateFn(dt);
        }

        // 2. RENDER PHASE
        if (this.renderFn) {
            this.renderFn(dt);
        }

        this.animFrameId = requestAnimationFrame((t) => this.loop(t));
    }
}
