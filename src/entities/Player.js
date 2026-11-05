import * as THREE from 'three';

/**
 * Player Entity: handles character models (Narrator & Tyler), capsule fallback,
 * procedural animation synthesis (idle/walk/attack/dodge/block/hit/KO),
 * stats, and state management.
 */
export class Player {
    constructor(game) {
        this.game = game;
        this.assetLoader = game.assetLoader;
        
        // Root container for world transform
        this.mesh = new THREE.Group();
        this.mesh.name = 'PlayerRoot';
        this.mesh.position.set(0, 0, 2);

        // Visual root that receives procedural animation offsets/rotations
        this.visualRoot = new THREE.Group();
        this.visualRoot.name = 'PlayerVisualRoot';
        this.mesh.add(this.visualRoot);

        // Models repository
        this.models = {
            narrator: { scene: null },
            tyler: { scene: null }
        };

        this.currentMode = 'rational'; // 'rational' (narrator) vs 'tyler'
        
        // Combat stats per mode
        this.stats = {
            rational: { speed: 4.8, maxHealth: 100, maxStamina: 100, attackPower: 12, defense: 0.8 },
            tyler: { speed: 6.8, maxHealth: 140, maxStamina: 150, attackPower: 24, defense: 0.5 }
        };

        this.health = 100;
        this.stamina = 100;
        this.isBlocking = false;
        this.isDodging = false;
        this.dodgeTimer = 0;
        this.dodgeDir = new THREE.Vector3();
        this.isDead = false;

        // Procedural Animation State
        this.animState = 'idle'; // 'idle', 'walk', 'light_attack', 'heavy_attack', 'dodge', 'block', 'hit', 'ko'
        this.animTime = 0;
        this.animDuration = 0;
        this.walkCycle = 0;
        this.idleCycle = 0;

        // Immediately add fallback capsule mesh so player is never invisible
        this.fallback = this.assetLoader.createCapsuleFallback(0x2a75d3, 1.85, 'Player');
        this.visualRoot.add(this.fallback);

        // Add character local rim light for high-contrast noir lighting
        this.rimLight = new THREE.PointLight(0x70a5ff, 1.5, 4);
        this.rimLight.position.set(0, 1.7, 0.5);
        this.mesh.add(this.rimLight);

        // Start loading real models
        this.loadModels();
    }

    async loadModels() {
        // Load Narrator
        try {
            const narratorModel = await this.assetLoader.loadModel('/models/narrator.glb', 1.85);
            this.models.narrator.scene = narratorModel;
            if (this.currentMode === 'rational') {
                this.setActiveVisual(narratorModel);
            }
        } catch (err) {
            console.warn('[Player] Narrator model failed to load, retaining capsule fallback:', err);
        }

        // Load Tyler
        try {
            const tylerModel = await this.assetLoader.loadModel('/models/tyler.glb', 1.9);
            this.models.tyler.scene = tylerModel;
            if (this.currentMode === 'tyler') {
                this.setActiveVisual(tylerModel);
            }
        } catch (err) {
            console.warn('[Player] Tyler model failed to load:', err);
        }
    }

    setActiveVisual(modelOrGroup) {
        // Remove existing visual children without touching rimLight or root transforms
        while (this.visualRoot.children.length > 0) {
            this.visualRoot.remove(this.visualRoot.children[0]);
        }
        this.visualRoot.add(modelOrGroup);
    }

    switchMode(targetMode = null) {
        if (this.isDead) return;
        
        const nextMode = targetMode || (this.currentMode === 'rational' ? 'tyler' : 'rational');
        if (nextMode === this.currentMode) return;

        this.currentMode = nextMode;
        
        // Swap model
        const modelKey = this.currentMode === 'rational' ? 'narrator' : 'tyler';
        const model = this.models[modelKey]?.scene;
        if (model) {
            this.setActiveVisual(model);
        } else {
            // Keep or recreate colored capsule fallback
            const color = this.currentMode === 'rational' ? 0x2a75d3 : 0xff1744;
            this.fallback = this.assetLoader.createCapsuleFallback(color, 1.85, 'Player');
            this.setActiveVisual(this.fallback);
        }

        // Adjust rim light color to match persona
        if (this.rimLight) {
            this.rimLight.color.setHex(this.currentMode === 'rational' ? 0x70a5ff : 0xff2244);
        }

        // Update UI
        if (this.game.ui) {
            this.game.ui.updatePersonality(this.currentMode);
        }

        // Visual distortion burst
        if (this.game.effects) {
            this.game.effects.glitchBurst(0.4);
        }
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

        this.handleInput(dt);
        this.updateStats(dt);
        this.updateProceduralAnimation(dt);
    }

    handleInput(dt) {
        const input = this.game.input;
        if (!input) return;

        // Mode switch toggle with Tab key (for manual testing)
        if (input.isJustPressed('Tab')) {
            this.switchMode();
        }

        // Blocking (Hold L)
        this.isBlocking = input.isPressed('l') || input.isPressed('L');

        // Dodge (Space)
        if (input.isJustPressed(' ') && !this.isDodging && this.stamina >= 20) {
            this.startDodge();
            return;
        }

        // Attacks
        if (!this.isDodging && !this.isBlocking && (this.animState === 'idle' || this.animState === 'walk')) {
            if (input.isJustPressed('j') || input.isJustPressed('J')) {
                this.performAttack('light');
                return;
            }
            if (input.isJustPressed('k') || input.isJustPressed('K')) {
                this.performAttack('heavy');
                return;
            }
        }

        // Dodge physics update
        if (this.isDodging) {
            this.dodgeTimer -= dt;
            const dodgeSpeed = this.stats[this.currentMode].speed * 1.8;
            this.mesh.position.addScaledVector(this.dodgeDir, dodgeSpeed * dt);
            if (this.dodgeTimer <= 0) {
                this.isDodging = false;
                this.animState = 'idle';
            }
            return;
        }

        // Regular movement if not attacking or blocking
        if (this.animState === 'idle' || this.animState === 'walk') {
            this.handleMovement(dt);
        }
    }

    startDodge() {
        this.isDodging = true;
        this.dodgeTimer = 0.28;
        this.stamina = Math.max(0, this.stamina - 20);
        this.triggerAnimation('dodge', 0.28);

        // Determine dodge direction based on input or facing direction
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
            // Dodge backward if no keys pressed
            this.mesh.getWorldDirection(this.dodgeDir);
            this.dodgeDir.negate();
        }

        if (this.game.audio) this.game.audio.playWhoosh();
    }

    handleMovement(dt) {
        if (this.isBlocking) {
            this.animState = 'block';
            return;
        }

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

            // Arena boundary clamping (-18 to +18)
            this.mesh.position.x = Math.max(-18, Math.min(18, this.mesh.position.x));
            this.mesh.position.z = Math.max(-18, Math.min(18, this.mesh.position.z));

            // Smoothly rotate to face direction
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            let diff = targetRotation - this.mesh.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.mesh.rotation.y += diff * 12 * dt;

            this.animState = 'walk';
            this.walkCycle += dt * speed;
        } else {
            this.animState = 'idle';
        }
    }

    performAttack(type) {
        const isHeavy = type === 'heavy';
        const staminaCost = isHeavy ? 25 : 12;
        if (this.stamina < staminaCost) return;

        this.stamina -= staminaCost;
        const duration = isHeavy ? 0.42 : 0.25;
        this.triggerAnimation(isHeavy ? 'heavy_attack' : 'light_attack', duration);

        if (this.game.audio) this.game.audio.playWhoosh();
        if (this.game.combat) {
            this.game.combat.processAttack(this, type);
        }
    }

    takeDamage(rawDamage, attacker = null) {
        if (this.isDead) return;

        // Dodge invulnerability
        if (this.isDodging) {
            // Clean dodge rewards sanity
            if (this.game.sanity) this.game.sanity.gainSanity(8);
            return;
        }

        let damage = rawDamage;
        if (this.isBlocking) {
            damage *= 0.25; // 75% damage reduction
            this.stamina = Math.max(0, this.stamina - rawDamage * 0.5);
            // Clean block rewards sanity
            if (this.game.sanity) this.game.sanity.gainSanity(5);
            this.triggerAnimation('block', 0.2);
            if (this.game.audio) this.game.audio.playHit(0.5);
            if (this.game.cameraShake) this.game.cameraShake(0.15);
        } else {
            // Full hit
            this.health = Math.max(0, this.health - damage);
            this.triggerAnimation('hit', 0.3);
            if (this.game.audio) this.game.audio.playHit(1.0);
            if (this.game.cameraShake) this.game.cameraShake(0.4);
            if (this.game.effects) this.game.effects.glitchBurst(0.3);

            // Knockback
            if (attacker) {
                const kb = new THREE.Vector3().subVectors(this.mesh.position, attacker.mesh.position).normalize();
                this.mesh.position.addScaledVector(kb, 0.4);
            }

            // Sanity drain on taking direct damage
            if (this.game.sanity) {
                this.game.sanity.loseSanity(damage * 0.8);
            }
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
        if (this.game.onGameOver) {
            this.game.onGameOver(false);
        }
    }

    updateStats(dt) {
        const maxStamina = this.stats[this.currentMode].maxStamina;
        const regenRate = this.isBlocking ? 5 : 20;
        if (this.stamina < maxStamina && !this.isDodging) {
            this.stamina = Math.min(maxStamina, this.stamina + regenRate * dt);
        }
    }

    updateProceduralAnimation(dt) {
        this.animTime += dt;
        this.idleCycle += dt;

        // Reset visual base offsets
        this.visualRoot.position.set(0, 0, 0);
        this.visualRoot.rotation.set(0, 0, 0);

        const progress = Math.min(1, this.animTime / (this.animDuration || 1));

        switch (this.animState) {
            case 'idle':
                // Breathing bob
                this.visualRoot.position.y = Math.sin(this.idleCycle * 2.8) * 0.02;
                this.visualRoot.rotation.z = Math.sin(this.idleCycle * 1.4) * 0.01;
                break;

            case 'walk':
                // Striding bounce & side sway
                this.visualRoot.position.y = Math.abs(Math.sin(this.walkCycle * 7)) * 0.06;
                this.visualRoot.rotation.z = Math.sin(this.walkCycle * 3.5) * 0.04;
                this.visualRoot.rotation.x = 0.06; // slight forward lean
                break;

            case 'light_attack': {
                // Quick forward thrust and snap
                const strike = Math.sin(progress * Math.PI);
                this.visualRoot.position.z = -strike * 0.35;
                this.visualRoot.rotation.y = strike * 0.25;
                if (progress >= 1) this.animState = 'idle';
                break;
            }

            case 'heavy_attack': {
                // Heavy windup, forward smash, and recovery
                const smash = Math.sin(progress * Math.PI);
                this.visualRoot.position.z = -smash * 0.6;
                this.visualRoot.position.y = -smash * 0.08;
                this.visualRoot.rotation.y = -smash * 0.45;
                if (progress >= 1) this.animState = 'idle';
                break;
            }

            case 'dodge': {
                // Low dash/roll dip
                const dip = Math.sin(progress * Math.PI);
                this.visualRoot.position.y = -dip * 0.25;
                this.visualRoot.rotation.x = dip * 0.3;
                break;
            }

            case 'block':
                // Guard stance: lowered posture, rear back
                this.visualRoot.position.y = -0.06;
                this.visualRoot.position.z = 0.08;
                this.visualRoot.rotation.x = -0.08;
                break;

            case 'hit': {
                // Recoil back and flinch
                const recoil = Math.sin(progress * Math.PI);
                this.visualRoot.position.z = recoil * 0.3;
                this.visualRoot.rotation.x = -recoil * 0.2;
                if (progress >= 1) this.animState = 'idle';
                break;
            }

            case 'ko': {
                // Fall onto floor
                const fall = Math.min(1, this.animTime * 2);
                this.visualRoot.position.y = (1 - fall) * 0.9 + 0.15;
                this.visualRoot.rotation.x = -fall * (Math.PI / 2);
                break;
            }
        }
    }
}
