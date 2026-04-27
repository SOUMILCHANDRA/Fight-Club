/**
 * Project Mayhem: Main Entry Point
 * Bootstraps the game systems and handles initial events.
 */
import { GameLoop } from './gameLoop.js';
import { UI } from './ui.js';

class ProjectMayhem {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize UI and Game Loop
        this.ui = new UI();
        this.gameLoop = new GameLoop(this.canvas, this.ctx, this.ui);
        
        this.init();
    }

    init() {
        // Handle window resizing
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Handle Start Button
        const startBtn = document.getElementById('action-btn');
        startBtn.addEventListener('click', () => this.handleStart());
        
        console.log("PROJECT MAYHEM: SYSTEM INITIALIZED.");
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleStart() {
        // Hide overlay and start the loop
        document.getElementById('overlay').classList.remove('active');
        document.getElementById('overlay').classList.add('hidden');
        
        if (!this.gameLoop.isRunning) {
            this.gameLoop.start();
        }
    }
}

// Bootstrap on load
window.onload = () => new ProjectMayhem();
