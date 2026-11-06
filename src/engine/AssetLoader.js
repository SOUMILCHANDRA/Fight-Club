import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * Creates an organic tattoo texture for the underground Brawler.
 */
function createTattooTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Weathered athletic bruised skin base
    ctx.fillStyle = '#9e5a48';
    ctx.fillRect(0, 0, 512, 512);

    // Tribal / Underground Fight Tattoos in dark oxidized ink
    ctx.strokeStyle = 'rgba(20, 20, 28, 0.72)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        const y = 60 + i * 36;
        ctx.moveTo(30, y);
        ctx.bezierCurveTo(160, y - 28, 280, y + 35, 480, y);
        ctx.stroke();
    }

    // Heavy black sleeve bands
    ctx.fillStyle = 'rgba(16, 16, 22, 0.75)';
    ctx.fillRect(25, 260, 462, 30);
    ctx.fillRect(50, 320, 412, 18);
    ctx.fillRect(90, 365, 332, 14);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

/**
 * Creates dynamic blood and bruise decal texture for Narrator.
 */
function createBloodDecalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, 256, 256);

    // Blood splatters & deep purple contusions
    ctx.fillStyle = 'rgba(140, 10, 25, 0.85)';
    ctx.beginPath();
    ctx.arc(128, 80, 24, 0, Math.PI * 2);
    ctx.arc(160, 130, 16, 0, Math.PI * 2);
    ctx.arc(90, 150, 20, 0, Math.PI * 2);
    ctx.fill();

    // Drips
    ctx.strokeStyle = 'rgba(120, 8, 20, 0.85)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(128, 80);
    ctx.lineTo(128, 170);
    ctx.moveTo(160, 130);
    ctx.lineTo(164, 210);
    ctx.stroke();

    // Bruise shadow (purple/blue)
    const grad = ctx.createRadialGradient(85, 75, 4, 85, 75, 38);
    grad.addColorStop(0, 'rgba(40, 15, 60, 0.75)');
    grad.addColorStop(0.6, 'rgba(90, 20, 40, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(85, 75, 38, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

/**
 * AssetLoader handles loading rigged, animated humanoid GLTF/GLB models,
 * bounding-box normalization to 1.8 units, grounding feet at y=0,
 * cloning skeletons via SkeletonUtils for multiple independent fighters,
 * building accessories (Narrator tie/shirt, Tyler shades/jacket, Brawler tattoos),
 * and mapping the full combat animation state machine.
 */
export class AssetLoader {
    constructor(onProgress = null) {
        this.loadingManager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.loadingManager);
        this.cachedGltf = null;
        this.onProgress = onProgress;

        if (onProgress) {
            this.loadingManager.onProgress = (url, loaded, total) => {
                const progress = total > 0 ? (loaded / total) * 100 : 100;
                this.onProgress(progress, url);
            };
        }
    }

    /**
     * Resolves a clean Vite/Vercel safe asset path.
     */
    resolveAssetPath(path) {
        const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
        const cleanBase = base.endsWith('/') ? base : base + '/';
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return cleanBase + cleanPath;
    }

    /**
     * Loads the base humanoid rigged GLTF model once and caches it.
     */
    async loadBaseModel(url = '/models/fighter.glb') {
        if (this.cachedGltf) {
            return this.cachedGltf;
        }

        const safeUrl = this.resolveAssetPath(url);

        return new Promise((resolve, reject) => {
            this.loader.load(
                safeUrl,
                (gltf) => {
                    this.cachedGltf = gltf;
                    resolve(gltf);
                },
                (xhr) => {
                    if (this.onProgress && xhr.total > 0) {
                        this.onProgress((xhr.loaded / xhr.total) * 100, safeUrl);
                    }
                },
                (error) => {
                    console.warn(`[AssetLoader] Failed to load model at "${safeUrl}":`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Instantiates an independent rigged humanoid fighter using SkeletonUtils.clone.
     * @param {string} theme 'narrator' | 'tyler' | 'brawler'
     * @param {number} targetHeight Height in units (default 1.8)
     */
    async loadAnimatedModel(url = '/models/fighter.glb', targetHeight = 1.8, theme = 'narrator') {
        const gltf = await this.loadBaseModel(url);
        return this.createFighterInstance(gltf, targetHeight, theme);
    }

    /**
     * Clones skeleton and skinned meshes, normalizes scale, grounds feet,
     * attaches human accessories, and configures AnimationMixer.
     */
    createFighterInstance(gltf, targetHeight = 1.8, theme = 'narrator') {
        // Clone full skinned mesh hierarchy with bound skeleton bones
        const clonedScene = cloneSkeleton(gltf.scene);

        // Hide attached weapons (cyberpunk blade)
        clonedScene.traverse((child) => {
            if (child.name && (child.name.toLowerCase().includes('sword') || child.name === 'Sword')) {
                child.visible = false;
            }
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material = child.material.clone();
                    child.material.side = THREE.DoubleSide;
                }
            }
        });

        // Compute rest bounding box
        clonedScene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Target height normalization (Brawler is slightly bulkier at 1.9)
        const adjustedHeight = theme === 'brawler' ? targetHeight * 1.06 : targetHeight;
        const scale = size.y > 0.0001 ? adjustedHeight / size.y : 1;
        clonedScene.scale.setScalar(scale);

        // Center on X/Z and ground feet precisely on the ring floor at Y = 0
        clonedScene.position.x = -center.x * scale;
        clonedScene.position.y = -box.min.y * scale;
        clonedScene.position.z = -center.z * scale;

        // Container wrapper
        const wrapper = new THREE.Group();
        wrapper.name = `HumanoidFighter_${theme}`;
        wrapper.add(clonedScene);

        // Build human accessories (hair, loosened tie, sunglasses, tattoos, blood decals)
        const accessoryData = this.buildHumanAccessories(clonedScene, theme);

        // Apply realistic materials
        this.applyTheme(clonedScene, theme);

        // Setup AnimationMixer on cloned scene
        const mixer = new THREE.AnimationMixer(clonedScene);
        const actions = {};

        const findClip = (patterns) => {
            for (const pattern of patterns) {
                const found = gltf.animations.find(a => 
                    a.name.toLowerCase().includes(pattern.toLowerCase())
                );
                if (found) return found;
            }
            return null;
        };

        // Complete 16-state Fight Club animation map
        const clipMap = {
            boxing_idle: ['Idle_Sword', 'Idle_Neutral', 'Idle'],
            idle: ['Idle_Sword', 'Idle_Neutral', 'Idle'],
            walk: ['Walk', 'walk', 'Walking'],
            run: ['Run', 'run'],
            jab: ['Punch_Left', 'Punch'],
            cross: ['Punch_Right', 'Punch_Heavy', 'Punch'],
            hook: ['Sword_Slash', 'Punch_Right', 'Punch'],
            block: ['Interact', 'Duck', 'block'],
            dodge: ['Roll', 'roll', 'Dodge'],
            hit_light: ['HitRecieve', 'HitReact', 'hit'],
            hit_heavy: ['HitRecieve_2', 'HitRecieve'],
            stagger: ['HitRecieve_2', 'HitRecieve'],
            knockdown: ['Death', 'death', 'KO'],
            get_up: ['Roll', 'Interact'],
            ko: ['Death', 'death', 'KO'],
            taunt: ['Wave', 'Interact'],
            pained_laugh: ['Interact', 'Wave']
        };

        for (const [actionName, patterns] of Object.entries(clipMap)) {
            const clip = findClip(patterns);
            if (clip) {
                const action = mixer.clipAction(clip);
                if (['boxing_idle', 'idle', 'walk', 'run', 'block'].includes(actionName)) {
                    action.loop = THREE.LoopRepeat;
                } else {
                    action.loop = THREE.LoopOnce;
                    action.clampWhenFinished = true;
                }
                actions[actionName] = action;
            }
        }

        // Backward-compatible aliases for existing combat code
        actions.light_punch = actions.jab || actions.idle;
        actions.heavy_punch = actions.cross || actions.idle;
        actions.hit = actions.hit_light || actions.idle;
        actions.heavy_hit = actions.hit_heavy || actions.idle;

        return {
            wrapper,
            model: clonedScene,
            mixer,
            actions,
            animations: gltf.animations,
            box: { size, center, scale },
            accessoryData
        };
    }

    /**
     * Builds realistic human anatomical accessories attached directly to skeleton bones.
     */
    buildHumanAccessories(clonedScene, theme) {
        const headBone = clonedScene.getObjectByName('Head');
        const neckBone = clonedScene.getObjectByName('Neck');
        const chestBone = clonedScene.getObjectByName('Chest');
        const data = { bloodDecal: null, tieMesh: null, glassesMesh: null };

        if (theme === 'narrator' || theme === 'rational') {
            // 1. Narrator Short Parted Hair
            if (headBone) {
                const hairGeo = new THREE.SphereGeometry(0.19, 12, 10);
                hairGeo.scale(1.05, 0.85, 1.15);
                const hairMat = new THREE.MeshStandardMaterial({
                    color: 0x221812, // Dark brown hair
                    roughness: 0.9,
                    metalness: 0.05
                });
                const hair = new THREE.Mesh(hairGeo, hairMat);
                hair.position.set(0, 0.12, -0.02);
                headBone.add(hair);

                // Narrator Bruised Face Decal
                const decalGeo = new THREE.PlaneGeometry(0.24, 0.24);
                const decalMat = new THREE.MeshBasicMaterial({
                    map: createBloodDecalTexture(),
                    transparent: true,
                    opacity: 0.0, // starts clean, builds up on damage
                    depthWrite: false
                });
                const bloodDecal = new THREE.Mesh(decalGeo, decalMat);
                bloodDecal.position.set(0, 0.05, 0.18);
                headBone.add(bloodDecal);
                data.bloodDecal = bloodDecal;
            }

            // 2. Office Shirt Loosened Tie
            if (neckBone || chestBone) {
                const parentBone = neckBone || chestBone;
                const tieGroup = new THREE.Group();

                // Unbuttoned collar band
                const collarGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 16);
                const collarMat = new THREE.MeshStandardMaterial({ color: 0xeeeff4, roughness: 0.8 });
                const collar = new THREE.Mesh(collarGeo, collarMat);
                collar.rotation.x = Math.PI / 2;
                tieGroup.add(collar);

                // Loosened silk necktie
                const tieGeo = new THREE.BoxGeometry(0.065, 0.42, 0.02);
                const tieMat = new THREE.MeshStandardMaterial({
                    color: 0x182033, // Navy blue office tie
                    roughness: 0.55
                });
                const tie = new THREE.Mesh(tieGeo, tieMat);
                tie.position.set(0, -0.22, 0.12);
                tie.rotation.x = 0.15; // hangs slightly forward
                tieGroup.add(tie);

                parentBone.add(tieGroup);
                data.tieMesh = tieGroup;
            }
        } else if (theme === 'tyler') {
            // 1. Tyler Spiky Blonde/Red Hair
            if (headBone) {
                const hairGeo = new THREE.DodecahedronGeometry(0.20, 1);
                hairGeo.scale(1.1, 0.95, 1.2);
                const hairMat = new THREE.MeshStandardMaterial({
                    color: 0x8a5526, // Dirty blonde / messy reddish hair
                    roughness: 0.85
                });
                const hair = new THREE.Mesh(hairGeo, hairMat);
                hair.position.set(0, 0.13, -0.02);
                headBone.add(hair);

                // 2. Tyler Red Aviator Sunglasses
                const glassesGroup = new THREE.Group();
                const frameGeo = new THREE.BoxGeometry(0.26, 0.07, 0.05);
                const frameMat = new THREE.MeshStandardMaterial({
                    color: 0xd4af37, // Gold wireframe
                    metalness: 0.9,
                    roughness: 0.2
                });
                const frame = new THREE.Mesh(frameGeo, frameMat);
                glassesGroup.add(frame);

                const lensGeo = new THREE.BoxGeometry(0.10, 0.06, 0.02);
                const lensMat = new THREE.MeshStandardMaterial({
                    color: 0xff0033, // Iconic Fight Club red-tinted lenses
                    roughness: 0.1,
                    metalness: 0.1,
                    transparent: true,
                    opacity: 0.85
                });
                const leftLens = new THREE.Mesh(lensGeo, lensMat);
                leftLens.position.set(-0.065, 0, 0.02);
                const rightLens = new THREE.Mesh(lensGeo, lensMat);
                rightLens.position.set(0.065, 0, 0.02);
                glassesGroup.add(leftLens);
                glassesGroup.add(rightLens);

                glassesGroup.position.set(0, 0.07, 0.18);
                headBone.add(glassesGroup);
                data.glassesMesh = glassesGroup;
            }
        } else if (theme === 'brawler') {
            // Brawler: Bald head with prominent scarred brow
            if (headBone) {
                const browGeo = new THREE.BoxGeometry(0.24, 0.05, 0.08);
                const browMat = new THREE.MeshStandardMaterial({ color: 0x9e5a48, roughness: 0.65 });
                const brow = new THREE.Mesh(browGeo, browMat);
                brow.position.set(0, 0.09, 0.15);
                headBone.add(brow);
            }
        }

        return data;
    }

    /**
     * Applies character theme materials (Narrator, Tyler, or Brawler).
     */
    applyTheme(model, theme = 'narrator') {
        const tattooTex = theme === 'brawler' ? createTattooTexture() : null;

        model.traverse((child) => {
            if (child.isMesh && child.material) {
                const mat = new THREE.MeshStandardMaterial();
                mat.side = THREE.DoubleSide;

                if (theme === 'narrator' || theme === 'rational') {
                    // Narrator: White office shirt, rolled-up sleeves, dark slacks
                    if (child.name.includes('007') || child.name.includes('Body')) {
                        // Shirt torso & upper arms
                        mat.color.setHex(0xf4f5f8);
                        mat.roughness = 0.82;
                        mat.metalness = 0.04;
                    } else if (child.name.includes('009') || child.name.includes('Pants') || child.name.includes('Legs')) {
                        // Dark office slacks
                        mat.color.setHex(0x1f232b);
                        mat.roughness = 0.88;
                        mat.metalness = 0.02;
                    } else {
                        // Exposed forearm / knuckle skin
                        mat.color.setHex(0xdeb098);
                        mat.roughness = 0.68;
                    }
                } else if (theme === 'tyler') {
                    // Tyler: Red leather jacket, black slacks, gold accents
                    if (child.name.includes('007') || child.name.includes('Body')) {
                        mat.color.setHex(0xb81622); // Red leather jacket
                        mat.roughness = 0.38;
                        mat.metalness = 0.12;
                    } else if (child.name.includes('009') || child.name.includes('Pants')) {
                        mat.color.setHex(0x111115); // Black tailored trousers
                        mat.roughness = 0.75;
                    } else {
                        // Gold/amber knuckle & wrist wraps
                        mat.color.setHex(0xffab00);
                        mat.emissive.setHex(0x664400);
                        mat.emissiveIntensity = 0.35;
                        mat.roughness = 0.55;
                    }
                } else if (theme === 'brawler') {
                    // Brawler: Heavily tattooed athletic bare torso, dark fight trunks, crimson wraps
                    if (child.name.includes('007') || child.name.includes('Body')) {
                        mat.map = tattooTex;
                        mat.color.setHex(0xffffff);
                        mat.roughness = 0.62;
                        mat.metalness = 0.05;
                    } else if (child.name.includes('009') || child.name.includes('Pants')) {
                        mat.color.setHex(0x1e1d24); // Dark combat trunks
                        mat.roughness = 0.85;
                    } else {
                        // Blood-red heavy hand wraps
                        mat.color.setHex(0xa81424);
                        mat.emissive.setHex(0x550810);
                        mat.emissiveIntensity = 0.35;
                        mat.roughness = 0.7;
                    }
                }

                child.material = mat;
            }
        });
    }

    /**
     * Creates a fallback humanoid capsule mesh if GLB fails to load.
     */
    createCapsuleFallback(color = 0x00d4ff, height = 1.8, name = 'Fighter') {
        const group = new THREE.Group();
        group.name = `${name}_FallbackCapsule`;

        const radius = 0.32;
        const length = height - radius * 2;
        const geo = new THREE.CapsuleGeometry(radius, Math.max(0.2, length), 16, 32);
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.5,
            metalness: 0.1
        });
        const body = new THREE.Mesh(geo, mat);
        body.position.y = height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const visorGeo = new THREE.BoxGeometry(0.45, 0.1, 0.3);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, height * 0.85, -radius * 0.8);
        group.add(visor);

        return group;
    }
}
