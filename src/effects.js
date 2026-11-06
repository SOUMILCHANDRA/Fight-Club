import * as THREE from 'three';

/**
 * Creates a soft circular sprite texture with a radial gradient falloff.
 * Avoids default square WebGL points and ensures smooth circular motes/sparks.
 */
function createCircularSpriteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

/**
 * Effects Engine: Drives visual feedback, screen shake, hit sparks,
 * chromatic aberration, UI jitter, ambient dust motes in the spotlight,
 * and sanity breakdown hallucinations (ghost opponent flickers).
 */
export class Effects {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;

        // Shared soft circular sprite texture
        this.spriteTexture = createCircularSpriteTexture();

        // ----------------------------------------------------
        // 1. Ambient Layer: Fine dust motes drifting in spotlight
        // ----------------------------------------------------
        this.ambientCount = 65;
        this.ambientPositions = new Float32Array(this.ambientCount * 3);
        this.ambientParams = [];

        for (let i = 0; i < this.ambientCount; i++) {
            const y = 0.3 + Math.random() * 5.8;
            // Radius at height y inside spotlight beam
            const maxR = (0.35 + (1.0 - y / 6.5) * 2.8) * Math.sqrt(Math.random());
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * maxR;
            const z = Math.sin(angle) * maxR;

            this.ambientPositions[i * 3] = x;
            this.ambientPositions[i * 3 + 1] = y;
            this.ambientPositions[i * 3 + 2] = z;

            this.ambientParams.push({
                angle,
                radius: maxR,
                speedY: (Math.random() - 0.45) * 0.18, // gentle vertical drift
                angularSpeed: (Math.random() - 0.5) * 0.4,
                wobblePhase: Math.random() * Math.PI * 2
            });
        }

        const ambientGeo = new THREE.BufferGeometry();
        ambientGeo.setAttribute('position', new THREE.BufferAttribute(this.ambientPositions, 3));

        const ambientMat = new THREE.PointsMaterial({
            map: this.spriteTexture,
            color: 0xffeed8,
            size: 0.065,
            transparent: true,
            opacity: 0.32,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.ambientDust = new THREE.Points(ambientGeo, ambientMat);
        this.ambientDust.frustumCulled = false;
        this.scene.add(this.ambientDust);

        // ----------------------------------------------------
        // 2. Impact Layer: Hit sparks & blood-red flecks pool
        // ----------------------------------------------------
        this.impactCount = 180;
        const impactGeo = new THREE.BufferGeometry();
        this.impactPositions = new Float32Array(this.impactCount * 3);
        this.impactColors = new Float32Array(this.impactCount * 3);
        this.impactVelocities = new Float32Array(this.impactCount * 3);
        this.impactLifetimes = new Float32Array(this.impactCount);
        this.impactMaxLifetimes = new Float32Array(this.impactCount);
        this.impactTypes = new Uint8Array(this.impactCount); // 0: spark, 1: blood fleck

        // Initialize all off-screen so none idle visibly on screen
        for (let i = 0; i < this.impactCount; i++) {
            this.impactPositions[i * 3] = 0;
            this.impactPositions[i * 3 + 1] = -9999;
            this.impactPositions[i * 3 + 2] = 0;
            this.impactLifetimes[i] = 0;
            this.impactMaxLifetimes[i] = 1;
        }

        impactGeo.setAttribute('position', new THREE.BufferAttribute(this.impactPositions, 3));
        impactGeo.setAttribute('color', new THREE.BufferAttribute(this.impactColors, 3));

        const impactMat = new THREE.PointsMaterial({
            map: this.spriteTexture,
            size: 0.11,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.impactParticles = new THREE.Points(impactGeo, impactMat);
        this.impactParticles.frustumCulled = false;
        this.scene.add(this.impactParticles);

        // Backward compatibility reference
        this.particles = this.impactParticles;

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

    /**
     * Spawns punch impact particles: high-speed golden sparks and heavier blood-red flecks.
     */
    spawnHitSparks(position, colorHexOrIsHeavy = false) {
        const isHeavy = (typeof colorHexOrIsHeavy === 'boolean' && colorHexOrIsHeavy) || 
                        colorHexOrIsHeavy === 0xff2244;

        const countToSpawn = isHeavy ? 30 : 20;
        let spawned = 0;

        for (let i = 0; i < this.impactCount && spawned < countToSpawn; i++) {
            if (this.impactLifetimes[i] <= 0) {
                const idx = i * 3;
                // Hit point with slight jitter
                this.impactPositions[idx] = position.x + (Math.random() - 0.5) * 0.15;
                this.impactPositions[idx + 1] = position.y + (Math.random() - 0.5) * 0.15;
                this.impactPositions[idx + 2] = position.z + (Math.random() - 0.5) * 0.15;

                const isBloodFleck = Math.random() < 0.42;
                this.impactTypes[i] = isBloodFleck ? 1 : 0;

                // Lifetimes strictly 0.30 - 0.60 seconds
                const lifetime = 0.32 + Math.random() * 0.26;
                this.impactLifetimes[i] = lifetime;
                this.impactMaxLifetimes[i] = lifetime;

                if (isBloodFleck) {
                    // Blood-red fleck: crimson colors, arcing trajectory
                    this.impactColors[idx] = 1.0;
                    this.impactColors[idx + 1] = 0.08 + Math.random() * 0.1;
                    this.impactColors[idx + 2] = 0.15 + Math.random() * 0.1;

                    const speed = 2.0 + Math.random() * 3.5;
                    const angle = Math.random() * Math.PI * 2;
                    this.impactVelocities[idx] = Math.cos(angle) * speed;
                    this.impactVelocities[idx + 1] = 1.0 + Math.random() * 3.0;
                    this.impactVelocities[idx + 2] = Math.sin(angle) * speed;
                } else {
                    // Fast fiery impact spark: bright gold/amber/white
                    if (Math.random() < 0.35) {
                        this.impactColors[idx] = 1.0;
                        this.impactColors[idx + 1] = 0.95;
                        this.impactColors[idx + 2] = 0.85;
                    } else {
                        this.impactColors[idx] = 1.0;
                        this.impactColors[idx + 1] = 0.65;
                        this.impactColors[idx + 2] = 0.2;
                    }

                    const speed = 4.5 + Math.random() * 4.0;
                    const phi = Math.random() * Math.PI * 2;
                    const theta = (Math.random() - 0.2) * Math.PI;
                    this.impactVelocities[idx] = Math.cos(phi) * Math.cos(theta) * speed;
                    this.impactVelocities[idx + 1] = Math.abs(Math.sin(theta)) * speed + 1.2;
                    this.impactVelocities[idx + 2] = Math.sin(phi) * Math.cos(theta) * speed;
                }

                spawned++;
            }
        }

        this.impactParticles.geometry.attributes.position.needsUpdate = true;
        this.impactParticles.geometry.attributes.color.needsUpdate = true;
    }

    // Backward compatibility helper
    spawnParticles(x, y, color) {
        this.spawnHitSparks(new THREE.Vector3(x, 1.2, y || 0), color);
    }

    shake(intensity, duration) {
        this.glitchBurst(duration ? duration / 1000 : 0.25);
    }

    glitchBurst(duration = 0.3) {
        this.burstTimer = duration;
    }

    update(dt, sanityTier = 'STABLE', sanityVal = 100) {
        // ----------------------------------------------------
        // 1. Update Ambient Dust Motes (Drifting inside spotlight)
        // ----------------------------------------------------
        if (this.ambientDust) {
            for (let i = 0; i < this.ambientCount; i++) {
                const param = this.ambientParams[i];
                const idx = i * 3;

                // Drift vertically
                this.ambientPositions[idx + 1] += param.speedY * dt;

                // Loop smoothly within spotlight height
                if (this.ambientPositions[idx + 1] > 6.2) {
                    this.ambientPositions[idx + 1] = 0.25;
                } else if (this.ambientPositions[idx + 1] < 0.2) {
                    this.ambientPositions[idx + 1] = 6.15;
                }

                // Radius bound by beam cone at this height
                const curY = this.ambientPositions[idx + 1];
                const maxR = (0.35 + (1.0 - curY / 6.5) * 2.8);

                param.angle += param.angularSpeed * dt;
                param.wobblePhase += dt * 1.2;
                const r = Math.min(param.radius, maxR) + Math.sin(param.wobblePhase) * 0.12;

                this.ambientPositions[idx] = Math.cos(param.angle) * r;
                this.ambientPositions[idx + 2] = Math.sin(param.angle) * r;
            }
            this.ambientDust.geometry.attributes.position.needsUpdate = true;
        }

        // ----------------------------------------------------
        // 2. Update Impact Particles (Sparks & Blood Flecks)
        // ----------------------------------------------------
        let hasActiveImpact = false;
        for (let i = 0; i < this.impactCount; i++) {
            if (this.impactLifetimes[i] > 0) {
                this.impactLifetimes[i] -= dt;
                const idx = i * 3;

                if (this.impactLifetimes[i] <= 0) {
                    // Pool immediately off-screen - never leave idling on screen
                    this.impactPositions[idx] = 0;
                    this.impactPositions[idx + 1] = -9999;
                    this.impactPositions[idx + 2] = 0;
                } else {
                    // Update kinematics
                    const isBlood = this.impactTypes[i] === 1;
                    const gravity = isBlood ? 12.0 : 9.8;
                    const drag = isBlood ? 0.94 : 0.97;

                    this.impactVelocities[idx] *= Math.pow(drag, dt * 60);
                    this.impactVelocities[idx + 1] -= gravity * dt;
                    this.impactVelocities[idx + 2] *= Math.pow(drag, dt * 60);

                    this.impactPositions[idx] += this.impactVelocities[idx] * dt;
                    this.impactPositions[idx + 1] += this.impactVelocities[idx + 1] * dt;
                    this.impactPositions[idx + 2] += this.impactVelocities[idx + 2] * dt;

                    // Ring canvas collision bounce / splat
                    if (this.impactPositions[idx + 1] < 0.08) {
                        this.impactPositions[idx + 1] = 0.08;
                        this.impactVelocities[idx + 1] = -this.impactVelocities[idx + 1] * 0.25;
                        this.impactVelocities[idx] *= 0.5;
                        this.impactVelocities[idx + 2] *= 0.5;
                    }
                }
                hasActiveImpact = true;
            }
        }
        if (hasActiveImpact) {
            this.impactParticles.geometry.attributes.position.needsUpdate = true;
        }

        // ----------------------------------------------------
        // 3. Glitch Bursts & Chromatic Aberration Filter
        // ----------------------------------------------------
        if (this.burstTimer > 0) {
            this.burstTimer -= dt;
            if (this.glitchOverlay) {
                this.glitchOverlay.style.opacity = '0.7';
                this.glitchOverlay.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(200%)`;
            }
        } else if (sanityTier === 'CRITICAL') {
            if (this.glitchOverlay) {
                this.glitchOverlay.style.opacity = String(0.25 + Math.random() * 0.3);
                this.glitchOverlay.style.filter = `contrast(130%) hue-rotate(${Math.sin(performance.now() * 0.005) * 45}deg)`;
            }
        } else if (this.glitchOverlay) {
            this.glitchOverlay.style.opacity = '0';
        }

        // ----------------------------------------------------
        // 4. UI Jitter at Low Sanity
        // ----------------------------------------------------
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

        // ----------------------------------------------------
        // 5. Hallucination: Ghost Opponent Flickers at Low Sanity
        // ----------------------------------------------------
        if (this.ghostMesh) {
            if (sanityVal < 30) {
                this.ghostFlickerTimer -= dt;
                if (this.ghostFlickerTimer <= 0) {
                    this.ghostMesh.visible = !this.ghostMesh.visible;
                    if (this.ghostMesh.visible) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 3.5 + Math.random() * 2.5;
                        this.ghostMesh.position.set(Math.cos(angle) * dist, 0.9, Math.sin(angle) * dist);
                        this.ghostFlickerTimer = 0.15 + Math.random() * 0.3;
                    } else {
                        this.ghostFlickerTimer = 1.0 + Math.random() * 2.5;
                    }
                }
            } else {
                this.ghostMesh.visible = false;
            }
        }
    }
}
