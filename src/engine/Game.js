import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { UIManager } from '../ui/UIManager.js';
import { Input } from '../systems/Input.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { SanitySystem } from '../systems/SanitySystem.js';
import { AssetLoader } from './AssetLoader.js';
import { Arena } from './Arena.js';
import { Effects } from '../effects.js';
import { SoundEngine } from './Audio.js';
import { GameLoop } from '../gameLoop.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        document.body.appendChild(this.renderer.domElement);

        this.ui = new UIManager();
        this.input = new Input(this);
        this.audio = new SoundEngine();

        this.assetLoader = new AssetLoader((progress, url) => {
            this.ui.setLoadingProgress(progress, `LOADING ASSETS (${Math.round(progress)}%)...`);
        });

        this.effects = new Effects(this.scene, this.renderer);
        this.combat = new CombatSystem(this);
        this.sanity = new SanitySystem(this);

        this.entities = [];
        this.enemies = [];
        this.player = null;

        // Debug state (toggled with H key)
        this.debugMode = false;
        this.debugHelpers = new THREE.Group();
        this.debugHelpers.name = 'DebugHelpers';
        this.debugHelpers.visible = false;
        this.scene.add(this.debugHelpers);

        // Camera follow & shake state
        this.shakeIntensity = 0;
        this.cameraLookTarget = new THREE.Vector3();
        this.currentCamPos = new THREE.Vector3(0, 2.2, 5.8);

        // GameLoop integration
        this.gameLoop = new GameLoop(
            (dt) => this.update(dt),
            (dt) => this.render(dt)
        );
    }

    init() {
        // Atmospheric fog & lighting
        this.scene.background = new THREE.Color(0x07070a);
        this.scene.fog = new THREE.FogExp2(0x07070a, 0.04);

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Construct Fight Club Basement Arena
        this.arena = new Arena(this.scene);

        // Spawn iconic soap prop
        this.loadSoap();

        // Initialize Player inside ring facing opponent (Math.PI)
        this.player = new Player(this);
        this.player.mesh.position.set(0, 0, 2.2);
        this.player.mesh.rotation.y = Math.PI;
        this.entities.push(this.player);
        this.scene.add(this.player.mesh);

        // Player Debug BoxHelper
        this.playerBoxHelper = new THREE.BoxHelper(this.player.mesh, 0x00d4ff);
        this.debugHelpers.add(this.playerBoxHelper);

        // Spawn Primary Opponent across the ring
        this.spawnEnemy(new THREE.Vector3(0, 0, -2.5));

        // Initial camera placement
        this.camera.position.set(0, 2.2, 5.8);
        this.camera.lookAt(0, 1.2, 0);

        // Setup Modals & Mobile Touch listeners
        this.setupUIEvents();

        // Window resize event
        window.addEventListener('resize', () => this.onResize());

        // Keyboard listener for Debug Mode (H key)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.toggleDebug();
            }
        });

        // Hide loading screen after warm-up
        setTimeout(() => {
            this.ui.hideLoading();
        }, 1000);

        // Start modular GameLoop
        this.gameLoop.start();
    }

    setupUIEvents() {
        this.ui.initModals(
            () => {
                // On Start button
                if (this.audio) this.audio.init();
            },
            () => {
                // On Restart button
                this.restartFight();
            }
        );

        // Mobile touch controls bindings
        const bindTouch = (id, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.input.keys[key] = true;
                this.input.keys[key.toLowerCase()] = true;
            });
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.input.keys[key] = false;
                this.input.keys[key.toLowerCase()] = false;
            });
        };

        bindTouch('touch-up', 'w');
        bindTouch('touch-down', 's');
        bindTouch('touch-left', 'a');
        bindTouch('touch-right', 'd');
        bindTouch('touch-light', 'j');
        bindTouch('touch-heavy', 'k');
        bindTouch('touch-dodge', ' ');
        bindTouch('touch-block', 'l');
    }

    loadSoap() {
        this.assetLoader.loadModel('/models/soap.glb', 0.4)
            .then((soapScene) => {
                this.soap = soapScene;
                this.soap.position.set(5.5, 0.35, -5.5);
                this.scene.add(this.soap);
            })
            .catch(() => {
                const soapGeo = new THREE.BoxGeometry(0.4, 0.2, 0.25);
                const soapMat = new THREE.MeshStandardMaterial({ color: 0xff3399, roughness: 0.4 });
                this.soap = new THREE.Mesh(soapGeo, soapMat);
                this.soap.position.set(5.5, 0.35, -5.5);
                this.scene.add(this.soap);
            });
    }

    spawnEnemy(position) {
        const enemy = new Enemy(this, position);
        this.entities.push(enemy);
        this.enemies.push(enemy);
        this.scene.add(enemy.mesh);

        // Enemy Debug BoxHelper
        const enemyHelper = new THREE.BoxHelper(enemy.mesh, 0xff0044);
        this.debugHelpers.add(enemyHelper);
        enemy.boxHelper = enemyHelper;
    }

    onEnemyDefeated(enemy) {
        this.ui.showToast('RULE #1 OBSERVED: FIGHT OVER. YOU WIN.', 2500);
        setTimeout(() => {
            this.ui.showGameOver(true);
        }, 1200);
    }

    onGameOver(isVictory) {
        this.ui.showToast('YOU LOST CONSCIOUSNESS.', 2500);
        setTimeout(() => {
            this.ui.showGameOver(false);
        }, 1200);
    }

    restartFight() {
        // Reset player
        if (this.player) {
            this.player.health = this.player.stats[this.player.currentMode].maxHealth;
            this.player.stamina = this.player.stats[this.player.currentMode].maxStamina;
            this.player.isDead = false;
            this.player.animState = 'idle';
            this.player.mesh.position.set(0, 0, 2.2);
            this.player.mesh.rotation.y = Math.PI;
        }

        // Reset sanity
        if (this.sanity) {
            this.sanity.currentSanity = 100;
        }

        // Remove old enemies and spawn fresh opponent
        for (const enemy of this.enemies) {
            this.scene.remove(enemy.mesh);
            if (enemy.boxHelper) this.debugHelpers.remove(enemy.boxHelper);
            const idx = this.entities.indexOf(enemy);
            if (idx !== -1) this.entities.splice(idx, 1);
        }
        this.enemies = [];
        this.spawnEnemy(new THREE.Vector3(0, 0, -2.5));

        this.ui.updatePlayerStats(1, 1, 1);
        this.ui.updateEnemyHealth(1);
        this.ui.showToast('NEW ROUND: FIGHT!');
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        this.debugHelpers.visible = this.debugMode;
        this.ui.showToast(`DEBUG HITBOXES: ${this.debugMode ? 'ENABLED [ON]' : 'DISABLED [OFF]'}`);
    }

    triggerHitStop(duration = 0.05) {
        this.gameLoop.triggerHitStop(duration);
    }

    cameraShake(intensity = 0.35) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(dt) {
        // Update environment & systems
        this.arena.update(dt);
        this.sanity.update(dt);
        this.effects.update(dt, this.sanity.tier, this.sanity.currentSanity);

        // Update entities
        for (const entity of this.entities) {
            entity.update(dt);
        }

        // Update debug helpers if active
        if (this.debugMode) {
            if (this.playerBoxHelper) this.playerBoxHelper.update();
            for (const enemy of this.enemies) {
                if (enemy.boxHelper) enemy.boxHelper.update();
            }
        }

        // Rotate soap prop
        if (this.soap) {
            this.soap.rotation.y += 0.8 * dt;
            this.soap.position.y = 0.35 + Math.sin(performance.now() * 0.0025) * 0.08;
        }

        // Update camera position
        this.updateCamera(dt);

        // Flush input keys
        this.input.update();
    }

    render(dt) {
        this.renderer.render(this.scene, this.camera);
    }

    updateCamera(dt) {
        if (!this.player || !this.player.mesh) return;

        const playerPos = this.player.mesh.position;
        const enemy = this.enemies.find(e => !e.isDead);

        let targetCamPos;
        let lookTarget;

        if (enemy) {
            // Dynamic Fight Framing: Position camera over player's shoulder facing the opponent
            const toEnemy = new THREE.Vector3().subVectors(enemy.mesh.position, playerPos);
            toEnemy.y = 0;
            const dist = toEnemy.length();
            toEnemy.normalize();

            // Right vector for over-the-shoulder offset
            const right = new THREE.Vector3(-toEnemy.z, 0, toEnemy.x);

            const camDist = Math.max(3.0, Math.min(4.8, 2.4 + dist * 0.35));
            targetCamPos = playerPos.clone()
                .addScaledVector(toEnemy, -camDist)
                .addScaledVector(right, 0.7)
                .add(new THREE.Vector3(0, 1.9, 0));

            const midPoint = new THREE.Vector3().addVectors(playerPos, enemy.mesh.position).multiplyScalar(0.5);
            lookTarget = midPoint.add(new THREE.Vector3(0, 1.35, 0));
        } else {
            // Default over-the-shoulder follow
            const playerRotY = this.player.mesh.rotation.y;
            const camOffset = new THREE.Vector3(0.6, 1.9, 3.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY);
            targetCamPos = playerPos.clone().add(camOffset);
            lookTarget = playerPos.clone().add(new THREE.Vector3(0, 1.35, 0));
        }

        // Apply camera shake
        if (this.shakeIntensity > 0) {
            targetCamPos.x += (Math.random() - 0.5) * this.shakeIntensity;
            targetCamPos.y += (Math.random() - 0.5) * this.shakeIntensity;
            targetCamPos.z += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity = Math.max(0, this.shakeIntensity - 3.0 * dt);
        }

        // Smooth camera damping
        this.currentCamPos.lerp(targetCamPos, 7.5 * dt);
        this.cameraLookTarget.lerp(lookTarget, 9.0 * dt);

        this.camera.position.copy(this.currentCamPos);
        this.camera.lookAt(this.cameraLookTarget);
    }
}
