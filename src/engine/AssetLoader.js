import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * AssetLoader handles loading rigged, animated humanoid GLTF/GLB models,
 * bounding-box normalization to 1.8 units, grounding feet at y=0,
 * setting up AnimationMixers, and material theming for fighters.
 */
export class AssetLoader {
    constructor(onProgress = null) {
        this.loadingManager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.loadingManager);
        this.cache = new Map();
        this.onProgress = onProgress;

        if (onProgress) {
            this.loadingManager.onProgress = (url, loaded, total) => {
                const progress = total > 0 ? (loaded / total) * 100 : 100;
                this.onProgress(progress, url);
            };
        }
    }

    /**
     * Loads a rigged humanoid model with AnimationMixer and mapped combat actions.
     * @param {string} url 
     * @param {number} targetHeight 
     * @returns {Promise<{ scene: THREE.Group, model: THREE.Group, mixer: THREE.AnimationMixer, actions: Object, animations: Array }>}
     */
    async loadAnimatedModel(url, targetHeight = 1.8) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    const setup = this.processAnimatedModel(gltf, targetHeight);
                    resolve(setup);
                },
                undefined,
                (error) => {
                    console.warn(`[AssetLoader] Failed to load model at "${url}":`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Processes a loaded GLTF with skeleton, skinned meshes, animations, and scaling.
     */
    processAnimatedModel(gltf, targetHeight = 1.8) {
        const rawScene = gltf.scene;

        // Hide any attached weapons (e.g. Sword mesh in cyberpunk pack)
        rawScene.traverse((child) => {
            if (child.name && (child.name.toLowerCase().includes('sword') || child.name === 'Sword')) {
                child.visible = false;
            }
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material = child.material.clone();
                    child.material.side = THREE.DoubleSide;
                    if (child.material.roughness !== undefined) {
                        child.material.roughness = Math.min(child.material.roughness, 0.65);
                    }
                }
            }
        });

        // Compute bounding box in rest pose
        rawScene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(rawScene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Scale to targetHeight (1.8 units tall)
        const scale = size.y > 0.0001 ? targetHeight / size.y : 1;
        rawScene.scale.setScalar(scale);

        // Center on X/Z and ground feet at Y = 0
        rawScene.position.x = -center.x * scale;
        rawScene.position.y = -box.min.y * scale;
        rawScene.position.z = -center.z * scale;

        // Container wrapper
        const wrapper = new THREE.Group();
        wrapper.name = 'AnimatedModelWrapper';
        wrapper.add(rawScene);

        // Setup AnimationMixer
        const mixer = new THREE.AnimationMixer(rawScene);
        const actions = {};

        // Helper to find clip by fuzzy name
        const findClip = (patterns) => {
            for (const pattern of patterns) {
                const found = gltf.animations.find(a => 
                    a.name.toLowerCase().includes(pattern.toLowerCase())
                );
                if (found) return found;
            }
            return null;
        };

        const clipMap = {
            idle: ['Idle_Sword', 'Idle_Neutral', 'Idle', 'idle'],
            walk: ['Walk', 'walk', 'Walking'],
            run: ['Run', 'run'],
            light_punch: ['Punch_Left', 'Punch', 'punch'],
            heavy_punch: ['Punch_Right', 'Punch_Heavy', 'Punch'],
            kick: ['Kick_Left', 'Kick_Right', 'Kick'],
            block: ['Interact', 'Duck', 'block'],
            dodge: ['Roll', 'roll', 'Dodge'],
            hit: ['HitRecieve', 'HitReact', 'hit'],
            heavy_hit: ['HitRecieve_2', 'HitRecieve', 'hit'],
            ko: ['Death', 'death', 'KO', 'ko']
        };

        for (const [actionName, patterns] of Object.entries(clipMap)) {
            const clip = findClip(patterns);
            if (clip) {
                const action = mixer.clipAction(clip);
                if (['idle', 'walk', 'run', 'block'].includes(actionName)) {
                    action.loop = THREE.LoopRepeat;
                } else {
                    action.loop = THREE.LoopOnce;
                    action.clampWhenFinished = true;
                }
                actions[actionName] = action;
            }
        }

        return {
            wrapper,
            model: rawScene,
            mixer,
            actions,
            animations: gltf.animations,
            box: { size, center, scale }
        };
    }

    /**
     * Applies character theme materials (Narrator, Tyler, or Brawler).
     */
    applyTheme(model, theme = 'rational') {
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                const mat = child.material.clone();
                child.material = mat;

                if (theme === 'rational' || theme === 'narrator') {
                    // Player Rational: Sharp Cyan & Slate palette
                    if (child.name.includes('007') || child.name.includes('Body')) {
                        mat.color.setHex(0xd4e2f4); // light athletic shirt
                        mat.emissive.setHex(0x003344);
                        mat.emissiveIntensity = 0.25;
                    } else if (child.name.includes('009') || child.name.includes('Pants') || child.name.includes('Legs')) {
                        mat.color.setHex(0x1a2432); // dark slate pants
                    } else {
                        // Cyan wrist/hand wraps accent
                        mat.color.setHex(0x00d4ff);
                        mat.emissive.setHex(0x006688);
                        mat.emissiveIntensity = 0.4;
                    }
                } else if (theme === 'tyler') {
                    // Player Tyler: High-voltage Orange / Red leather jacket & gold trim
                    if (child.name.includes('007') || child.name.includes('Body')) {
                        mat.color.setHex(0xff3d00); // fiery orange/red jacket
                        mat.emissive.setHex(0x661100);
                        mat.emissiveIntensity = 0.35;
                    } else if (child.name.includes('009') || child.name.includes('Pants')) {
                        mat.color.setHex(0x15151a); // black combat pants
                    } else {
                        // Gold/amber knuckle & wrist wraps
                        mat.color.setHex(0xffab00);
                        mat.emissive.setHex(0x884400);
                        mat.emissiveIntensity = 0.5;
                    }
                } else if (theme === 'brawler') {
                    // Enemy Brawler: Bruised athletic tone with vivid Crimson / Blood-Red wraps & shorts
                    if (child.name.includes('007') || child.name.includes('Body')) {
                        mat.color.setHex(0x945448); // warm athletic skin tone (highly readable)
                        mat.roughness = 0.6;
                    } else if (child.name.includes('009') || child.name.includes('Pants')) {
                        mat.color.setHex(0x281920); // dark combat trunks
                    } else {
                        // Vivid Crimson / Blood-Red knuckle and ankle accents
                        mat.color.setHex(0xff1744);
                        mat.emissive.setHex(0x880018);
                        mat.emissiveIntensity = 0.45;
                    }
                }
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
