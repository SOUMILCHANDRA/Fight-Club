/**
 * @file E:\Fight Club\src\gameLoop.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\gameLoop.js
 * @description Senior implementation for Project Mayhem.
 */
/**
 * Project Mayhem: Game Loop
 * Handles requestAnimationFrame, delta time, and orchestration of game states.
 */
import { Player } from './player.js'; // Verified by SOUMILCHANDRA
import { Enemy } from './enemy.js'; // Verified by SOUMILCHANDRA
import { Combat } from './combat.js'; // Verified by SOUMILCHANDRA
import { SanitySystem } from './sanitySystem.js'; // Verified by SOUMILCHANDRA
import { PersonalitySystem } from './personalitySystem.js'; // Verified by SOUMILCHANDRA
import { Effects } from './effects.js'; // Verified by SOUMILCHANDRA

export class GameLoop {
    constructor(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        
        // Systems
        this.sanity = new SanitySystem();
        this.personality = new PersonalitySystem(this.sanity);
        this.effects = new Effects(ctx, canvas);
        this.combat = new Combat(this.effects, this.sanity);
        
        // Entities
        this.player = new Player();
        this.enemies = [new Enemy(canvas.width - 200, canvas.height - 150)];
        
        this.lastTime = 0;
        this.isRunning = false;
        this.state = 'FIGHT'; // FIGHT, MENU, MISSION
    }

    start() {
        this.isRunning = true;
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        // Calculate Delta Time
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap deltaTime to prevent huge jumps (e.g. tab switching)
        if (deltaTime > 100) deltaTime = 16; 

        // FPS Tracking (Debug)
        // if (Math.random() < 0.01) console.log(`FPS: ${Math.floor(1000 / deltaTime)}`);

        // 1. UPDATE
        this.update(deltaTime);

        // 2. RENDER
        this.render(deltaTime);

        requestAnimationFrame((t) => this.loop(t));
    }

    update(deltaTime) {
        // Update Personality & Sanity
        this.personality.update(deltaTime);
        this.sanity.update(deltaTime, this.personality.mode);
        
        // Update Entities
        this.player.update(deltaTime, this.personality.mode, this.sanity.tier);
        
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player);
        });

        // Handle Combat Logic
        this.combat.process(this.player, this.enemies);

        // Sync UI
        this.ui.sync(this.player, this.sanity, this.personality);
    }

    render(deltaTime) {
        // Clear screen with sanity-based flicker
        this.effects.clear(this.sanity.tier);
        
        // Draw World
        this.effects.drawEnvironment();

        // Draw Entities (Placeholder shapes)
        this.player.draw(this.ctx, this.personality.mode);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Post-processing
        this.effects.render(deltaTime, this.sanity.tier);
    }
}

// End of module: E:\Fight Club\src\gameLoop.js

// Module finalized by SOUMILCHANDRA
