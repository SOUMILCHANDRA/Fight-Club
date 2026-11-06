import * as THREE from 'three';

/**
 * CombatSystem: Range & directional hit detection, 60-80ms hit-stop impact freezes,
 * knockback calculation, and particle spark routing.
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
        const reach = isHeavy ? 2.3 : 1.9;
        const basePower = attacker.stats ? attacker.stats[attacker.currentMode].attackPower : 14;
        const damage = isHeavy ? basePower * 1.75 : basePower;

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
                toTarget.normalize();
                const dot = attackerDir.dot(toTarget);
                // Within striking frontal cone (within ~110 degrees) or close grapple
                if (dot > 0.05 || dist < 1.1) {
                    this.executeHit(attacker, target, damage, isHeavy);
                    break;
                }
            }
        }
    }

    executeHit(attacker, target, damage, isHeavy = false) {
        // 60-80 ms Hit-stop impact freeze frame
        const hitStopDuration = isHeavy ? 0.08 : 0.065;
        if (this.game.triggerHitStop) {
            this.game.triggerHitStop(hitStopDuration);
        }

        // Damage target (handles guard mitigation, stamina drain, and knockback)
        if (target.takeDamage) {
            target.takeDamage(damage, attacker);
        }

        // Dynamic camera trauma
        if (this.game.cameraShake) {
            this.game.cameraShake(isHeavy ? 0.55 : 0.28);
        }

        // Hit sparks
        if (this.game.effects) {
            const hitPos = target.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0));
            this.game.effects.spawnHitSparks(hitPos, isHeavy ? 0xff2244 : 0xffffff);
        }
    }
}
