import * as THREE from 'three';

/**
 * Enemy Entity: Brawler AI with procedural animation, capsule fallback,
 * GLTF model loading, and dynamic combat states (approach, attack, retreat, block).
 */
export class Enemy {
    constructor(game, position = new THREE.Vector3(0, 0, -5)) {
        this.game = game;
        this.assetLoader = game.assetLoader;

        // Root container for world transform
        this.mesh = new THREE.Group();
        this.mesh.name = 'EnemyRoot';
        this.mesh.position.copy(position);

        // Visual root that receives procedural animation offsets/rotations
        this.visualRoot = new THREE.Group();
        this.visualRoot.name = 'EnemyVisualRoot';
        this.mesh.add(this.visualRoot);

        // Stats
        this.maxHealth = 80;
        this.health = 80;
        this.speed = 3.2;
        this.attackPower = 10;
        this.isDead = false;
        this.isBlocking = false;

        // AI State
        this.state = 'idle'; // 'approach', 'attack', 'retreat', 'block', 'idle'
        this.aiTimer = 0;
        this.attackCooldown = 1.0;
        this.attackType = 'light';

        // Procedural Animation State
        this.animState = 'idle';
        this.animTime = 0;
        this.animDuration = 0;
        this.walkCycle = 0;
        this.idleCycle = Math.random() * 5;

        // Fallback capsule mesh immediately (underground brawler maroon)
        this.fallback = this.assetLoader.createCapsuleFallback(0x8b263e, 1.85, 'Enemy');
        this.visualRoot.add(this.fallback);

        // Enemy local rim light
        this.rimLight = new THREE.PointLight(0xff5533, 1.2, 4);
        this.rimLight.position.set(0, 1.7, -0.5);
        this.mesh.add(this.rimLight);

        // Load 3D model
        this.loadModel();
    }

    async loadModel() {
        try {
            const model = await this.assetLoader.loadModel('/models/narrator.glb', 1.85);
            // Apply darker, scarred fighter tinting to distinguish enemy
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(m => this.createEnemyMaterial(m));
                    } else {
                        child.material = this.createEnemyMaterial(child.material);
                    }
                }
            });

            // Replace fallback
            while (this.visualRoot.children.length > 0) {
                this.visualRoot.remove(this.visualRoot.children[0]);
            }
            this.visualRoot.add(model);
        } catch (err) {
            console.warn('[Enemy] Model load failed, keeping capsule fallback:', err);
        }
    }

    createEnemyMaterial(origMat) {
        const mat = origMat.clone();
        if (mat.color) {
            // Darken and shift towards gritty bruised red-brown
            mat.color.multiplyScalar(0.7);
            mat.color.r = Math.min(1.0, mat.color.r * 1.3);
        }
        return mat;
    }

    triggerAnimation(state, duration = 0.3) {
        if (this.animState === 'ko') return;
        this.animState = state;
        this.animTime = 0;
        this.animDuration = duration;
    }

    update(dt) {
        if (this.isDead) {
            this.updateProceduralAnimation(dt);
            return;
        }

        this.updateAI(dt);
        this.updateProceduralAnimation(dt);
    }

    updateAI(dt) {
        if (!this.game.player || this.game.player.isDead) {
            this.animState = 'idle';
            return;
        }

        const playerPos = this.game.player.mesh.position;
        const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
        toPlayer.y = 0; // lock horizontal plane
        const dist = toPlayer.length();

        // Always smoothly face player
        if (dist > 0.1) {
            const targetRotation = Math.atan2(toPlayer.x, toPlayer.z);
            let diff = targetRotation - this.mesh.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.mesh.rotation.y += diff * 8 * dt;
        }

        this.aiTimer -= dt;
        this.attackCooldown -= dt;

        // If in middle of an attack or hit flinch, wait
        if (this.animState === 'attack' || this.animState === 'hit') {
            return;
        }

        // Simple State Machine
        const attackRange = 1.6;
        const retreatRange = 1.0;

        if (dist > attackRange) {
            // Approach
            this.state = 'approach';
            this.isBlocking = false;
            this.animState = 'walk';

            const moveDir = toPlayer.clone().normalize();
            this.mesh.position.addScaledVector(moveDir, this.speed * dt);
            this.walkCycle += dt * this.speed;
        } else if (dist <= attackRange && dist >= retreatRange) {
            // In striking zone
            if (this.attackCooldown <= 0) {
                // Decide action: 70% attack, 30% block
                if (Math.random() < 0.7) {
                    this.performAttack();
                } else {
                    this.isBlocking = true;
                    this.animState = 'block';
                    this.attackCooldown = 0.8 + Math.random() * 0.5;
                }
            } else {
                if (this.isBlocking) {
                    this.animState = 'block';
                } else {
                    this.animState = 'idle';
                }
            }
        } else {
            // Too close: retreat back slightly to reset spacing
            this.state = 'retreat';
            this.animState = 'walk';
            const retreatDir = toPlayer.clone().negate().normalize();
            this.mesh.position.addScaledVector(retreatDir, (this.speed * 0.7) * dt);
            this.walkCycle += dt * this.speed;
        }

        // Clamp inside arena bounds (-18 to +18)
        this.mesh.position.x = Math.max(-18, Math.min(18, this.mesh.position.x));
        this.mesh.position.z = Math.max(-18, Math.min(18, this.mesh.position.z));
    }

    performAttack() {
        this.isBlocking = false;
        const isHeavy = Math.random() < 0.35;
        this.attackType = isHeavy ? 'heavy' : 'light';
        const duration = isHeavy ? 0.45 : 0.3;
        this.triggerAnimation('attack', duration);
        this.attackCooldown = 1.0 + Math.random() * 0.8;

        if (this.game.audio) this.game.audio.playWhoosh();

        // Deliver damage at apex of punch
        setTimeout(() => {
            if (this.isDead || this.animState === 'hit') return;
            const player = this.game.player;
            if (player && !player.isDead) {
                const dist = this.mesh.position.distanceTo(player.mesh.position);
                if (dist < 2.0) {
                    const dmg = (this.attackType === 'heavy' ? 18 : 10);
                    player.takeDamage(dmg, this);
                }
            }
        }, (duration * 0.5) * 1000);
    }

    takeDamage(rawDamage, attacker = null) {
        if (this.isDead) return;

        let damage = rawDamage;
        if (this.isBlocking) {
            damage *= 0.3;
            this.triggerAnimation('block', 0.2);
            if (this.game.audio) this.game.audio.playHit(0.5);
            if (this.game.cameraShake) this.game.cameraShake(0.15);
        } else {
            this.health = Math.max(0, this.health - damage);
            this.triggerAnimation('hit', 0.3);
            if (this.game.audio) this.game.audio.playHit(1.0);
            if (this.game.cameraShake) this.game.cameraShake(0.35);

            // Knockback
            if (attacker) {
                const kb = new THREE.Vector3().subVectors(this.mesh.position, attacker.mesh.position).normalize();
                this.mesh.position.addScaledVector(kb, 0.45);
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

    die() {
        this.isDead = true;
        this.animState = 'ko';
        this.animTime = 0;
        this.animDuration = 1.0;
        if (this.game.onEnemyDefeated) {
            this.game.onEnemyDefeated(this);
        }
    }

    updateProceduralAnimation(dt) {
        this.animTime += dt;
        this.idleCycle += dt;

        this.visualRoot.position.set(0, 0, 0);
        this.visualRoot.rotation.set(0, 0, 0);

        const progress = Math.min(1, this.animTime / (this.animDuration || 1));

        switch (this.animState) {
            case 'idle':
                this.visualRoot.position.y = Math.sin(this.idleCycle * 2.5) * 0.02;
                this.visualRoot.rotation.z = Math.sin(this.idleCycle * 1.2) * 0.01;
                break;

            case 'walk':
                this.visualRoot.position.y = Math.abs(Math.sin(this.walkCycle * 7)) * 0.06;
                this.visualRoot.rotation.z = Math.sin(this.walkCycle * 3.5) * 0.04;
                this.visualRoot.rotation.x = 0.06;
                break;

            case 'attack': {
                const strike = Math.sin(progress * Math.PI);
                this.visualRoot.position.z = -strike * (this.attackType === 'heavy' ? 0.55 : 0.35);
                this.visualRoot.rotation.y = strike * 0.3;
                if (progress >= 1) this.animState = 'idle';
                break;
            }

            case 'block':
                this.visualRoot.position.y = -0.06;
                this.visualRoot.position.z = 0.06;
                this.visualRoot.rotation.x = -0.06;
                break;

            case 'hit': {
                const recoil = Math.sin(progress * Math.PI);
                this.visualRoot.position.z = recoil * 0.35;
                this.visualRoot.rotation.x = -recoil * 0.25;
                if (progress >= 1) this.animState = 'idle';
                break;
            }

            case 'ko': {
                const fall = Math.min(1, this.animTime * 2);
                this.visualRoot.position.y = (1 - fall) * 0.9 + 0.15;
                this.visualRoot.rotation.x = -fall * (Math.PI / 2);
                break;
            }
        }
    }
}
