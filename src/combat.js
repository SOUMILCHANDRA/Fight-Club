/**
 * Project Mayhem: Combat Processor
 * Handles hit detection and damage application.
 */
export class Combat {
    constructor(effects, sanity) {
        this.effects = effects;
        this.sanity = sanity;
    }

    process(player, enemies) {
        // Player Attack Check
        if (player.isAttacking && !player.hitResolved) {
            enemies.forEach(enemy => {
                if (this.checkCollision(player, enemy, 80)) {
                    const damage = this.sanity.tier === 'HALLUCINATING' ? 50 : 20;
                    enemy.takeDamage(damage);
                    player.hitResolved = true;
                    
                    // Visual feedback
                    this.effects.shake(10, 200);
                    const pColor = Math.random() > 0.8 ? '#ff0044' : '#fff';
                    this.effects.spawnParticles(enemy.x, enemy.y - 40, pColor);
                }
            });
        }

        // Enemy Attack Check
        enemies.forEach(enemy => {
            if (enemy.isAttacking && !enemy.hitResolved) {
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
