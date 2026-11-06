import * as THREE from 'three';

/**
 * Arena: Constructs a full underground Fight Club basement environment.
 * Three-point lighting setup, volumetric light cones, textured ring canvas,
 * emissive corner posts, 3-tier ropes, cheering crowd silhouettes,
 * and an iconic glowing "PROJECT MAYHEM" neon sign.
 */
export class Arena {
    constructor(scene) {
        this.scene = scene;
        this.hangingLamps = [];
        this.crowdMembers = [];
        this.flickerTimer = 0;

        this.setupThreePointLighting();
        this.buildBasementEnclosure();
        this.buildFightRing();
        this.buildVolumetricLightCones();
        this.buildCrowdSilhouettes();
        this.buildNeonSign();
        this.buildIndustrialProps();
    }

    setupThreePointLighting() {
        // 1. Hemisphere Fill Light (Ensures no fighter is ever pitch black)
        const hemiLight = new THREE.HemisphereLight(0x445566, 0x222228, 1.4);
        this.scene.add(hemiLight);

        // 2. Warm Key Spotlight from above-front
        const keySpot = new THREE.SpotLight(0xffeedd, 55);
        keySpot.position.set(0, 8.0, 4.0);
        keySpot.target.position.set(0, 1.0, 0);
        keySpot.angle = Math.PI / 3;
        keySpot.penumbra = 0.55;
        keySpot.decay = 1.6;
        keySpot.distance = 30;
        keySpot.castShadow = true;
        keySpot.shadow.mapSize.width = 1024;
        keySpot.shadow.mapSize.height = 1024;
        keySpot.shadow.bias = -0.0005;
        this.scene.add(keySpot);
        this.scene.add(keySpot.target);

        // 3. Cool Rim Light from behind the ring
        const rimPoint = new THREE.PointLight(0x00d4ff, 28, 25);
        rimPoint.position.set(0, 5.0, -6.5);
        this.scene.add(rimPoint);

        // 4. Warm overhead pendant light over center ring
        const centerDownSpot = new THREE.SpotLight(0xfff5ea, 45);
        centerDownSpot.position.set(0, 6.8, 0);
        centerDownSpot.target.position.set(0, 0, 0);
        centerDownSpot.angle = Math.PI / 3.4;
        centerDownSpot.penumbra = 0.5;
        centerDownSpot.decay = 1.7;
        centerDownSpot.distance = 25;
        centerDownSpot.castShadow = true;
        this.scene.add(centerDownSpot);
        this.scene.add(centerDownSpot.target);
    }

    buildBasementEnclosure() {
        const size = 36;
        const height = 7.5;

        // Concrete Floor outside the ring
        const floorGeo = new THREE.PlaneGeometry(size, size);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x18181d,
            roughness: 0.9,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Ceiling
        const ceilGeo = new THREE.PlaneGeometry(size, size);
        const ceilMat = new THREE.MeshStandardMaterial({
            color: 0x0c0c10,
            roughness: 0.95,
            metalness: 0.05
        });
        const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
        ceiling.position.y = height;
        ceiling.rotation.x = Math.PI / 2;
        this.scene.add(ceiling);

        // 4 Basement Walls
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x1e1e24,
            roughness: 0.92,
            metalness: 0.1
        });

        const half = size / 2;
        const wallConfigs = [
            { pos: [0, height / 2, -half], rot: [0, 0, 0] },
            { pos: [0, height / 2, half], rot: [0, Math.PI, 0] },
            { pos: [-half, height / 2, 0], rot: [0, Math.PI / 2, 0] },
            { pos: [half, height / 2, 0], rot: [0, -Math.PI / 2, 0] }
        ];

        wallConfigs.forEach((cfg) => {
            const wallGeo = new THREE.PlaneGeometry(size, height);
            const wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(...cfg.pos);
            wall.rotation.set(...cfg.rot);
            wall.receiveShadow = true;
            this.scene.add(wall);
        });

        // Overhead Ventilation Duct
        const ductGeo = new THREE.BoxGeometry(size * 0.9, 0.8, 1.2);
        const ductMat = new THREE.MeshStandardMaterial({
            color: 0x22222a,
            roughness: 0.4,
            metalness: 0.7
        });
        const duct = new THREE.Mesh(ductGeo, ductMat);
        duct.position.set(0, height - 0.7, -4);
        this.scene.add(duct);
    }

    buildFightRing() {
        const ringSize = 14;
        const half = ringSize / 2;
        const postHeight = 2.4;

        // Ring Elevated Canvas Mat with texture/scuffs
        const matGeo = new THREE.BoxGeometry(ringSize, 0.08, ringSize);
        
        // Create canvas texture with scuffs, stains, and ring circle
        const canvasTex = this.createRingCanvasTexture();
        const ringMat = new THREE.MeshStandardMaterial({
            map: canvasTex,
            roughness: 0.82,
            metalness: 0.15
        });
        const ringFloor = new THREE.Mesh(matGeo, ringMat);
        ringFloor.position.y = 0.04;
        ringFloor.receiveShadow = true;
        this.scene.add(ringFloor);

        // 4 Heavy Corner Posts with Emissive Accents
        const postGeo = new THREE.CylinderGeometry(0.12, 0.15, postHeight, 16);
        const postMat = new THREE.MeshStandardMaterial({
            color: 0x1f1f22,
            metalness: 0.75,
            roughness: 0.3
        });

        const corners = [
            [-half, -half],
            [half, -half],
            [half, half],
            [-half, half]
        ];

        corners.forEach(([x, z], i) => {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(x, postHeight / 2, z);
            post.castShadow = true;
            this.scene.add(post);

            // Turnbuckle Corner Pad with emissive red glow
            const padGeo = new THREE.BoxGeometry(0.38, 1.3, 0.38);
            const isRedCorner = (i === 0 || i === 3);
            const padMat = new THREE.MeshStandardMaterial({
                color: isRedCorner ? 0xcc0033 : 0x111116,
                emissive: isRedCorner ? 0x660018 : 0x000000,
                emissiveIntensity: 0.6,
                roughness: 0.5
            });
            const pad = new THREE.Mesh(padGeo, padMat);
            pad.position.set(x, 1.25, z);
            this.scene.add(pad);
        });

        // 3 Tiers of Ring Ropes with distinct colors
        const ropeHeights = [0.65, 1.15, 1.65];
        const ropeColors = [0xeeeeee, 0xff1744, 0x111111]; // White, Red, Black

        ropeHeights.forEach((h, idx) => {
            const ropeMat = new THREE.MeshStandardMaterial({
                color: ropeColors[idx],
                roughness: 0.6,
                emissive: idx === 1 ? 0x440011 : 0x000000,
                emissiveIntensity: 0.4
            });

            for (let i = 0; i < 4; i++) {
                const [x1, z1] = corners[i];
                const [x2, z2] = corners[(i + 1) % 4];

                const length = ringSize;
                const ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, length, 8);
                const rope = new THREE.Mesh(ropeGeo, ropeMat);

                rope.position.set((x1 + x2) / 2, h, (z1 + z2) / 2);

                if (x1 === x2) {
                    rope.rotation.x = Math.PI / 2;
                } else {
                    rope.rotation.z = Math.PI / 2;
                }
                rope.castShadow = true;
                this.scene.add(rope);
            }
        });
    }

    createRingCanvasTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Base canvas color (weathered off-white / light slate)
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(0, 0, 1024, 1024);

        // Dark canvas noise / stains
        for (let i = 0; i < 400; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const radius = Math.random() * 25 + 5;
            ctx.fillStyle = Math.random() < 0.2 ? 'rgba(120, 20, 30, 0.15)' : 'rgba(0, 0, 0, 0.08)';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center circular fight ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(512, 512, 280, 0, Math.PI * 2);
        ctx.stroke();

        // Inner circle
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.25)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(512, 512, 250, 0, Math.PI * 2);
        ctx.stroke();

        // Stenciled "RULE #1: NO QUESTIONS" along the edge
        ctx.font = 'bold 32px "Space Mono", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.textAlign = 'center';
        ctx.fillText('PROJECT MAYHEM  •  UNDERGROUND FIGHT CLUB  •  RULE #1', 512, 120);
        ctx.fillText('PROJECT MAYHEM  •  UNDERGROUND FIGHT CLUB  •  RULE #1', 512, 920);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }

    buildVolumetricLightCones() {
        // Transparent additive cone representing the atmospheric dust/fog light shaft
        const coneGeo = new THREE.ConeGeometry(3.6, 6.5, 24, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0xfff0dd,
            transparent: true,
            opacity: 0.065,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(0, 3.5, 0);
        cone.rotation.x = Math.PI; // point down
        this.scene.add(cone);
    }

    buildCrowdSilhouettes() {
        // Outer spectator group standing outside the ropes in the shadows
        const crowdGroup = new THREE.Group();
        const spectatorMat = new THREE.MeshBasicMaterial({
            color: 0x09090d,
            transparent: true,
            opacity: 0.95
        });

        const numSpectators = 24;
        const radius = 9.5;

        for (let i = 0; i < numSpectators; i++) {
            const angle = (i / numSpectators) * Math.PI * 2;
            // Leave opening for camera view (south side)
            if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) continue;

            const specGroup = new THREE.Group();
            
            // Head
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), spectatorMat);
            head.position.y = 1.7;
            specGroup.add(head);

            // Torso
            const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.8, 8, 8), spectatorMat);
            torso.position.y = 1.05;
            specGroup.add(torso);

            const x = Math.cos(angle) * (radius + (Math.random() - 0.5) * 1.5);
            const z = Math.sin(angle) * (radius + (Math.random() - 0.5) * 1.5);
            specGroup.position.set(x, 0, z);
            specGroup.lookAt(0, 1.2, 0);

            crowdGroup.add(specGroup);
            this.crowdMembers.push({
                group: specGroup,
                phase: Math.random() * Math.PI * 2,
                speed: 1.5 + Math.random() * 2.0
            });
        }

        this.scene.add(crowdGroup);
    }

    buildNeonSign() {
        const signGroup = new THREE.Group();
        signGroup.position.set(0, 4.6, -17.8);

        // Sign Backing
        const bracketGeo = new THREE.BoxGeometry(9.0, 2.0, 0.15);
        const bracketMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0e,
            metalness: 0.85,
            roughness: 0.4
        });
        const bracket = new THREE.Mesh(bracketGeo, bracketMat);
        signGroup.add(bracket);

        // Glowing neon canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#060609';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Neon border
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 8;
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

        // Text with intense glow
        ctx.font = '900 86px "Inter", "Space Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#ff1744';
        ctx.fillText('PROJECT MAYHEM', canvas.width / 2, canvas.height / 2);

        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PROJECT MAYHEM', canvas.width / 2, canvas.height / 2);

        const neonTex = new THREE.CanvasTexture(canvas);
        const neonGeo = new THREE.PlaneGeometry(8.8, 1.8);
        const neonMat = new THREE.MeshBasicMaterial({
            map: neonTex,
            transparent: true
        });
        const neonMesh = new THREE.Mesh(neonGeo, neonMat);
        neonMesh.position.z = 0.09;
        signGroup.add(neonMesh);

        // Hot pink neon point light casting illumination
        this.neonPointLight = new THREE.PointLight(0xff0055, 38, 26);
        this.neonPointLight.position.set(0, 4.6, -16.2);
        this.scene.add(this.neonPointLight);

        this.scene.add(signGroup);
    }

    buildIndustrialProps() {
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x3d2c1e, roughness: 0.85 });
        const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);

        const cratePositions = [
            [-14, 0.6, -14],
            [-14, 1.8, -14],
            [-12.7, 0.6, -14],
            [14, 0.6, -13],
            [13, 0.6, 14],
            [14, 0.6, 14]
        ];

        cratePositions.forEach(([x, y, z]) => {
            const crate = new THREE.Mesh(crateGeo, crateMat);
            crate.position.set(x, y, z);
            crate.rotation.y = (Math.random() - 0.5) * 0.4;
            crate.castShadow = true;
            crate.receiveShadow = true;
            this.scene.add(crate);
        });

        // Metal Barrels
        const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16);
        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0x1c2430,
            metalness: 0.7,
            roughness: 0.4
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(-14, 0.7, 13);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        this.scene.add(barrel);
    }

    update(dt) {
        this.flickerTimer += dt;

        // Subtle cheering sway of spectators
        for (const spec of this.crowdMembers) {
            spec.group.rotation.z = Math.sin(this.flickerTimer * spec.speed + spec.phase) * 0.04;
            spec.group.position.y = Math.abs(Math.sin(this.flickerTimer * spec.speed * 1.5 + spec.phase)) * 0.06;
        }

        // Neon sign pulse
        if (this.neonPointLight) {
            this.neonPointLight.intensity = 38 + Math.sin(this.flickerTimer * 4.0) * 5;
            if (Math.random() < 0.012) {
                this.neonPointLight.intensity = 12; // brief neon tube buzz dip
            }
        }
    }
}
