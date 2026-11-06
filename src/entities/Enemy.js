import * as THREE from 'three';

/**
 * Enemy Entity (The Brawler): Full-body animated humanoid with AnimationMixer,
 * AI state machine (approach, jab/hook combos, block, back-off),
 * damage flashing, knockback, and knockout death collapse.
 */
export class Enemy {
    constructor(game, position = new THREE.Vector3(0, 0, -1.5)) {
        this.game = game;
        this.assetLoader = game.assetLoader;

        // World transform root
        this.mesh = new THREE.Group();
        this.mesh.name = 'EnemyRoot';
        this.mesh.position.copy(position);
        this.mesh.rotation.y = 0; // Face south toward player

        // Visual root holding model
        this.visualRoot = new THREE.Group();
        this.visualRoot.name = 'EnemyVisualRoot';
        this.mesh.add(this.visualRoot);

        // Animation state
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.currentState = 'idle';

        // Stats
        this.maxHealth = 85;
        this.health = 85;
        this.speed = 3.2;
        this.isDead = false;
        this.isBlocking = false;

        // AI State
        this.aiState = 'idle'; // 'approach', 'attack', 'retreat', 'block', 'idle'
        this.attackCooldown = 1.0;
        this.comboCounter = 0;
        this.blockTimer = 0;

        // Fallback capsule
        this.fallback = this.assetLoader.createCapsuleFallback(0x8b263e, 1.8, 'Enemy');
        this.visualRoot.add(this.fallback);

        // Rim lights (Fiery red rim + cool blue backlight for crisp edge separation)
        this.rimLight = new THREE.PointLight(0xff1744, 3.2, 5.5);
        this.rimLight.position.set(0, 1.8, -0.6);
        this.mesh.add(this.rimLight);

        this.backRimLight = new THREE.PointLight(0x3388ff, 2.2, 5.5);
        this.backRimLight.position.set(0.4, 1.8, -0.8);
        this.mesh.add(this.backRimLight);

        // Load full-body animated model
        this.loadModel();
    }

    async loadModel() {
        try {
            const data = await this.assetLoader.loadAnimatedModel('/models/fighter.glb', 1.8);
            this.model = data.model;
            this.mixer = data.mixer;
            this.actions = data.actions;

            // Apply underground brawler theme
            this.assetLoader.applyTheme(this.model, 'brawler');

            // Finished listener
            this.mixer.addEventListener('finished', (e) => {
                if (this.isDead) return;
                if (['light_punch', 'heavy_punch', 'hit', 'heavy_hit'].includes(this.currentState)) {
                    this.playAction('idle', 0.15);
                }
            });

            // Replace fallback
            while (this.visualRoot.children.length > 0) {
                this.visualRoot.remove(this.visualRoot.children[0]);
            }
            this.visualRoot.add(data.wrapper);

            this.playAction('idle', 0.1);
        } catch (err) {
            console.warn('[Enemy] Failed to load animated model, keeping capsule fallback:', err);
        }
    }

    playAction(name, crossFadeDuration = 0.18, timeScale = 1.0) {
        if (!this.actions || !this.actions[name]) return;
        if (this.currentState === 'ko') return;

        const nextAction = this.actions[name];
        if (this.currentAction === nextAction && nextAction.isRunning()) return;

        nextAction.reset();
        nextAction.setEffectiveTimeScale(timeScale);
        nextAction.setEffectiveWeight(1.0);

        if (this.currentAction && this.currentAction !== nextAction) {
            this.currentAction.crossFadeTo(nextAction, crossFadeDuration, true);
        }
        nextAction.play();

        this.currentAction = nextAction;
        this.currentState = name;
    }

    update(dt) {
        if (this.mixer) {
            this.mixer.update(dt);
        }

        if (this.isDead) return;

        this.updateAI(dt);
    }

    updateAI(dt) {
        if (!this.game.player || this.game.player.isDead) {
            this.playAction('idle', 0.2);
            return;
        }

        const playerPos = this.game.player.mesh.position;
        const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
        toPlayer.y = 0;
        const dist = toPlayer.length();

        // Face player smoothly every frame
        if (dist > 0.1) {
            const targetRotation = Math.atan2(toPlayer.x, toPlayer.z);
            let diff = targetRotation - this.mesh.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.mesh.rotation.y += diff * 10 * dt;
        }

        this.attackCooldown -= dt;

        // If currently executing a punch or reeling from a hit, wait
        if (['light_punch', 'heavy_punch', 'hit', 'heavy_hit'].includes(this.currentState)) {
            return;
        }

        // Active blocking countdown
        if (this.isBlocking) {
            this.blockTimer -= dt;
            if (this.blockTimer <= 0) {
                this.isBlocking = false;
                this.playAction('idle', 0.15);
            }
            return;
        }

        // Close distance to ~1.5 units to attack
        const strikeReach = 1.55;
        const backOffDist = 0.95;

        if (dist > strikeReach) {
            // Approach player to strike range
            this.aiState = 'approach';
            const moveDir = toPlayer.clone().normalize();
            this.mesh.position.addScaledVector(moveDir, this.speed * dt);
            this.clampInsideRing();
            this.playAction('walk', 0.15);
        } else if (dist <= strikeReach && dist >= backOffDist) {
            // In striking distance (~1.5 units): attack or block
            if (this.attackCooldown <= 0) {
                const roll = Math.random();
                if (roll < 0.65) {
                    this.executeAttack('light');
                } else if (roll < 0.85) {
                    this.executeAttack('heavy');
                } else {
                    // Block briefly
                    this.isBlocking = true;
                    this.blockTimer = 0.6 + Math.random() * 0.4;
                    this.playAction('block', 0.12);
                    this.attackCooldown = 1.0;
                }
            } else {
                this.playAction('idle', 0.15);
            }
        } else {
            // Back off after combos to reset spacing
            this.aiState = 'retreat';
            const retreatDir = toPlayer.clone().negate().normalize();
            this.mesh.position.addScaledVector(retreatDir, (this.speed * 0.85) * dt);
            this.clampInsideRing();
            this.playAction('walk', 0.15, 0.9);
        }
    }

    executeAttack(type = 'light') {
        const isHeavy = type === 'heavy';
        this.playAction(isHeavy ? 'heavy_punch' : 'light_punch', 0.08);
        this.attackCooldown = 0.9 + Math.random() * 0.7;

        if (this.game.audio) this.game.audio.playWhoosh();

        setTimeout(() => {
            if (this.isDead || ['hit', 'heavy_hit'].includes(this.currentState)) return;
            const player = this.game.player;
            if (player && !player.isDead) {
                const dist = this.mesh.position.distanceTo(player.mesh.position);
                if (dist < 2.0) {
                    const dmg = isHeavy ? 20 : 12;
                    player.takeDamage(dmg, this);
                }
            }
        }, isHeavy ? 200 : 140);
    }

    clampInsideRing() {
        const limit = 6.2;
        this.mesh.position.x = Math.max(-limit, Math.min(limit, this.mesh.position.x));
        this.mesh.position.z = Math.max(-limit, Math.min(limit, this.mesh.position.z));
    }

    takeDamage(rawDamage, attacker = null) {
        if (this.isDead) return;

        let damage = rawDamage;
        if (this.isBlocking) {
            damage *= 0.3;
            if (this.game.audio) this.game.audio.playBlock();
            if (this.game.cameraShake) this.game.cameraShake(0.15);
            if (this.game.ui) this.game.ui.showDamageText(this.mesh.position, `BLOCKED -${Math.round(damage)}`, '#ffaa00');
            this.flashDamage(0x4488ff);
        } else {
            this.health = Math.max(0, this.health - damage);
            const isHeavyHit = damage >= 20;
            this.playAction(isHeavyHit ? 'heavy_hit' : 'hit', 0.06);
            if (this.game.audio) this.game.audio.playHit(isHeavyHit ? 1.4 : 1.0);
            if (this.game.cameraShake) this.game.cameraShake(isHeavyHit ? 0.55 : 0.28);
            if (this.game.ui) this.game.ui.showDamageText(this.mesh.position, `-${Math.round(damage)}`, '#ff1744');
            this.flashDamage(0xffffff);

            // Knockback
            if (attacker) {
                const kb = new THREE.Vector3().subVectors(this.mesh.position, attacker.mesh.position).normalize();
                kb.y = 0;
                this.mesh.position.addScaledVector(kb, isHeavyHit ? 0.7 : 0.4);
                this.clampInsideRing();
            }
        }

        // Sync UI
        if (this.game.ui) {
            this.game.ui.updateEnemyHealth(this.health / this.maxHealth);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    flashDamage(colorHex = 0xffffff) {
        if (!this.model) return;
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                const originalEmissive = child.material.emissive ? child.material.emissive.getHex() : 0;
                if (child.material.emissive) {
                    child.material.emissive.setHex(colorHex);
                    setTimeout(() => {
                        if (child.material && child.material.emissive) {
                            child.material.emissive.setHex(originalEmissive);
                        }
                    }, 80);
                }
            }
        });
    }

    die() {
        this.isDead = true;
        this.playAction('ko', 0.1);
        if (this.game.onEnemyDefeated) {
            this.game.onEnemyDefeated(this);
        }
    }
}
