import * as THREE from 'three';

/**
 * Player Entity: Full-body animated humanoid with AnimationMixer,
 * combat cross-fading (idle, walk, punches, dodge, block, hit, KO),
 * dynamic bruise/blood buildup, dual-personality switching (Narrator vs Tyler),
 * and autonomous input locking during Tyler takeover.
 */
export class Player {
    constructor(game) {
        this.game = game;
        this.assetLoader = game.assetLoader;

        // Root container for world transform
        this.mesh = new THREE.Group();
        this.mesh.name = 'PlayerRoot';
        this.mesh.position.set(0, 0, 1.5);
        this.mesh.rotation.y = Math.PI; // Face north across ring

        // Visual root holding the active model
        this.visualRoot = new THREE.Group();
        this.visualRoot.name = 'PlayerVisualRoot';
        this.mesh.add(this.visualRoot);

        // Animation state
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.currentState = 'idle';

        this.currentMode = 'rational'; // 'rational' (Narrator) vs 'tyler'

        // Combat stats per persona:
        // - Narrator: careful, tactical, easily hurt (takes +25% damage), regains stamina by blocking
        // - Tyler: reckless, hits harder (+85% power), ignores pain (50% reduction), drains sanity
        this.stats = {
            rational: { 
                speed: 4.5, 
                maxHealth: 100, 
                maxStamina: 100, 
                attackPower: 14, 
                damageTakenMultiplier: 1.25, 
                animSpeed: 1.0 
            },
            tyler: { 
                speed: 6.2, 
                maxHealth: 130, 
                maxStamina: 140, 
                attackPower: 26, 
                damageTakenMultiplier: 0.50, 
                animSpeed: 1.25 
            }
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

    async loadModel(mode = this.currentMode) {
        try {
            const data = await this.assetLoader.loadAnimatedModel('/models/fighter.glb', 1.8, mode);
            this.modelSetup = data;
            this.model = data.model;
            this.mixer = data.mixer;
            this.actions = data.actions;
            this.accessoryData = data.accessoryData;

            // Setup finished event listener for combat actions
            this.mixer.addEventListener('finished', (e) => {
                if (this.isDead) return;
                // Return to boxing stance after attack or reaction completes
                if (['light_punch', 'heavy_punch', 'jab', 'cross', 'hook', 'dodge', 'hit', 'heavy_hit', 'hit_light', 'hit_heavy', 'stagger', 'taunt', 'pained_laugh'].includes(this.currentState)) {
                    this.isDodging = false;
                    this.playAction('boxing_idle', 0.15);
                }
            });

            // Replace visual model
            while (this.visualRoot.children.length > 0) {
                this.visualRoot.remove(this.visualRoot.children[0]);
            }
            this.visualRoot.add(data.wrapper);

            // Start in alert boxing stance
            this.playAction('boxing_idle', 0.1);
            this.updateInjuries();
        } catch (err) {
            console.warn('[Player] Error loading animated model, retaining capsule fallback:', err);
        }
    }

    /**
     * Updates visible blood and bruise buildup on the Narrator based on remaining health.
     */
    updateInjuries() {
        if (this.accessoryData && this.accessoryData.bloodDecal && this.accessoryData.bloodDecal.material) {
            const maxHp = this.stats[this.currentMode].maxHealth;
            const healthRatio = Math.max(0, Math.min(1, this.health / maxHp));
            // Decal opacity smoothly rises as health drops below 85%
            const injuryOpacity = Math.max(0, Math.min(0.85, (1.0 - healthRatio) * 1.15));
            this.accessoryData.bloodDecal.material.opacity = injuryOpacity;
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

        // Re-load model accessories and theme for active persona
        this.loadModel(this.currentMode);

        // Adjust rim light color to match persona
        if (this.rimLight) {
            this.rimLight.color.setHex(this.currentMode === 'rational' ? 0x00d4ff : 0xff1744);
        }

        // Trigger visible screen transition (glitch burst)
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

        // 1. Autonomous Tyler Takeover: Player has LOST conscious control of the body!
        if (this.game.personality && this.game.personality.isTylerAutonomous) {
            // Mashing TAB pumps struggle meter to break Tyler's grip
            if (input.isJustPressed('Tab')) {
                this.game.personality.pumpControl(12);
            }
            // Holding L guard also struggles for conscious control
            if (input.isPressed('l') || input.isPressed('L')) {
                this.game.personality.pumpControl(18 * dt);
            }
            // Standard inputs are LOCKED. TylerAI drives movement and attacks!
            return;
        }

        // 2. Normal conscious control (Narrator / Voluntary Tyler)
        if (input.isJustPressed('Tab')) {
            if (this.game.personality) {
                this.game.personality.tryVoluntaryShift();
            } else {
                this.switchMode();
            }
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
        if (!['light_punch', 'heavy_punch', 'hit', 'heavy_hit', 'jab', 'cross', 'hook'].includes(this.currentState)) {
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

            // Foot-sliding prevention: match stride timescale directly to movement speed
            const isTyler = this.currentMode === 'tyler';
            const baseStride = isTyler ? 4.8 : 3.0;
            const footSyncScale = speed / baseStride;
            this.playAction(isTyler ? 'run' : 'walk', 0.12, footSyncScale);
        } else {
            this.playAction('boxing_idle', 0.15);
            // Smoothly face opponent in boxing ready stance
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

        if (!this.comboCounter) this.comboCounter = 0;
        this.comboCounter++;

        let actionName = 'jab';
        if (isHeavy) {
            actionName = 'hook';
        } else {
            actionName = (this.comboCounter % 2 === 1) ? 'jab' : 'cross';
        }

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

        // Damage calculation modified by personality:
        // Narrator: takes 1.25x damage (easily hurt)
        // Tyler: takes 0.50x damage (ignores pain)
        const damageMultiplier = this.stats[this.currentMode].damageTakenMultiplier;
        let damage = rawDamage * damageMultiplier;

        if (this.isBlocking) {
            damage *= 0.25; // 75% guard reduction
            // Narrator: regains stamina by blocking cleanly!
            if (this.currentMode === 'rational') {
                this.stamina = Math.min(this.stats[this.currentMode].maxStamina, this.stamina + 25);
            } else {
                this.stamina = Math.max(0, this.stamina - rawDamage * 0.4);
            }

            if (this.game.sanity) this.game.sanity.gainSanity(6);
            if (this.game.audio) this.game.audio.playBlock();
            if (this.game.cameraDirector) this.game.cameraDirector.shake(0.15);
            if (this.game.ui) this.game.ui.showDamageText(this.mesh.position, `BLOCKED -${Math.round(damage)}`, '#00d4ff');
            this.flashDamage(0x4488ff);
        } else {
            this.health = Math.max(0, this.health - damage);
            const isHeavyHit = damage >= 20;

            // Tyler ignores stagger completely! Narrator plays flinch/stagger reaction
            if (this.currentMode === 'tyler') {
                // Flash white, don't interrupt attacks, laugh off the hit
                this.flashDamage(0xff3344);
                if (Math.random() < 0.3) {
                    if (this.game.audio) this.game.audio.playTylerGlitch();
                }
            } else {
                // Narrator staggers under heavy impact
                this.playAction(isHeavyHit ? 'hit_heavy' : 'hit_light', 0.06);
                this.flashDamage(0xffffff);
            }

            if (this.game.audio) this.game.audio.playHit(isHeavyHit ? 1.4 : 1.0);
            if (this.game.cameraDirector) this.game.cameraDirector.shake(isHeavyHit ? 0.6 : 0.3);
            if (this.game.effects) this.game.effects.glitchBurst(0.25);
            if (this.game.ui) this.game.ui.showDamageText(this.mesh.position, `-${Math.round(damage)}`, '#ff1744');

            // Update dynamic bruise & blood buildup on face & shirt
            this.updateInjuries();

            // Knockback
            if (attacker) {
                const kb = new THREE.Vector3().subVectors(this.mesh.position, attacker.mesh.position).normalize();
                kb.y = 0;
                // Tyler has increased knockback resistance
                const kbScale = this.currentMode === 'tyler' ? 0.35 : 1.0;
                this.mesh.position.addScaledVector(kb, (isHeavyHit ? 0.65 : 0.35) * kbScale);
                this.clampInsideRing();
            }

            // Sanity drain
            if (this.game.sanity) {
                this.game.sanity.loseSanity(damage * 0.85);
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
        const isTakeoverLoss = this.game.personality && this.game.personality.isTylerAutonomous;
        if (this.game.onGameOver) {
            this.game.onGameOver(false, isTakeoverLoss);
        }
    }

    updateStats(dt) {
        const maxStamina = this.stats[this.currentMode].maxStamina;
        // Narrator: regains stamina quickly when blocking
        let regenRate = 22;
        if (this.currentMode === 'rational' && this.isBlocking) {
            regenRate = 42;
        } else if (this.isBlocking) {
            regenRate = 8;
        }

        if (this.stamina < maxStamina && !this.isDodging) {
            this.stamina = Math.min(maxStamina, this.stamina + regenRate * dt);
        }
    }
}
