import * as THREE from 'three';

/**
 * Arena: Constructs a full underground Fight Club basement environment.
 * Includes concrete walls, perimeter pipes, an authentic 4-post fighting ring
 * with ropes, hanging cage lamps, and a glowing "PROJECT MAYHEM" neon sign.
 */
export class Arena {
    constructor(scene) {
        this.scene = scene;
        this.hangingLamps = [];
        this.flickerTimer = 0;

        this.buildBasementEnclosure();
        this.buildFightRing();
        this.buildNeonSign();
        this.buildIndustrialProps();
    }

    buildBasementEnclosure() {
        const size = 36;
        const height = 7;

        // Concrete Floor with grunge texture procedural shader/canvas
        const floorGeo = new THREE.PlaneGeometry(size, size);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x16161a,
            roughness: 0.9,
            metalness: 0.15
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Ceiling
        const ceilGeo = new THREE.PlaneGeometry(size, size);
        const ceilMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0d,
            roughness: 0.95,
            metalness: 0.05
        });
        const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
        ceiling.position.y = height;
        ceiling.rotation.x = Math.PI / 2;
        this.scene.add(ceiling);

        // 4 Basement Walls
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a20,
            roughness: 0.92,
            metalness: 0.1
        });

        const half = size / 2;
        const wallConfigs = [
            { pos: [0, height / 2, -half], rot: [0, 0, 0] },          // North
            { pos: [0, height / 2, half], rot: [0, Math.PI, 0] },      // South
            { pos: [-half, height / 2, 0], rot: [0, Math.PI / 2, 0] }, // West
            { pos: [half, height / 2, 0], rot: [0, -Math.PI / 2, 0] }  // East
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
            color: 0x222228,
            roughness: 0.4,
            metalness: 0.7
        });
        const duct = new THREE.Mesh(ductGeo, ductMat);
        duct.position.set(0, height - 0.7, -4);
        this.scene.add(duct);

        // Ceiling Metal Pipes
        const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, size, 8);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
        for (let i = -10; i <= 10; i += 5) {
            const pipe = new THREE.Mesh(pipeGeo, pipeMat);
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(0, height - 0.3, i);
            this.scene.add(pipe);
        }
    }

    buildFightRing() {
        const ringSize = 14;
        const half = ringSize / 2;
        const postHeight = 2.4;

        // Ring Canvas Center Decal (Center Circle)
        const ringCircleGeo = new THREE.RingGeometry(3.8, 4.0, 48);
        const ringCircleMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const ringCircle = new THREE.Mesh(ringCircleGeo, ringCircleMat);
        ringCircle.rotation.x = -Math.PI / 2;
        ringCircle.position.y = 0.015;
        this.scene.add(ringCircle);

        // Ring Square Boundary Line
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
        const linePoints = [
            new THREE.Vector3(-half, 0.02, -half),
            new THREE.Vector3(half, 0.02, -half),
            new THREE.Vector3(half, 0.02, half),
            new THREE.Vector3(-half, 0.02, half),
            new THREE.Vector3(-half, 0.02, -half)
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
        const ringLine = new THREE.Line(lineGeo, lineMat);
        this.scene.add(ringLine);

        // 4 Heavy Corner Posts
        const postGeo = new THREE.CylinderGeometry(0.12, 0.14, postHeight, 16);
        const postMat = new THREE.MeshStandardMaterial({
            color: 0x1f1f1f,
            metalness: 0.7,
            roughness: 0.3
        });

        const corners = [
            [-half, -half],
            [half, -half],
            [half, half],
            [-half, half]
        ];

        corners.forEach(([x, z]) => {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(x, postHeight / 2, z);
            post.castShadow = true;
            this.scene.add(post);

            // Corner Pad (Fight Club red & black)
            const padGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
            const padMat = new THREE.MeshStandardMaterial({
                color: (x < 0 ? 0xff1744 : 0x111111),
                roughness: 0.6
            });
            const pad = new THREE.Mesh(padGeo, padMat);
            pad.position.set(x, 1.2, z);
            this.scene.add(pad);
        });

        // 3 Tiers of Ring Ropes
        const ropeHeights = [0.65, 1.15, 1.65];
        const ropeColors = [0xdddddd, 0xff1744, 0x111111];

        ropeHeights.forEach((h, idx) => {
            const ropeMat = new THREE.MeshStandardMaterial({
                color: ropeColors[idx],
                roughness: 0.7
            });

            // 4 segments of rope
            for (let i = 0; i < 4; i++) {
                const [x1, z1] = corners[i];
                const [x2, z2] = corners[(i + 1) % 4];

                const length = ringSize;
                const ropeGeo = new THREE.CylinderGeometry(0.035, 0.035, length, 8);
                const rope = new THREE.Mesh(ropeGeo, ropeMat);

                // Position midpoint
                rope.position.set((x1 + x2) / 2, h, (z1 + z2) / 2);

                // Align along edge
                if (x1 === x2) {
                    rope.rotation.x = Math.PI / 2;
                } else {
                    rope.rotation.z = Math.PI / 2;
                }
                rope.castShadow = true;
                this.scene.add(rope);
            }
        });

        // Overhead Hanging Cage Lamp above the ring
        this.createHangingLamp(0, 6.0, 0);
    }

    createHangingLamp(x, y, z) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        // Suspension cable
        const cableGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.5, 6);
        const cableMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const cable = new THREE.Mesh(cableGeo, cableMat);
        cable.position.y = 1.25;
        group.add(cable);

        // Lamp Shade / Cage
        const shadeGeo = new THREE.ConeGeometry(0.45, 0.35, 12, 1, true);
        const shadeMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.8,
            roughness: 0.3,
            side: THREE.DoubleSide
        });
        const shade = new THREE.Mesh(shadeGeo, shadeMat);
        shade.rotation.x = Math.PI;
        group.add(shade);

        // Bulb
        const bulbGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        group.add(bulb);

        // SpotLight pointing down at the ring
        const spot = new THREE.SpotLight(0xffeedd, 40);
        spot.position.set(0, 0, 0);
        spot.angle = Math.PI / 3.2;
        spot.penumbra = 0.55;
        spot.decay = 1.6;
        spot.distance = 25;
        spot.castShadow = true;
        spot.shadow.mapSize.width = 1024;
        spot.shadow.mapSize.height = 1024;
        group.add(spot);

        this.scene.add(group);
        this.hangingLamps.push({ group, spot, baseIntensity: 40 });
    }

    buildNeonSign() {
        // Glowing Neon sign on North Wall (PROJECT MAYHEM)
        const signGroup = new THREE.Group();
        signGroup.position.set(0, 4.5, -17.85);

        // Metal backing bracket
        const bracketGeo = new THREE.BoxGeometry(8.5, 1.8, 0.15);
        const bracketMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0e,
            metalness: 0.8,
            roughness: 0.5
        });
        const bracket = new THREE.Mesh(bracketGeo, bracketMat);
        signGroup.add(bracket);

        // Create canvas texture for sharp glowing neon text
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Draw neon glow
        ctx.fillStyle = '#08080c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        ctx.font = 'bold 84px "Inter", "Space Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer glow
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff2a85';
        ctx.fillText('PROJECT MAYHEM', canvas.width / 2, canvas.height / 2);

        // Inner core
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PROJECT MAYHEM', canvas.width / 2, canvas.height / 2);

        const neonTex = new THREE.CanvasTexture(canvas);
        const neonGeo = new THREE.PlaneGeometry(8.2, 1.5);
        const neonMat = new THREE.MeshBasicMaterial({
            map: neonTex,
            transparent: true
        });
        const neonMesh = new THREE.Mesh(neonGeo, neonMat);
        neonMesh.position.z = 0.09;
        signGroup.add(neonMesh);

        // Hot pink neon point light casting illumination onto the fighters & floor
        this.neonPointLight = new THREE.PointLight(0xff0066, 25, 22);
        this.neonPointLight.position.set(0, 4.5, -16.5);
        this.scene.add(this.neonPointLight);

        this.scene.add(signGroup);
    }

    buildIndustrialProps() {
        // Wooden Crates in basement corners
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.85 });
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

        // Metal Oil Drum / Barrels
        const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16);
        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0x1f2937,
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
        // Subtle sway of hanging cage lamp
        this.flickerTimer += dt;
        for (const lamp of this.hangingLamps) {
            lamp.group.rotation.z = Math.sin(this.flickerTimer * 1.5) * 0.025;
            lamp.group.rotation.x = Math.cos(this.flickerTimer * 1.1) * 0.02;

            // Occasional electrical micro-flicker for authentic dirty power
            if (Math.random() < 0.02) {
                lamp.spot.intensity = lamp.baseIntensity * (0.65 + Math.random() * 0.35);
            } else {
                lamp.spot.intensity = lamp.baseIntensity;
            }
        }

        // Neon sign pulse
        if (this.neonPointLight) {
            this.neonPointLight.intensity = 25 + Math.sin(this.flickerTimer * 3.5) * 4;
            if (Math.random() < 0.015) {
                this.neonPointLight.intensity = 8; // quick buzz dip
            }
        }
    }
}
