/**
 * @file E:\Fight Club\src\entities\Player.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\entities\Player.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\entities\Player.js
 * @description Senior implementation for Project Mayhem.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.loader = new GLTFLoader();
        
        this.mesh = new THREE.Group();
        this.models = {
            narrator: { scene: null, mixer: null, actions: {} },
            tyler: { scene: null, mixer: null, actions: {} }
        };
        
        this.currentMode = 'narrator'; 
        this.stats = {
            narrator: { speed: 5, stamina: 100, strength: 10 },
            tyler: { speed: 8, stamina: 150, strength: 25 }
        };

        this.stamina = 100;
        
        this.game.scene.add(this.mesh);
        
        // Add a dedicated light to ensure visibility
        const light = new THREE.PointLight(0xffffff, 2, 5);
        light.position.set(0, 2, 0);
        this.mesh.add(light);

        // Fallback Sphere (if models fail)
        const fallbackGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        this.fallback = new THREE.Mesh(fallbackGeo, fallbackMat);
        this.fallback.position.y = 0.5;
        this.mesh.add(this.fallback);

        this.loadModels();
    }

    loadModels() {
        console.log("PLAYER: Starting model load...");
        const setupModel = (name, gltf) => {
            console.log(`PLAYER: Model loaded: ${name}`);
            const model = gltf.scene;
            model.scale.set(1.2, 1.2, 1.2);
            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.models[name].scene = model;
            this.models[name].mixer = new THREE.AnimationMixer(model);
            
            // Map animations
            gltf.animations.forEach(clip => {
                const action = this.models[name].mixer.clipAction(clip);
                this.models[name].actions[clip.name.toLowerCase()] = action;
            });

            if (this.currentMode === name) {
                if (this.fallback) {
                    this.mesh.remove(this.fallback);
                    this.fallback = null;
                }
                this.mesh.add(model);
                this.playAnimation('idle');
            }
        };

        // Load Narrator
        this.loader.load('/models/narrator.glb', 
            (gltf) => setupModel('narrator', gltf),
            undefined,
            (err) => console.error("PLAYER: Error loading narrator:", err)
        );

        // Load Tyler
        this.loader.load('/models/tyler.glb', 
            (gltf) => setupModel('tyler', gltf),
            undefined,
            (err) => console.error("PLAYER: Error loading tyler:", err)
        );
    }

    playAnimation(name) {
        const mode = this.models[this.currentMode];
        if (!mode || !mode.mixer) return;

        // Try to find animation by fuzzy name
        let targetAction = null;
        for (const key in mode.actions) {
            if (key.includes(name)) {
                targetAction = mode.actions[key];
                break;
            }
        }

        if (targetAction) {
            if (this.currentAction === targetAction) return;
            if (this.currentAction) this.currentAction.fadeOut(0.2);
            targetAction.reset().fadeIn(0.2).play();
            this.currentAction = targetAction;
        }
    }

    switchMode() {
        this.mesh.clear();
        this.currentMode = this.currentMode === 'narrator' ? 'tyler' : 'narrator';
        
        const mode = this.models[this.currentMode];
        if (mode && mode.scene) {
            this.mesh.add(mode.scene);
            this.currentAction = null;
            this.playAnimation('idle');
        }

        this.game.ui.updatePersonality(this.currentMode);
        
        // Sanity drop on switch via system
        this.game.sanity.loseSanity(10);
    }

    update(dt) {
        // Update mixer
        const mode = this.models[this.currentMode];
        if (mode && mode.mixer) mode.mixer.update(dt);

        this.handleMovement(dt);
        this.handleCombat(dt);
        this.updateStats(dt);
    }

    handleMovement(dt) {
        const input = this.game.input.keys;
        const speed = this.stats[this.currentMode].speed;
        
        const moveDir = new THREE.Vector3(0, 0, 0);
        
        if (input['w']) moveDir.z -= 1;
        if (input['s']) moveDir.z += 1;
        if (input['a']) moveDir.x -= 1;
        if (input['d']) moveDir.x += 1;

        if (moveDir.length() > 0) {
            moveDir.normalize();
            
            this.playAnimation('walk');

            this.mesh.position.add(moveDir.multiplyScalar(speed * dt));
            
            // Rotate to face movement
            const angle = Math.atan2(moveDir.x, moveDir.z);
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, angle, 0.2);
        } else {
            this.playAnimation('idle');
        }

        // Toggle mode with Tab
        if (this.game.input.isJustPressed('Tab')) {
            this.switchMode();
        }
    }

    handleCombat(dt) {
        if (this.game.input.isJustPressed(' ')) { // Space to punch
            if (this.stamina > 10) {
                this.punch();
            }
        }
    }

    punch() {
        this.stamina -= 15;
        this.playAnimation('punch');
        
        // Return to idle after punch
        setTimeout(() => {
            if (this.currentAction && this.currentAction.getClip().name.toLowerCase().includes('punch')) {
                this.playAnimation('idle');
            }
        }, 1000);

        this.game.combat.processPunch(this);
    }

    updateStats(dt) {
        // Regenerate stamina
        if (this.stamina < this.stats[this.currentMode].stamina) {
            this.stamina += 5 * dt;
        }
    }
}

// End of module: E:\Fight Club\src\entities\Player.js

// Module finalized by SOUMILCHANDRA

// Module finalized by SOUMILCHANDRA
