import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * AssetLoader handles GLTF loading, bounding-box normalization,
 * shadow/material configuration, and capsule fallback generation.
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
     * Loads a GLTF/GLB model from URL.
     * @param {string} url
     * @returns {Promise<THREE.Group>} Normalized clone of the scene
     */
    async loadModel(url, targetHeight = 1.85) {
        if (this.cache.has(url)) {
          return this.cache.get(url).clone(true);
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    const normalized = this.normalizeModel(gltf.scene, targetHeight);
                    this.cache.set(url, normalized);
                    resolve(normalized.clone(true));
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
     * Normalizes a model so that it is scaled to targetHeight,
     * centered on X and Z, and grounded at Y = 0.
     * @param {THREE.Object3D} scene 
     * @param {number} targetHeight 
     * @returns {THREE.Group}
     */
    normalizeModel(scene, targetHeight = 1.85) {
        // Force world matrix calculation
        scene.updateMatrixWorld(true);

        const wrapper = new THREE.Group();
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const scale = (size.y > 0.0001) ? targetHeight / size.y : 1;
        scene.scale.setScalar(scale);

        // Shift so bottom is exactly at Y = 0 and center X/Z is at 0
        scene.position.x = -center.x * scale;
        scene.position.y = -box.min.y * scale;
        scene.position.z = -center.z * scale;

        // Traverse to set shadows and enhance materials
        scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => this.enhanceMaterial(m));
                    } else {
                        this.enhanceMaterial(child.material);
                    }
                }
            }
        });

        wrapper.add(scene);
        return wrapper;
    }

    enhanceMaterial(material) {
        material.side = THREE.DoubleSide;
        if (material.roughness !== undefined) {
            material.roughness = Math.min(material.roughness, 0.7);
        }
        if (material.metalness !== undefined) {
            material.metalness = Math.min(material.metalness, 0.2);
        }
        material.needsUpdate = true;
    }

    /**
     * Creates a fallback humanoid capsule mesh if GLB fails to load.
     * @param {number} color 
     * @param {number} height 
     * @returns {THREE.Group}
     */
    createCapsuleFallback(color = 0x00ffff, height = 1.85, name = 'Fighter') {
        const group = new THREE.Group();
        group.name = `${name}_FallbackCapsule`;

        // Body capsule (radius 0.32, total length 1.25)
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

        // Headband / Visor stripe to show direction of facing
        const visorGeo = new THREE.BoxGeometry(0.45, 0.1, 0.3);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, height * 0.85, -radius * 0.8);
        group.add(visor);

        return group;
    }
}
