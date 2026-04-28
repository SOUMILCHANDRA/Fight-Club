/**
 * @file E:\Fight Club\src\systems\CombatSystem.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\systems\CombatSystem.js
 * @description Senior implementation for Project Mayhem.
 */
import * as THREE from 'three';

export class CombatSystem {
    constructor(game) {
        this.game = game;
    }

    processPunch(attacker) {
        const punchRange = 2;
        const strength = attacker.stats[attacker.currentMode].strength;

        // Find all entities except attacker
        for (const entity of this.game.entities) {
            if (entity === attacker) continue;
            
            const dist = attacker.mesh.position.distanceTo(entity.mesh.position);
            if (dist < punchRange) {
                this.hit(attacker, entity, strength);
            }
        }
    }

    hit(attacker, target, damage) {
        if (target.takeDamage) {
            target.takeDamage(damage);
        }

        // Visual feedback
        this.game.cameraShake(0.3);
        
        // Add a small blood/hit effect (simple particle or flash)
        console.log(`COMBAT: ${attacker.constructor.name} hit ${target.constructor.name} for ${damage}`);
    }
}

// End of module: E:\Fight Club\src\systems\CombatSystem.js
