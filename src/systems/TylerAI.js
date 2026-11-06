import * as THREE from 'three';

/**
 * TylerAI: The reckless, visceral AI engine that assumes full autonomous control
 * of the player's body during psychiatric takeover / blackout episodes.
 * Relentlessly stalks the opponent, unleashes blistering boxing combos,
 * taunts with sadistic laughter, and completely ignores stagger.
 */
export class TylerAI {
    constructor(game) {
        this.game = game;
        this.player = null;

        this.comboTimer = 0;
        this.comboStep = 0; // 0: jab, 1: cross, 2: hook, 3: taunt
        this.actionCooldown = 0.28;
        this.tauntCooldown = 4.5;
        this.isExecutingCombo = false;
    }

    setPlayer(player) {
        this.player = player;
    }

    update(dt) {
        if (!this.player || this.player.isDead) return;

        // Ensure Tyler stats and model are loaded
        if (this.player.currentMode !== 'tyler') {
            this.player.currentMode = 'tyler';
            this.player.loadModel('tyler');
        }

        // Drain sanity while Tyler has conscious dominion
        if (this.game.sanity) {
            this.game.sanity.drain(4.5 * dt);
        }

        const enemy = this.game.enemies.find(e => !e.isDead);
        if (!enemy || !enemy.mesh) {
            this.player.playAction('boxing_idle', 0.2);
            return;
        }

        const playerPos = this.player.mesh.position;
        const enemyPos = enemy.mesh.position;

        // Smoothly rotate body to face enemy directly
        const toEnemy = new THREE.Vector3().subVectors(enemyPos, playerPos);
        toEnemy.y = 0;
        const dist = toEnemy.length();

        if (dist > 0.001) {
            const targetAngle = Math.atan2(toEnemy.x, toEnemy.z);
            let currentAngle = this.player.mesh.rotation.y;
            let diff = targetAngle - currentAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.player.mesh.rotation.y += diff * Math.min(1.0, 14.0 * dt);
        }

        // Action cooldown decrement
        this.actionCooldown -= dt;
        this.tauntCooldown -= dt;

        // Engagement ranges:
        // Ideal striking range: 1.1 - 1.3 units
        const attackRange = 1.32;

        if (dist > attackRange) {
            // Relentless forward advance (foot-sliding prevention handled by speed scaling)
            const forwardSpeed = this.player.stats.tyler.speed;
            const moveDir = toEnemy.clone().normalize();
            this.player.mesh.position.addScaledVector(moveDir, forwardSpeed * dt);
            this.player.clampInsideRing();

            // Drive walk animation with speed match
            const walkScale = forwardSpeed / 2.8;
            this.player.playAction('walk', 0.12, walkScale);
        } else {
            // In striking range! Unleash Tyler's chaotic boxing barrage
            if (this.actionCooldown <= 0) {
                this.executeNextComboMove(enemy, dist);
            }
        }
    }

    executeNextComboMove(enemy, dist) {
        // High chance of savage offensive combos
        const roll = Math.random();

        if (this.tauntCooldown <= 0 && roll < 0.22 && enemy.isBlocking) {
            // Taunt opponent when blocked or staggered
            this.player.playAction('pained_laugh', 0.15);
            this.actionCooldown = 0.9;
            this.tauntCooldown = 6.0;
            if (this.game.effects) this.game.effects.glitchBurst(0.2);
            if (this.game.ui) this.game.ui.showToast('"IS THAT ALL YOU GOT?!"', 1200);
            return;
        }

        // 3-hit combination sequence: Jab -> Cross -> Hook
        if (this.comboStep === 0) {
            this.player.performAttack('light');
            this.actionCooldown = 0.32;
            this.comboStep = 1;
        } else if (this.comboStep === 1) {
            this.player.performAttack('light');
            this.actionCooldown = 0.36;
            this.comboStep = 2;
        } else {
            this.player.performAttack('heavy');
            this.actionCooldown = 0.55;
            this.comboStep = 0; // Reset combo sequence
        }
    }
}
