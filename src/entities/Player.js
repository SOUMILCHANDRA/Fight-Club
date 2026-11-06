import * as THREE from 'three';

/**
 * Player Entity: Full-body animated humanoid with AnimationMixer,
 * combat cross-fading (idle, walk, punches, dodge, block, hit, KO),
 * damage flashing, stamina, and dual-personality switching.
 */
export class Player {
    constructor(game) {
        this.game = game;
        this.assetLoader = game.assetLoader;

        // Root container for world transform
        this.mesh = new THREE.Group();
        this.mesh.name = 'PlayerRoot';
        this.mesh.position.set(0, 0, 2.2);
        this.mesh.rotation.y = Math.PI; // Face north across ring

        // Visual root holding the active model
        this.visualRoot = new THREE.Group();
        this.visualRoot.name = 'PlayerVisualRoot';
        this.mesh.add(this.visualRoot);

        // Animation state
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.currentState = 'idle'; // 'idle', 'walk', 'light_punch', 'heavy_punch', 'dodge', 'block', 'hit', 'ko'

        this.currentMode = 'rational'; // 'rational' vs 'tyler'

        // Combat stats per mode
        this.stats = {
            rational: { speed: 4.5, maxHealth: 100, maxStamina: 100, attackPower: 14, animSpeed: 1.0 },
            tyler: { speed: 6.2, maxHealth: 130, maxStamina: 140, attackPower: 26, animSpeed: 1.25 }
        };

        this.health = 100;
        this.stamina = 100;
        this.isBlocking = false;
        this.isDodging = false;
        this.dodgeTimer = 0;
        this.dodgeDir = new THREE.Vector3();
        this.isDead = false;

        // Fallback capsule until model loads
        this.fallback = this.assetLoader.createCapsuleFallback(0x2a75d3, 1.8, 'Player');
        this.visualRoot.add(this.fallback);

        // Rim light (Cool cyan backlight for crisp silhouette readability)
        this.rimLight = new THREE.PointLight(0x00d4ff, 3.2, 5.5);
        this.rimLight.position.set(0, 1.8, 0.6);
        this.mesh.add(this.rimLight);

        // Load full-body animated model
        this.loadModel();
    }

    async loadModel() {
        try {
            const data = await this.assetLoader.loadAnimatedModel('/models/fighter.glb', 1.8);
            this.modelSetup = data;
            this.model = data.model;
            this.mixer = data.mixer;
            this.actions = data.actions;

            // Apply starting theme
            this.assetLoader.applyTheme(this.model, this.currentMode);

            // Setup finished event listener for non-looping actions
            this.mixer.addEventListener('finished', (e) => {
                if (this.isDead) return;
                // Return to idle or walk after action finishes
                if (['light_punch', 'heavy_punch', 'dodge', 'hit', 'heavy_hit'].includes(this.currentState)) {
                    this.isDodging = false;
                    this.playAction('idle', 0.15);
                }
            });

            // Replace fallback capsule
            while (this.visualRoot.children.length > 0) {
                this.visualRoot.remove(this.visualRoot.children[0]);
            }
            this.visualRoot.add(data.wrapper);

            // Start with idle animation
            this.playAction('idle', 0.1);
        } catch (err) {
            console.warn('[Player] Error loading animated model, retaining capsule fallback:', err);
        }
    }

    playAction(name, crossFadeDuration = 0.18, timeScale = null) {
        if (!this.actions || !this.actions[name]) return;
        if (this.currentState === 'ko') return; // Cannot override knockout

        const nextAction = this.actions[name];
        if (this.currentAction === nextAction && nextAction.isRunning()) return;

        const effectiveScale = timeScale !== null 
            ? timeScale 
            : this.stats[this.currentMode].animSpeed;

        nextAction.reset();
        nextAction.setEffectiveTimeScale(effectiveScale);
        nextAction.setEffectiveWeight(1.0);

        if (this.currentAction && this.currentAction !== nextAction) {
            this.currentAction.crossFadeTo(nextAction, crossFadeDuration, true);
        }
        nextAction.play();

        this.currentAction = nextAction;
        this.currentState = name;
    }

    switchMode(targetMode = null) {
        if (this.isDead) return;

        const nextMode = targetMode || (this.currentMode === 'rational' ? 'tyler' : 'rational');
        if (nextMode === this.currentMode) return;

        this.currentMode = nextMode;

        // Apply visual theme to character model
        if (this.model) {
            this.assetLoader.applyTheme(this.model, this.currentMode);
        }

        // Adjust rim light color to match persona
        if (this.rimLight) {
            this.rimLight.color.setHex(this.currentMode === 'rational' ? 0x00d4ff : 0xff1744);
        }

        // Trigger visible screen transition (flash + glitch burst)
        if (this.game.effects) {
            this.game.effects.glitchBurst(0.45);
        }

        // Flash HUD transition
        if (this.game.ui) {
            this.game.ui.updatePersonality(this.currentMode);
        }

        // Audio sting
        if (this.game.audio) {
            this.game.audio.playTylerGlitch();
        }
    }

    update(dt) {
        // Step animation mixer
        if (this.mixer) {
            this.mixer.update(dt);
        }

        if (this.isDead) return;

        this.handleInput(dt);
        this.updateStats(dt);
    }

    handleInput(dt) {
        const input = this.game.input;
        if (!input) return;

        // Manual Alter Ego toggle with Tab
        if (input.isJustPressed('Tab')) {
            this.switchMode();
        }

        // Guard / Block (Hold L)
        const wantsBlock = input.isPressed('l') || input.isPressed('L');
        if (wantsBlock && !this.isDodging && this.currentState !== 'light_punch' && this.currentState !== 'heavy_punch') {
            this.isBlocking = true;
            this.playAction('block', 0.12);
            return;
        } else if (this.isBlocking && !wantsBlock) {
            this.isBlocking = false;
            this.playAction('idle', 0.15);
        }

        // Dodge / Roll (Space)
        if (input.isJustPressed(' ') && !this.isDodging && this.stamina >= 20) {
            this.startDodge();
            return;
        }

        // Attacks (J = Light, K = Heavy)
        if (!this.isDodging && !this.isBlocking) {
            if (input.isJustPressed('j') || input.isJustPressed('J')) {
                this.performAttack('light');
                return;
            }
            if (input.isJustPressed('k') || input.isJustPressed('K')) {
                this.performAttack('heavy');
                return;
            }
        }

        // Dodge translation physics
        if (this.isDodging) {
            this.dodgeTimer -= dt;
            const dodgeSpeed = this.stats[this.currentMode].speed * 2.0;
            this.mesh.position.addScaledVector(this.dodgeDir, dodgeSpeed * dt);
            this.clampInsideRing();
            if (this.dodgeTimer <= 0) {
                this.isDodging = false;
            }
            return;
        }

        // Locomotion if not attacking or blocking
        if (!['light_punch', 'heavy_punch', 'hit', 'heavy_hit'].includes(this.currentState)) {
            this.handleMovement(dt);
        }
    }

    startDodge() {
        this.isDodging = true;
        this.dodgeTimer = 0.45;
        this.stamina = Math.max(0, this.stamina - 20);
        this.playAction('dodge', 0.08, 1.2);

        // Determine dodge direction
        const input = this.game.input.keys;
        const moveDir = new THREE.Vector3();
        if (input['w'] || input['W']) moveDir.z -= 1;
        if (input['s'] || input['S']) moveDir.z += 1;
        if (input['a'] || input['A']) moveDir.x -= 1;
        if (input['d'] || input['D']) moveDir.x += 1;

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            this.dodgeDir.copy(moveDir);
            this.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
        } else {
            // Dodge backward if no directional keys pressed
            this.mesh.getWorldDirection(this.dodgeDir);
            this.dodgeDir.negate();
        }

        if (this.game.audio) this.game.audio.playWhoosh();
    }

    handleMovement(dt) {
        const input = this.game.input.keys;
        const moveDir = new THREE.Vector3();
        if (input['w'] || input['W']) moveDir.z -= 1;
        if (input['s'] || input['S']) moveDir.z += 1;
        if (input['a'] || input['A']) moveDir.x -= 1;
        if (input['d'] || input['D']) moveDir.x += 1;

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            const speed = this.stats[this.currentMode].speed;
            this.mesh.position.addScaledVector(moveDir, speed * dt);
            this.clampInsideRing();

            // Smooth rotation towards movement direction
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            let diff = targetRotation - this.mesh.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.mesh.rotation.y += diff * 12 * dt;

            this.playAction(this.currentMode === 'tyler' ? 'run' : 'walk', 0.15);
        } else {
            this.playAction('idle', 0.15);
            // Smoothly face opponent in fighting stance
            this.faceOpponent(dt);
        }
    }

    faceOpponent(dt, speed = 10) {
        const enemy = this.game.enemies && this.game.enemies.find(e => !e.isDead);
        if (enemy) {
            const dx = enemy.mesh.position.x - this.mesh.position.x;
            const dz = enemy.mesh.position.z - this.mesh.position.z;
            if (Math.hypot(dx, dz) > 0.05) {
                const targetRotation = Math.atan2(dx, dz);
                let diff = targetRotation - this.mesh.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.mesh.rotation.y += diff * speed * dt;
            }
        }
    }

    clampInsideRing() {
        // Enforce boundary inside the 14x14 fighting ring (safety margin ±6.2)
        const limit = 6.2;
        this.mesh.position.x = Math.max(-limit, Math.min(limit, this.mesh.position.x));
        this.mesh.position.z = Math.max(-limit, Math.min(limit, this.mesh.position.z));
    }

    performAttack(type) {
        const isHeavy = type === 'heavy';
        const staminaCost = isHeavy ? 24 : 12;
        if (this.stamina < staminaCost) return;

        this.stamina -= staminaCost;
        // Turn squarely toward opponent before delivering strike
        this.faceOpponent(1.0, 25);

        const actionName = isHeavy ? 'heavy_punch' : 'light_punch';
        this.playAction(actionName, 0.08);

        if (this.game.audio) this.game.audio.playWhoosh();

        // Trigger combat hitcheck at apex of punch
        setTimeout(() => {
            if (this.isDead) return;
            if (this.game.combat) {
                this.game.combat.processAttack(this, type);
            }
        }, isHeavy ? 180 : 120);
    }

    takeDamage(rawDamage, attacker = null) {
        if (this.isDead) return;

        // Invulnerability during dodge roll
        if (this.isDodging) {
            if (this.game.sanity) this.game.sanity.gainSanity(8);
            if (this.game.ui) this.game.ui.showDamageText(this.mesh.position, 'EVADED!', '#00d4ff');
            return;
        }

        // Trigger red vignette pulse on damage
        if (this.game.ui && this.game.ui.pulseDamageVignette) {
            this.game.ui.pulseDamageVignette();
        }

        let damage = rawDamage;
        if (this.isBlocking) {
            damage *= 0.25; // 75% reduction
            this.stamina = Math.max(0, this.stamina - rawDamage * 0.5);
            if (this.game.sanity) this.game.sanity.gainSanity(5);
            if (this.game.audio) this.game.audio.playBlock();
            if (this.game.cameraShake) this.game.cameraShake(0.15);
            if (this.game.ui) this.game.ui.showDamageText(this.mesh.position, `BLOCKED -${Math.round(damage)}`, '#00d4ff');
            this.flashDamage(0x4488ff);
        } else {
            this.health = Math.max(0, this.health - damage);
            const isHeavyHit = damage >= 20;
            this.playAction(isHeavyHit ? 'heavy_hit' : 'hit', 0.06);
            if (this.game.audio) this.game.audio.playHit(isHeavyHit ? 1.4 : 1.0);
            if (this.game.cameraShake) this.game.cameraShake(isHeavyHit ? 0.6 : 0.3);
            if (this.game.effects) this.game.effects.glitchBurst(0.25);
            if (this.game.ui) this.game.ui.showDamageText(this.mesh.position, `-${Math.round(damage)}`, '#ff1744');
            this.flashDamage(0xffffff);

            // Knockback
            if (attacker) {
                const kb = new THREE.Vector3().subVectors(this.mesh.position, attacker.mesh.position).normalize();
                kb.y = 0;
                this.mesh.position.addScaledVector(kb, isHeavyHit ? 0.65 : 0.35);
                this.clampInsideRing();
            }

            // Sanity drain
            if (this.game.sanity) {
                this.game.sanity.loseSanity(damage * 0.8);
            }
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
        if (this.game.onGameOver) {
            this.game.onGameOver(false);
        }
    }

    updateStats(dt) {
        const maxStamina = this.stats[this.currentMode].maxStamina;
        const regenRate = this.isBlocking ? 6 : 22;
        if (this.stamina < maxStamina && !this.isDodging) {
            this.stamina = Math.min(maxStamina, this.stamina + regenRate * dt);
        }
    }
}
