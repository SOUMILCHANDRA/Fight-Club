# Project Mayhem: A Psychological Fight Club Game (3D)

> *"It's only after we've lost everything that we're free to do anything."*

**Project Mayhem** is a 3D psychological brawler built with Three.js and modular ES6. Set inside a dim, subterranean Fight Club basement, you battle your way through brutal underground fights while managing your deteriorating mental sanity and a rising alter ego: **Tyler Durden**.

---

## 🎮 Combat Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Movement** | `W` `A` `S` `D` | Virtual D-Pad |
| **Dodge / Evade** | `SPACE` | `DODGE` Button |
| **Light Jab** | `J` | `JAB` Button |
| **Heavy Haymaker** | `K` | `HIT` Button |
| **Guard / Block** | `L` (Hold) | `GUARD` Button |
| **Alter Ego Shift** | `TAB` | Tap Mode Badge |
| **Hitbox Debug** | `H` | Toggle Bounding Boxes |

---

## 🧠 Core Systems

### 1. Dual Personality System
You navigate between two conflicting mental states:
* **Rational You (The Narrator):** Precise footwork, disciplined defense (75% damage block mitigation), and tactical stamina management.
* **Tyler Durden:** Aggressive forward momentum, +40% movement speed, devastating punch power, raw chaos, and heightened psychological distortion.
* **Automatic Takeover:** If your Sanity drops below **30%**, Tyler seizes control of your body automatically. You must survive and fight through the mania or regain composure through clean blocks and evasions.

### 2. Combat Mechanics
* **Stamina Meter:** Every punch and dodge expends stamina. Blocking reduces stamina regeneration. Exhaustion leaves you vulnerable.
* **Damage Mitigation:** Holding `L` mitigates 75% of incoming damage and rewards bonus sanity upon clean guard impacts.
* **Clean Dodges:** Pressing `SPACE` triggers invulnerability frames and recovers sanity.
* **Hit-Stop & Knockback:** Hits deliver satisfying physical punch impacts with freeze-frame hit-stops, particle sparks, and dynamic camera shake.

### 3. Sanity System & Reality Breakdown
Your mental state dynamically reshapes the world:
* **Stable Tier (> 65%):** Crisp visuals, steady UI, and clear audio.
* **Distorted Tier (30% - 65%):** Subtle UI jitter, camera distortion, and auditory saturation.
* **Critical Tier (< 30%):** Tyler takeover, severe chromatic aberration, ghost opponent flickers, and disorienting input latency.

---

## 🏗 Architecture (Modular ES6)

The project is decoupled into single-responsibility ES6 modules:
* `src/main.js`: Main bootstrap entry point.
* `src/gameLoop.js`: Delta-time calculation, frame clamping, hit-stop timing, and update/render orchestration.
* `src/engine/Game.js`: Core Three.js scene coordinator, camera system, and entity lifecycle.
* `src/engine/AssetLoader.js`: GLTF/GLB loader with dynamic bounding-box normalization, centering, grounding, and humanoid capsule fallbacks.
* `src/engine/Arena.js`: Atmospheric underground basement with concrete walls, industrial pipes, 4-post rope ring, hanging cage lights, and a glowing neon sign.
* `src/engine/Audio.js`: Web Audio API sound synthesis (impacts, whooshes, blocks, glitch tones, and subterranean ambient hum) with zero external audio assets.
* `src/entities/Player.js`: Player controller with dual models (Narrator & Tyler), procedural animations (idle, walk, attack, dodge, block, hit, KO), and stamina/health tracking.
* `src/entities/Enemy.js`: Opponent brawler AI with approach, attack, retreat, block behaviors, and procedural animation reactions.
* `src/systems/CombatSystem.js`: Range and directional cone hit detection, damage calculations, and hit-stop routing.
* `src/systems/SanitySystem.js`: Real-time psychological decay, recovery, and alter ego takeover thresholds.
* `src/systems/Input.js`: Keyboard and touch input abstraction with psychological latency simulation.
* `src/ui/UIManager.js`: Real-time HUD, health, stamina, sanity bars, alter ego badges, start menu, and victory/game-over screens.
* `src/effects.js`: Particle sparks, screen shake, chromatic aberration, and hallucination ghost flickers.

---

## 🚀 Development & Deployment

### Quick Start
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production (Vercel / static hosting)
npm run build
```

---

## 👤 Author

**Soumil Chandra** ([@SOUMILCHANDRA](https://github.com/SOUMILCHANDRA))

---

*“The first rule of Project Mayhem is you do not ask questions.”*
