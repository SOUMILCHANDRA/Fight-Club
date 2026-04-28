/**
 * @file E:\Fight Club\src\entities\Enemy.js
 * @description Senior implementation for Project Mayhem.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Enemy {
    constructor(game, position) {
        this.game = game;
        this.loader = new GLTFLoader();
        
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);
        this.game.scene.add(this.mesh);

        this.model = null;
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        
        this.health = 50;
        this.speed = 3;
        this.state = 'idle'; 

        this.loadModel();
    }

    loadModel() {
        this.loader.load('/models/narrator.glb', (gltf) => {
            this.model = gltf.scene;
            this.model.scale.set(1.1, 1.1, 1.1);
            this.model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Tint enemy slightly different
                    child.material = child.material.clone();
                    child.material.color.setHex(0x888888);
                }
            });
            this.mesh.add(this.model);

            this.mixer = new THREE.AnimationMixer(this.model);
            gltf.animations.forEach(clip => {
                this.actions[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
            });

            this.playAnimation('idle');
        });
    }

    playAnimation(name) {
        if (!this.mixer) return;
        let targetAction = null;
        for (const key in this.actions) {
            if (key.includes(name)) {
                targetAction = this.actions[key];
                break;
            }
        }

        if (targetAction && this.currentAction !== targetAction) {
            if (this.currentAction) this.currentAction.fadeOut(0.2);
            targetAction.reset().fadeIn(0.2).play();
            this.currentAction = targetAction;
        }
    }

    update(dt) {
        if (this.mixer) this.mixer.update(dt);

        if (this.health <= 0) {
            this.die();
            return;
        }

        const playerPos = this.game.player.mesh.position;
        const dist = this.mesh.position.distanceTo(playerPos);

        if (dist < 10 && dist > 1.5) {
            this.state = 'chase';
            this.playAnimation('walk');
            this.moveTowards(playerPos, dt);
        } else if (dist <= 1.5) {
            this.state = 'attack';
            this.playAnimation('punch');
            this.attack(dt);
        } else {
            this.state = 'idle';
            this.playAnimation('idle');
        }
    }

    moveTowards(target, dt) {
        const dir = new THREE.Vector3().subVectors(target, this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed * dt));
        
        const angle = Math.atan2(dir.x, dir.z);
        this.mesh.rotation.y = angle;
    }

    attack(dt) {
        // Simple attack logic
        if (Math.random() < 0.01) {
            console.log("Enemy attacked player!");
            this.game.sanity.loseSanity(5);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        console.log(`Enemy took ${amount} damage. Health: ${this.health}`);
        
        // Hit reaction: flash red on all meshes
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.material.emissive.setHex(0xff0000);
            }
        });

        setTimeout(() => {
            this.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.emissive.setHex(0x000000);
                }
            });
        }, 100);
    }

    die() {
        this.game.scene.remove(this.mesh);
        // Remove from entities list
        const index = this.game.entities.indexOf(this);
        if (index > -1) {
            this.game.entities.splice(index, 1);
        }
    }
}

// End of module: E:\Fight Club\src\entities\Enemy.js
