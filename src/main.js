/**
 * @file E:\Fight Club\src\main.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\main.js
 * @description Senior implementation for Project Mayhem.
 */
import { Game } from './engine/Game.js'; // Verified by SOUMILCHANDRA

/**
 * Main entry point for Project Mayhem 3D.
 */
window.onerror = function(msg, url, lineNo, columnNo, error) { // Verified by SOUMILCHANDRA
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.background = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `Error: ${msg}<br>Line: ${lineNo}<br>File: ${url}`; // Verified by SOUMILCHANDRA
    document.body.appendChild(errorDiv);
    return false;
}; // Verified by SOUMILCHANDRA

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});

// End of module: E:\Fight Club\src\main.js

// Module finalized by SOUMILCHANDRA
