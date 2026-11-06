import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { UIManager } from '../ui/UIManager.js';
import { Input } from '../systems/Input.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { SanitySystem } from '../systems/SanitySystem.js';
import { PersonalitySystem } from '../systems/PersonalitySystem.js';
import { TylerAI } from '../systems/TylerAI.js';
import { CameraDirector } from '../systems/CameraDirector.js';
import { AssetLoader } from './AssetLoader.js';
import { Arena } from './Arena.js';
import { Effects } from '../effects.js';
import { SoundEngine } from './Audio.js';
import { GameLoop } from '../gameLoop.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        document.body.appendChild(this.renderer.domElement);

        this.ui = new UIManager();
        this.ui.setGame(this);
        this.input = new Input(this);
        this.audio = new SoundEngine();

        this.assetLoader = new AssetLoader((progress, url) => {
            this.ui.setLoadingProgress(progress, `LOADING ASSETS (${Math.round(progress)}%)...`);
        });

        this.effects = new Effects(this.scene, this.renderer);
        this.combat = new CombatSystem(this);
        this.sanity = new SanitySystem(this);
        this.personality = new PersonalitySystem(this);
        this.tylerAI = new TylerAI(this);
        this.cameraDirector = new CameraDirector(this);

        this.entities = [];
        this.enemies = [];
        this.player = null;

        // Debug state (toggled with H key)
        this.debugMode = false;
        this.debugHelpers = new THREE.Group();
        this.debugHelpers.name = 'DebugHelpers';
        this.debugHelpers.visible = false;
        this.scene.add(this.debugHelpers);

        // GameLoop integration
        this.gameLoop = new GameLoop(
            (dt) => this.update(dt),
            (dt) => this.render(dt)
        );
    }

    init() {
        // Atmospheric fog & background
        this.scene.background = new THREE.Color(0x0a0a0e);
        this.scene.fog = new THREE.FogExp2(0x0a0a0e, 0.038);

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Construct Fight Club Basement Arena
        this.arena = new Arena(this.scene);

        // Initialize Player inside ring facing north (Math.PI) ~3 units from opponent
        this.player = new Player(this);
        this.player.mesh.position.set(0, 0, 1.5);
        this.player.mesh.rotation.y = Math.PI;
        this.entities.push(this.player);
        this.scene.add(this.player.mesh);

        this.tylerAI.setPlayer(this.player);

        // Player Debug BoxHelper
        this.playerBoxHelper = new THREE.BoxHelper(this.player.mesh, 0x00d4ff);
        this.debugHelpers.add(this.playerBoxHelper);

        // Spawn Primary Opponent 3 units away across center ring
        this.spawnEnemy(new THREE.Vector3(0, 0, -1.5));

        // Initial camera setup
        this.camera.position.set(3.4, 2.2, 0.0);
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

    onGameOver(isVictory, isTylerTakeoverLoss = false) {
        if (isTylerTakeoverLoss) {
            this.ui.showToast('TYLER WON. YOU LOST.', 3000);
            setTimeout(() => {
                this.ui.showGameOver(false, true);
            }, 1200);
        } else {
            this.ui.showToast('YOU LOST CONSCIOUSNESS.', 2500);
            setTimeout(() => {
                this.ui.showGameOver(false, false);
            }, 1200);
        }
    }

    restartFight() {
        // Reset personality and camera modes
        if (this.personality) {
            this.personality.isTylerAutonomous = false;
            this.personality.setPersona('narrator');
            this.personality.controlMeter = 0;
            this.personality.takeoverTimer = 0;
            this.personality.blackoutCooldown = 25.0 + Math.random() * 15.0;
        }

        if (this.cameraDirector) {
            this.cameraDirector.setMode('fight');
        }

        if (this.ui) {
            this.ui.setTylerTakeoverUI(false);
            this.ui.updatePersonality('narrator');
        }

        // Reset player at starting distance (1.5 units from center)
        if (this.player) {
            this.player.currentMode = 'rational';
            this.player.health = this.player.stats.rational.maxHealth;
            this.player.stamina = this.player.stats.rational.maxStamina;
            this.player.isDead = false;
            this.player.loadModel('rational');
            this.player.playAction('boxing_idle', 0.1);
            this.player.mesh.position.set(0, 0, 1.5);
            this.player.mesh.rotation.y = Math.PI;
            this.player.updateInjuries();
        }

        // Reset sanity
        if (this.sanity) {
            this.sanity.currentSanity = 100;
        }

        // Remove old enemies and spawn fresh opponent 3 units away
        for (const enemy of this.enemies) {
            this.scene.remove(enemy.mesh);
            if (enemy.boxHelper) this.debugHelpers.remove(enemy.boxHelper);
            const idx = this.entities.indexOf(enemy);
            if (idx !== -1) this.entities.splice(idx, 1);
        }
        this.enemies = [];
        this.spawnEnemy(new THREE.Vector3(0, 0, -1.5));

        this.ui.updatePlayerStats(1, 1, 1);
        this.ui.updateEnemyHealth(1);
        this.ui.showToast('NEW ROUND: FIGHT!');
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        this.debugHelpers.visible = this.debugMode;
        this.ui.showToast(`DEBUG HITBOXES: ${this.debugMode ? 'ENABLED [ON]' : 'DISABLED [OFF]'}`);
    }

    triggerHitStop(duration = 0.07) {
        this.gameLoop.triggerHitStop(duration);
    }

    cameraShake(intensity = 0.35) {
        if (this.cameraDirector) {
            this.cameraDirector.shake(intensity);
        }
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
        this.personality.update(dt);
        this.effects.update(dt, this.sanity.tier, this.sanity.currentSanity);

        // Update entities
        for (const entity of this.entities) {
            entity.update(dt);
        }

        // If Tyler is running autonomously, step Tyler AI
        if (this.personality && this.personality.isTylerAutonomous) {
            this.tylerAI.update(dt);
        }

        // Update debug helpers if active
        if (this.debugMode) {
            if (this.playerBoxHelper) this.playerBoxHelper.update();
            for (const enemy of this.enemies) {
                if (enemy.boxHelper) enemy.boxHelper.update();
            }
        }

        // Update cinematic camera
        if (this.cameraDirector) {
            this.cameraDirector.update(dt);
        }

        // Flush input keys
        this.input.update();
    }

    render(dt) {
        this.renderer.render(this.scene, this.camera);
    }
}
