import * as THREE from 'three';

/**
 * CombatSystem: Hit detection, hit-stop frame freeze, knockback,
 * and damage routing between entities.
 */
export class CombatSystem {
    constructor(game) {
        this.game = game;
    }

    processAttack(attacker, attackType = 'light') {
        const isPlayer = attacker === this.game.player;
        const targets = isPlayer ? this.game.enemies : [this.game.player];
        if (!targets) return;

        const isHeavy = attackType === 'heavy';
        const reach = isHeavy ? 2.2 : 1.8;
        const basePower = attacker.stats ? attacker.stats[attacker.currentMode].attackPower : 12;
        const damage = isHeavy ? basePower * 1.7 : basePower;

        const attackerPos = attacker.mesh.position;
        const attackerDir = new THREE.Vector3();
        attacker.mesh.getWorldDirection(attackerDir);

        for (const target of targets) {
            if (!target || target.isDead) continue;

            const targetPos = target.mesh.position;
            const toTarget = new THREE.Vector3().subVectors(targetPos, attackerPos);
            toTarget.y = 0;
            const dist = toTarget.length();

            if (dist <= reach) {
                // Check if target is in front of attacker (cone within ~100 degrees)
                toTarget.normalize();
                const dot = attackerDir.dot(toTarget);
                if (dot > 0.1 || dist < 1.0) {
                    this.executeHit(attacker, target, damage, isHeavy);
                    break;
                }
            }
        }
    }

    executeHit(attacker, target, damage, isHeavy = false) {
        // Hit-stop effect (short pause for visual punch impact)
        if (this.game.triggerHitStop) {
            this.game.triggerHitStop(isHeavy ? 0.08 : 0.04);
        }

        // Damage target
        if (target.takeDamage) {
            target.takeDamage(damage, attacker);
        }

        // Screen shake
        if (this.game.cameraShake) {
            this.game.cameraShake(isHeavy ? 0.5 : 0.25);
        }

        // Particle sparks / hit flash
        if (this.game.effects) {
            const hitPos = target.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
            this.game.effects.spawnHitSparks(hitPos, isHeavy ? 0xff3e3e : 0xffffff);
        }
    }
}
