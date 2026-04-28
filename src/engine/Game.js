/**
 * @file E:\Fight Club\src\engine\Game.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\engine\Game.js
 * @description Senior implementation for Project Mayhem.
 */
import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { UIManager } from '../ui/UIManager.js';
import { Input } from '../systems/Input.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { SanitySystem } from '../systems/SanitySystem.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.domElement.style.border = '2px solid white';
        document.body.appendChild(this.renderer.domElement);
        
        this.ui = new UIManager();
        this.input = new Input();
        this.combat = new CombatSystem(this);
        this.sanity = new SanitySystem(this);
        
        this.clock = new THREE.Clock();
        this.entities = [];
        this.player = null;

        this.shakeIntensity = 0;
    }

    init() {
        // Scene Setup
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.05);

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Lighting (Increased for Debugging)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 5);
        spotLight.position.set(5, 10, 5);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        spotLight.decay = 2;
        spotLight.distance = 50;
        spotLight.castShadow = true;
        this.scene.add(spotLight);

        const pointLight = new THREE.PointLight(0xff3e3e, 1, 10); // Red pulse
        pointLight.position.set(-2, 1, -2);
        this.scene.add(pointLight);

        // Floor (The Arena - Lightened for visibility)
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Grid helper for visual reference
        const grid = new THREE.GridHelper(100, 50, 0x444444, 0x222222);
        this.scene.add(grid);

        // Load the Soap (Collectible/Iconic Item)
        const loader = new GLTFLoader();
        loader.load('/models/soap.glb', (gltf) => {
            this.soap = gltf.scene;
            this.soap.position.set(0, 0.5, 0);
            this.soap.scale.set(0.5, 0.5, 0.5);
            this.scene.add(this.soap);
        });

        // Test Cube
        const testGeo = new THREE.BoxGeometry(2, 2, 2);
        const testMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const testCube = new THREE.Mesh(testGeo, testMat);
        testCube.position.set(0, 1, 0);
        this.scene.add(testCube);

        // Player Initialization
        this.player = new Player(this);
        this.entities.push(this.player);

        // Spawn some enemies
        this.spawnEnemy(new THREE.Vector3(5, 0, -5));
        this.spawnEnemy(new THREE.Vector3(-5, 0, -8));

        // Camera initial position
        this.camera.position.set(0, 5, 10);

        // Events
        window.addEventListener('resize', () => this.onResize());

        // Start Loop
        this.animate();
    }

    spawnEnemy(position) {
        const enemy = new Enemy(this, position);
        this.entities.push(enemy);
        this.scene.add(enemy.mesh);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    cameraShake(intensity = 0.5) {
        this.shakeIntensity = intensity;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();

        // Update systems
        this.sanity.update(deltaTime);

        // Update all entities
        for (const entity of this.entities) {
            entity.update(deltaTime);
        }

        // Rotate soap
        if (this.soap) {
            this.soap.rotation.y += deltaTime;
            this.soap.position.y = 0.5 + Math.sin(this.clock.elapsedTime * 2) * 0.1;
        }

        // Camera follow
        if (this.player && this.player.mesh) {
            const targetPos = this.player.mesh.position.clone();
            const offset = new THREE.Vector3(0, 5, 8);
            
            // Add shake
            if (this.shakeIntensity > 0) {
                offset.x += (Math.random() - 0.5) * this.shakeIntensity;
                offset.y += (Math.random() - 0.5) * this.shakeIntensity;
                this.shakeIntensity *= 0.9; // Decay
                if (this.shakeIntensity < 0.01) this.shakeIntensity = 0;
            }

            this.camera.position.lerp(targetPos.add(offset), 0.1);
            this.camera.lookAt(this.player.mesh.position);
        }

        this.renderer.render(this.scene, this.camera);
        
        // Update input state for next frame
        Object.assign(this.input.prevKeys, this.input.keys);
    }
}

// End of module: E:\Fight Club\src\engine\Game.js
