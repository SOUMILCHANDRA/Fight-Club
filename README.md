# Project Mayhem: A Psychological Fight Club Game

> "It's only after we've lost everything that we're free to do anything."

**Project Mayhem** is a system-driven psychological simulation that explores the thin line between liberation and self-destruction. This is not just a combat game; it is a loss-of-control simulator where your greatest enemy is the person staring back at you in the mirror.

---

## 🎮 Core Game Loop: The Cycle of Collapse

The game operates on a self-feeding system of escalation:
1. **🥊 Fight:** Earn respect and attract recruits through brutal, high-stakes combat.
2. **🧠 Mental Shift:** Personality conflicts alter gameplay mechanics in real-time.
3. **👥 Expand Club:** Recruit and train members, building an army of the disenfranchised.
4. **🕵️ Run Missions:** Execute sabotage, stealth, and chaos-driven operations.
5. **⚠️ Consequences:** Navigate the fallout—police pressure, internal instability, and betrayal.
6. **🔁 Repeat:** The world and your mind evolve with every cycle.

---

## 🧠 Core Systems

### 1. Dual Personality Mechanic
The game is a constant conflict between two internal forces:
*   **Rational You:** Precise combat, tactical planning, stealth-focused, and a stable UI.
*   **Tyler Persona:** Brutal combos, ignores pain, causes uncontrolled chaos, and distorts the interface.
*   *The Twist:* Control can shift without your input. Eventually, the distinction between "you" and "him" vanishes.

### 2. Combat & Damage Realism
No health bars. No HUD hand-holding.
*   **Stamina-Based:** Every swing and hit matters.
*   **Visible Injuries:** Bruises, cuts, and breaks affect your performance.
*   **Reaction Slowdown:** Physical trauma slows your response time, making every mistake potentially fatal.

### 3. Sanity: The Difficulty Modifier
Your mental state dynamically reshapes the game world:
*   **High Sanity:** Clean UI, predictable combat, reliable reality.
*   **Medium Sanity:** Visual glitches, aggression boosts, auditory hallucinations.
*   **Low Sanity:** Fake enemies, input delays, random environmental events. The game begins to lie to you.

### 4. Mission Architectures
*   **Stealth (Rational):** Sabotage corporations and plant the seeds of chaos from the shadows.
*   **Destruction (Tyler):** Loud, aggressive, and chaotic missions designed to tear down the system.

### 5. Club Management (The Risk Engine)
Recruit NPCs with individual traits:
*   **Loyalty / Aggression / Instability:** Manage your followers carefully. They may disobey, escalate violence unnecessarily, or expose the club to the authorities.

### 6. Reality Breakdown Narrative
The story is non-linear, branching based on your sanity, combat record, and choices.
*   **Possible Endings:** Regain control, be fully consumed by the persona, or discover a truth that reveals the entire world as a fabrication.

---

## 🚀 Development Roadmap (MVP)

### Phase 1: The Foundation
*   Basic Fight Arena & 1 Enemy Type
*   Personality Switching Mechanic
*   Core Sanity Meter Implementation

### Phase 2: Expansion
*   First Mission Type (Sabotage)
*   Basic Recruitment & Loyalty System

### Phase 3: The Narrative
*   Consequence System (Police/Heat)
*   Branching Narrative & Reality Breakdown Events

## 🏗 Architecture (Modular ES6)
The project is built with a system-first approach, using decoupled modules for high performance and extensibility:
*   `main.js`: Bootstraps systems.
*   `gameLoop.js`: Delta-time orchestration.
*   `sanitySystem.js`: Mental state tiers.
*   `effects.js`: Canvas distortions and particles.

---

*“The first rule of Project Mayhem is you do not ask questions.”*
*v1.0.4-BETA*

## System Status: COMPLETED
