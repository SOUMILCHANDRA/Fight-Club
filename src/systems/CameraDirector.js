import * as THREE from 'three';

/**
 * CameraDirector: Coordinates cinematic camera choreography and out-of-body
 * psychological perspectives.
 * 
 * - 'fight' mode: High-readability 3/4 raised perspective framing both combatants
 *   with dynamic zoom and punch shake.
 * - 'sideline' mode: Out-of-body experience during autonomous Tyler takeover.
 *   Camera cuts ringside outside the ropes with gritty handheld noise drift,
 *   while the desaturated semi-transparent "Narrator Ghost" stands watching his own body fight.
 */
export class CameraDirector {
    constructor(game) {
        this.game = game;
        this.camera = game.camera;

        this.mode = 'fight'; // 'fight' | 'sideline'
        this.shakeIntensity = 0;
        this.time = 0;

        // Camera smoothing vectors
        this.currentCamPos = new THREE.Vector3(3.2, 2.2, 3.8);
        this.lookTarget = new THREE.Vector3(0, 1.25, 0);

        // Ghost spectator entity
        this.ghostGroup = new THREE.Group();
        this.ghostGroup.name = 'NarratorGhost';
        this.ghostGroup.visible = false;
        this.game.scene.add(this.ghostGroup);

        this.ghostMixer = null;
        this.ghostLoaded = false;
        this.initNarratorGhost();
    }

    async initNarratorGhost() {
        try {
            const data = await this.game.assetLoader.loadAnimatedModel('/models/fighter.glb', 1.8, 'narrator');
            this.ghostMixer = data.mixer;
            const ghostWrapper = data.wrapper;

            // Apply ghostly desaturated semi-transparent materials
            ghostWrapper.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x88bbdd,
                        roughness: 0.9,
                        metalness: 0.1,
                        transparent: true,
                        opacity: 0.52,
                        depthWrite: false,
                        wireframe: false
                    });
                }
            });

            // Start ghost in passive watching idle
            if (data.actions && data.actions.idle) {
                data.actions.idle.play();
            }

            this.ghostGroup.add(ghostWrapper);

            // Stand outside ring ropes at ringside apron facing into center
            this.ghostGroup.position.set(-4.2, 0, 1.8);
            this.ghostGroup.lookAt(0, 0.9, 0);
            this.ghostLoaded = true;
        } catch (err) {
            console.warn('[CameraDirector] Error loading Narrator Ghost model:', err);
        }
    }

    setMode(mode) {
        if (this.mode === mode) return;
        this.mode = mode;

        if (mode === 'sideline') {
            // Cut immediately to ringside crowd view
            this.ghostGroup.visible = true;
            this.currentCamPos.set(-5.6, 1.28, 3.2);
            if (this.game.effects) {
                this.game.effects.glitchBurst(0.65);
            }
        } else {
            // Return to fight camera
            this.ghostGroup.visible = false;
            if (this.game.effects) {
                this.game.effects.glitchBurst(0.3);
            }
        }
    }

    shake(intensity = 0.35) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    update(dt) {
        this.time += dt;

        // Step ghost animation mixer
        if (this.ghostMixer && this.ghostGroup.visible) {
            this.ghostMixer.update(dt);
        }

        if (this.mode === 'sideline') {
            this.updateSidelineCamera(dt);
        } else {
            this.updateFightCamera(dt);
        }
    }

    updateFightCamera(dt) {
        const player = this.game.player;
        if (!player || !player.mesh) return;

        const playerPos = player.mesh.position;
        const enemy = this.game.enemies.find(e => !e.isDead);

        let targetCamPos;
        let targetLook;

        if (enemy && enemy.mesh) {
            // Raised 3/4 angle fight camera: frames both fighters without either blocking the other
            const toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, playerPos);
            toEnemy.y = 0;
            const dist = toEnemy.length();
            toEnemy.normalize();

            // Perpendicular lateral vector side (right of engagement line)
            const side = new THREE.Vector3(-toEnemy.z, 0, toEnemy.x).normalize();

            // Midpoint between combatants
            const midPoint = new THREE.Vector3().addVectors(playerPos, enemy.mesh.position).multiplyScalar(0.5);

            // Dynamic zoom framing both fighters side-by-side
            const zoomDist = Math.max(3.2, Math.min(5.6, 2.6 + dist * 0.42));
            const camHeight = 2.15 + dist * 0.08;

            targetCamPos = midPoint.clone()
                .addScaledVector(side, zoomDist * 0.82)
                .addScaledVector(toEnemy, -0.25)
                .add(new THREE.Vector3(0, camHeight, zoomDist * 0.48));

            // Focus at chest level of midpoint
            targetLook = midPoint.clone().add(new THREE.Vector3(0, 1.25, 0));
        } else {
            // Default cinematic follow
            const playerRotY = player.mesh.rotation.y;
            const camOffset = new THREE.Vector3(1.8, 2.1, 3.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY);
            targetCamPos = playerPos.clone().add(camOffset);
            targetLook = playerPos.clone().add(new THREE.Vector3(0, 1.25, 0));
        }

        // Apply punch shake
        if (this.shakeIntensity > 0) {
            targetCamPos.x += (Math.random() - 0.5) * this.shakeIntensity;
            targetCamPos.y += (Math.random() - 0.5) * this.shakeIntensity;
            targetCamPos.z += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity = Math.max(0, this.shakeIntensity - 3.4 * dt);
        }

        // Smooth camera damping
        this.currentCamPos.lerp(targetCamPos, 7.5 * dt);
        this.lookTarget.lerp(targetLook, 9.0 * dt);

        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.lookTarget);
    }

    updateSidelineCamera(dt) {
        const player = this.game.player;
        const enemy = this.game.enemies.find(e => !e.isDead);

        // Center of combat action
        const actionCenter = player && enemy 
            ? new THREE.Vector3().addVectors(player.mesh.position, enemy.mesh.position).multiplyScalar(0.5)
            : (player ? player.mesh.position : new THREE.Vector3(0, 0, 0));

        // Base ringside position outside the ropes
        const baseCamPos = new THREE.Vector3(-5.4, 1.25, 3.0);

        // Handheld camera noise drift (subtle floating sway)
        const driftX = Math.sin(this.time * 1.7) * 0.08 + Math.cos(this.time * 3.1) * 0.04;
        const driftY = Math.cos(this.time * 2.3) * 0.06 + Math.sin(this.time * 4.2) * 0.03;
        const driftZ = Math.sin(this.time * 1.2) * 0.07;

        const targetCamPos = baseCamPos.clone().add(new THREE.Vector3(driftX, driftY, driftZ));
        const targetLook = actionCenter.clone().add(new THREE.Vector3(0, 1.15, 0));

        // Quick handheld tracking
        this.currentCamPos.lerp(targetCamPos, 8.0 * dt);
        this.lookTarget.lerp(targetLook, 10.0 * dt);

        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.lookTarget);
    }
}
