import * as THREE from 'three';

/**
 * Effects Engine: Drives visual feedback, screen shake, hit sparks,
 * chromatic aberration, UI jitter, and sanity breakdown hallucinations
 * (ghost opponent flickers and visual tears).
 */
export class Effects {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;

        // Particle pool for hit sparks
        this.particleCount = 140;
        const geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        this.lifetimes = new Float32Array(this.particleCount);

        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xff4433,
            size: 0.14,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.particles.frustumCulled = false;
        this.scene.add(this.particles);

        // Visual glitch overlays
        this.glitchOverlay = document.getElementById('glitch-overlay');
        this.uiContainer = document.getElementById('ui-container');
        this.burstTimer = 0;

        // Hallucination / Ghost Opponent setup
        this.ghostFlickerTimer = 0;
        this.ghostMesh = null;
        this.createGhostMesh();
    }

    createGhostMesh() {
        // Wireframe silhouette ghost for low-sanity hallucinations
        const ghostGeo = new THREE.CapsuleGeometry(0.35, 1.2, 8, 16);
        const ghostMat = new THREE.MeshBasicMaterial({
            color: 0xff0044,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        this.ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
        this.ghostMesh.visible = false;
        this.scene.add(this.ghostMesh);
    }

    spawnHitSparks(position, colorHex = 0xff3e3e) {
        if (this.particles.material) {
            this.particles.material.color.setHex(colorHex);
        }

        let spawned = 0;
        for (let i = 0; i < this.particleCount && spawned < 20; i++) {
            if (this.lifetimes[i] <= 0) {
                const idx = i * 3;
                this.positions[idx] = position.x;
                this.positions[idx + 1] = position.y;
                this.positions[idx + 2] = position.z;

                this.velocities[idx] = (Math.random() - 0.5) * 7;
                this.velocities[idx + 1] = Math.random() * 5 + 1.5;
                this.velocities[idx + 2] = (Math.random() - 0.5) * 7;

                this.lifetimes[i] = 0.35 + Math.random() * 0.25;
                spawned++;
            }
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    glitchBurst(duration = 0.3) {
        this.burstTimer = duration;
    }

    update(dt, sanityTier = 'STABLE', sanityVal = 100) {
        // 1. Update Hit Spark Particles
        let hasActive = false;
        for (let i = 0; i < this.particleCount; i++) {
            if (this.lifetimes[i] > 0) {
                this.lifetimes[i] -= dt;
                const idx = i * 3;
                this.positions[idx] += this.velocities[idx] * dt;
                this.positions[idx + 1] += this.velocities[idx + 1] * dt;
                this.positions[idx + 2] += this.velocities[idx + 2] * dt;

                this.velocities[idx + 1] -= 9.8 * dt; // gravity
                hasActive = true;
            }
        }
        if (hasActive) {
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // 2. Glitch Bursts & Chromatic Aberration Filter
        if (this.burstTimer > 0) {
            this.burstTimer -= dt;
            if (this.glitchOverlay) {
                this.glitchOverlay.style.opacity = '0.7';
                this.glitchOverlay.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(200%)`;
            }
        } else if (sanityTier === 'CRITICAL') {
            // Constant psychological distortion
            if (this.glitchOverlay) {
                this.glitchOverlay.style.opacity = String(0.25 + Math.random() * 0.3);
                this.glitchOverlay.style.filter = `contrast(130%) hue-rotate(${Math.sin(performance.now() * 0.005) * 45}deg)`;
            }
        }

        // 3. UI Jitter at Low Sanity
        if (this.uiContainer) {
            if (sanityTier === 'CRITICAL') {
                const jx = (Math.random() - 0.5) * 6;
                const jy = (Math.random() - 0.5) * 4;
                this.uiContainer.style.transform = `translate(${jx}px, ${jy}px)`;
            } else if (sanityTier === 'DISTORTED') {
                const jx = (Math.random() - 0.5) * 1.5;
                const jy = (Math.random() - 0.5) * 1.5;
                this.uiContainer.style.transform = `translate(${jx}px, ${jy}px)`;
            } else {
                this.uiContainer.style.transform = 'none';
            }
        }

        // 4. Hallucination: Fake Enemy Ghost Flickers at Low Sanity
        if (this.ghostMesh) {
            if (sanityVal < 30) {
                this.ghostFlickerTimer -= dt;
                if (this.ghostFlickerTimer <= 0) {
                    // Trigger brief ghost flicker
                    this.ghostMesh.visible = !this.ghostMesh.visible;
                    if (this.ghostMesh.visible) {
                        // Position ghost randomly around player's peripheral vision
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 3.5 + Math.random() * 2.5;
                        this.ghostMesh.position.set(Math.cos(angle) * dist, 0.9, Math.sin(angle) * dist);
                        this.ghostFlickerTimer = 0.15 + Math.random() * 0.3; // brief flicker
                    } else {
                        this.ghostFlickerTimer = 1.0 + Math.random() * 2.5; // silence before next flicker
                    }
                }
            } else {
                this.ghostMesh.visible = false;
            }
        }
    }
}
