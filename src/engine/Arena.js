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
        // 1. Hemisphere Fill Light (Ensures no fighter is ever pitch black, raised for clarity)
        const hemiLight = new THREE.HemisphereLight(0x667788, 0x333340, 2.0);
        this.scene.add(hemiLight);

        // 2. Warm Key Spotlight from above-front
        const keySpot = new THREE.SpotLight(0xffeedd, 58);
        keySpot.position.set(0, 8.0, 4.0);
        keySpot.target.position.set(0, 1.0, 0);
        keySpot.angle = Math.PI / 3;
        keySpot.penumbra = 0.55;
        keySpot.decay = 1.6;
        keySpot.distance = 32;
        keySpot.castShadow = true;
        keySpot.shadow.mapSize.width = 1024;
        keySpot.shadow.mapSize.height = 1024;
        keySpot.shadow.bias = -0.0005;
        this.scene.add(keySpot);
        this.scene.add(keySpot.target);

        // 3. Cool Rim Light from behind the ring (frames fighter silhouettes)
        const rimPoint = new THREE.PointLight(0x00d4ff, 32, 26);
        rimPoint.position.set(0, 5.0, -6.5);
        this.scene.add(rimPoint);

        // 4. Warm overhead pendant light over center ring
        const centerDownSpot = new THREE.SpotLight(0xfff5ea, 48);
        centerDownSpot.position.set(0, 6.8, 0);
        centerDownSpot.target.position.set(0, 0, 0);
        centerDownSpot.angle = Math.PI / 3.4;
        centerDownSpot.penumbra = 0.5;
        centerDownSpot.decay = 1.7;
        centerDownSpot.distance = 26;
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

        // 1. Base canvas color (weathered heavyweight fight canvas)
        ctx.fillStyle = '#36373f';
        ctx.fillRect(0, 0, 1024, 1024);

        // 2. Fine canvas weave / micro-texture
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        for (let y = 0; y < 1024; y += 4) {
            ctx.fillRect(0, y, 1024, 1);
        }
        for (let x = 0; x < 1024; x += 4) {
            ctx.fillRect(x, 0, 1, 1024);
        }

        // 3. Subtle organic canvas grime and foot-scuff streaks
        for (let i = 0; i < 45; i++) {
            const cx = 512 + (Math.random() - 0.5) * 550;
            const cy = 512 + (Math.random() - 0.5) * 550;
            const len = 30 + Math.random() * 70;
            const angle = Math.random() * Math.PI * 2;

            ctx.strokeStyle = Math.random() < 0.6 
                ? 'rgba(15, 15, 20, 0.08)' 
                : 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 4 + Math.random() * 12;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
            ctx.stroke();
        }

        // 4. Irregular blood & sweat stains concentrated near center ring (varied shapes, low opacity)
        const stainColors = [
            'rgba(140, 20, 35, 0.18)',
            'rgba(110, 15, 25, 0.14)',
            'rgba(90, 10, 20, 0.22)',
            'rgba(30, 25, 25, 0.12)'
        ];

        for (let i = 0; i < 18; i++) {
            // Concentrated within 220px of center
            const radDist = Math.random() * 220;
            const angle = Math.random() * Math.PI * 2;
            const cx = 512 + Math.cos(angle) * radDist;
            const cy = 512 + Math.sin(angle) * radDist;
            const stainRadius = 8 + Math.random() * 28;

            ctx.fillStyle = stainColors[i % stainColors.length];
            ctx.beginPath();
            // Create irregular organic polygon splat instead of circles
            const numPoints = 7 + Math.floor(Math.random() * 5);
            for (let p = 0; p < numPoints; p++) {
                const theta = (p / numPoints) * Math.PI * 2;
                const r = stainRadius * (0.55 + Math.random() * 0.7);
                const px = cx + Math.cos(theta) * r;
                const py = cy + Math.sin(theta) * r;
                if (p === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        }

        // 5. Crisp white outer fight circle
        ctx.strokeStyle = 'rgba(240, 242, 248, 0.75)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(512, 512, 280, 0, Math.PI * 2);
        ctx.stroke();

        // 6. Thinner red inner ring as emissive accent
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(512, 512, 254, 0, Math.PI * 2);
        ctx.stroke();

        // 7. Crisp stenciled "PROJECT MAYHEM" ring border
        ctx.font = 'bold 30px "Space Mono", monospace';
        ctx.fillStyle = 'rgba(240, 240, 245, 0.32)';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '3px';
        ctx.fillText('PROJECT MAYHEM  •  UNDERGROUND FIGHT CLUB  •  RULE #1', 512, 110);
        ctx.fillText('PROJECT MAYHEM  •  UNDERGROUND FIGHT CLUB  •  RULE #1', 512, 930);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }

    createFloorLightPoolTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 126);
        grad.addColorStop(0.0, 'rgba(255, 245, 225, 0.52)');
        grad.addColorStop(0.25, 'rgba(255, 225, 185, 0.38)');
        grad.addColorStop(0.55, 'rgba(255, 190, 130, 0.16)');
        grad.addColorStop(0.85, 'rgba(255, 160, 90, 0.04)');
        grad.addColorStop(1.0, 'rgba(255, 140, 70, 0.0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        const tex = new THREE.CanvasTexture(canvas);
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        return tex;
    }

    buildVolumetricLightCones() {
        // Soft volumetric-looking beam with custom ShaderMaterial edge and bottom falloff
        const coneGeo = new THREE.CylinderGeometry(0.4, 3.8, 6.6, 36, 16, true);
        
        const vertexShader = `
            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vViewDir;
            varying vec2 vUv;

            void main() {
                vUv = uv;
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWorldPos = wp.xyz;
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                vViewDir = normalize(-mvPos.xyz);
                gl_Position = projectionMatrix * mvPos;
            }
        `;

        const fragmentShader = `
            uniform vec3 uColor;
            uniform float uOpacity;
            uniform float uTime;
            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vViewDir;
            varying vec2 vUv;

            void main() {
                // Vertical gradient: 0.0 at floor (y ~ 0.2), 1.0 at fixture (y ~ 6.8)
                float h = clamp((vWorldPos.y - 0.2) / 6.4, 0.0, 1.0);

                // Soft fade at top near lamp fixture
                float topFade = smoothstep(1.0, 0.82, h);
                // Soft fade toward floor to eliminate harsh geometric clipping
                float bottomFade = smoothstep(0.0, 0.35, h);
                float verticalFade = topFade * bottomFade;

                // Feather cone silhouette edges using view angle
                float rim = abs(dot(vNormal, vViewDir));
                float rimFade = pow(rim, 0.8);

                // Subtle atmospheric haze shimmer
                float shimmer = 1.0 + sin(vWorldPos.y * 3.2 + uTime * 2.0) * 0.05;

                float alpha = uOpacity * verticalFade * rimFade * shimmer;
                alpha = clamp(alpha, 0.0, 0.25);

                gl_FragColor = vec4(uColor, alpha);
            }
        `;

        this.volumetricMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uColor: { value: new THREE.Color(0xffeed8) },
                uOpacity: { value: 0.11 },
                uTime: { value: 0.0 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const cone = new THREE.Mesh(coneGeo, this.volumetricMaterial);
        cone.position.set(0, 3.5, 0);
        this.scene.add(cone);

        // Bright pool of light on the ring floor where the spotlight lands
        const poolTex = this.createFloorLightPoolTexture();
        const poolGeo = new THREE.PlaneGeometry(6.6, 6.6);
        const poolMat = new THREE.MeshBasicMaterial({
            map: poolTex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.85
        });

        this.floorLightPool = new THREE.Mesh(poolGeo, poolMat);
        this.floorLightPool.position.set(0, 0.082, 0);
        this.floorLightPool.rotation.x = -Math.PI / 2;
        this.scene.add(this.floorLightPool);
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
        // 1. Weathered Wooden Crates
        const crateMat = new THREE.MeshStandardMaterial({ 
            color: 0x38281c, 
            roughness: 0.88,
            metalness: 0.1
        });
        const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);

        const cratePositions = [
            [-14, 0.6, -14],
            [-14, 1.8, -14],
            [-12.7, 0.6, -14],
            [14, 0.6, -13],
            [13.8, 1.8, -13],
            [13, 0.6, 14],
            [14.2, 0.6, 14],
            [-13.5, 0.6, 12]
        ];

        cratePositions.forEach(([x, y, z]) => {
            const crate = new THREE.Mesh(crateGeo, crateMat);
            crate.position.set(x, y, z);
            crate.rotation.y = (Math.random() - 0.5) * 0.5;
            crate.castShadow = true;
            crate.receiveShadow = true;
            this.scene.add(crate);
        });

        // 2. Heavy Metal Industrial Oil Drums / Barrels
        const barrelGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.4, 16);
        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0x1f2733,
            metalness: 0.75,
            roughness: 0.35
        });

        const barrelPositions = [
            [-14, 0.7, 13.5],
            [-12.8, 0.7, 13.8],
            [13.5, 0.7, -11.5],
            [14.2, 0.7, 11.5]
        ];

        barrelPositions.forEach(([x, y, z]) => {
            const barrel = new THREE.Mesh(barrelGeo, barrelMat);
            barrel.position.set(x, y, z);
            barrel.castShadow = true;
            barrel.receiveShadow = true;
            this.scene.add(barrel);
        });

        // 3. Underground Fight Club Metal Folding Chairs outside the ropes
        const chairMat = new THREE.MeshStandardMaterial({
            color: 0x24242a,
            metalness: 0.65,
            roughness: 0.4
        });

        const chairPositions = [
            [-8.2, 0, -3.0],
            [-8.2, 0, 0.0],
            [-8.2, 0, 3.0],
            [8.2, 0, -2.5],
            [8.2, 0, 2.0]
        ];

        chairPositions.forEach(([x, y, z]) => {
            const chairGroup = new THREE.Group();
            chairGroup.position.set(x, y, z);
            chairGroup.lookAt(0, 0, 0);

            // Seat
            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.7), chairMat);
            seat.position.y = 0.55;
            chairGroup.add(seat);

            // Backrest
            const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.05), chairMat);
            back.position.set(0, 0.95, -0.32);
            chairGroup.add(back);

            // Legs
            const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8);
            const legOffsets = [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]];
            legOffsets.forEach(([lx, lz]) => {
                const leg = new THREE.Mesh(legGeo, chairMat);
                leg.position.set(lx, 0.275, lz);
                chairGroup.add(leg);
            });

            chairGroup.castShadow = true;
            this.scene.add(chairGroup);
        });

        // 4. Heavy Steel Hanging Chains suspended from ceiling ducts
        const chainMat = new THREE.MeshStandardMaterial({
            color: 0x333338,
            metalness: 0.9,
            roughness: 0.25
        });

        const chainPositions = [
            [-4.5, -4.0],
            [4.5, -4.0],
            [-6.5, 4.0],
            [6.5, 4.0]
        ];

        chainPositions.forEach(([cx, cz]) => {
            const chainGeo = new THREE.CylinderGeometry(0.035, 0.035, 3.8, 8);
            const chain = new THREE.Mesh(chainGeo, chainMat);
            chain.position.set(cx, 5.2, cz);
            this.scene.add(chain);
        });
    }

    update(dt) {
        this.flickerTimer += dt;

        // Subtle cheering sway of spectators
        for (const spec of this.crowdMembers) {
            spec.group.rotation.z = Math.sin(this.flickerTimer * spec.speed + spec.phase) * 0.04;
            spec.group.position.y = Math.abs(Math.sin(this.flickerTimer * spec.speed * 1.5 + spec.phase)) * 0.06;
        }

        // Spotlight volumetric beam & floor pool flicker
        if (this.volumetricMaterial) {
            this.volumetricMaterial.uniforms.uTime.value += dt;
            const base = 0.11;
            const wave = Math.sin(this.flickerTimer * 2.8) * 0.015 + Math.cos(this.flickerTimer * 5.7) * 0.008;
            const buzz = Math.random() < 0.02 ? -0.025 : 0;
            const finalOpacity = Math.max(0.06, Math.min(0.16, base + wave + buzz));
            this.volumetricMaterial.uniforms.uOpacity.value = finalOpacity;

            if (this.floorLightPool && this.floorLightPool.material) {
                this.floorLightPool.material.opacity = 0.72 + finalOpacity * 1.4;
            }
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
