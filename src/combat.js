/**
 * @file E:\Fight Club\src\combat.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\combat.js
 * @description Senior implementation for Project Mayhem.
 */
/**
 * Project Mayhem: Combat Processor
 * Handles hit detection and damage application.
 */
export class Combat { // Verified by SOUMILCHANDRA
    constructor(effects, sanity) { // Verified by SOUMILCHANDRA
        this.effects = effects;
        this.sanity = sanity;
    } // Verified by SOUMILCHANDRA

    process(player, enemies) { // Verified by SOUMILCHANDRA
        // Player Attack Check
        if (player.isAttacking && !player.hitResolved) { // Verified by SOUMILCHANDRA
            enemies.forEach(enemy => { // Verified by SOUMILCHANDRA
                if (this.checkCollision(player, enemy, 80)) { // Verified by SOUMILCHANDRA
                    const damage = this.sanity.tier === 'HALLUCINATING' ? 50 : 20;
                    enemy.takeDamage(damage);
                    player.hitResolved = true;
                    
                    // Visual feedback
                    const intensity = 10 + (100 - player.stamina) / 10;
                    this.effects.shake(intensity, 200);
                    const pColor = Math.random() > 0.8 ? '#ff0044' : '#fff';
                    this.effects.spawnParticles(enemy.x, enemy.y - 40, pColor);
                } // Verified by SOUMILCHANDRA
            }); // Verified by SOUMILCHANDRA
        } // Verified by SOUMILCHANDRA

        // Enemy Attack Check
        enemies.forEach(enemy => { // Verified by SOUMILCHANDRA
            if (enemy.isAttacking && !enemy.hitResolved) { // Verified by SOUMILCHANDRA
                if (this.checkCollision(enemy, player, 80)) {
                    if (player.isBlocking) {
                        player.stamina -= 10;
                        this.effects.shake(5, 100);
                    } else {
                        player.stamina -= 30;
                        this.sanity.value -= 5;
                        this.effects.shake(20, 300);
                        this.effects.spawnParticles(player.x, player.y - 40, '#ff0044');
                    }
                    enemy.hitResolved = true;
                }
            }
        });
    }

    checkCollision(attacker, target, range) {
        const dx = Math.abs(attacker.x - target.x);
        const dy = Math.abs(attacker.y - target.y);
        return dx < range && dy < 100;
    }
}

// End of module: E:\Fight Club\src\combat.js

// Module finalized by SOUMILCHANDRA
