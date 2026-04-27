/**
 * Project Mayhem: Mission System
 * Handles active missions and their objectives.
 */
export class MissionSystem {
    constructor() {
        this.activeMission = null;
    }

    start(type) {
        this.activeMission = {
            type: type, // STEALTH or CHAOS
            timer: type === 'STEALTH' ? 60000 : 30000,
            targets: 5,
            progress: 0
        };
    }

    update(deltaTime) {
        if (!this.activeMission) return;
        this.activeMission.timer -= deltaTime;
        
        if (this.activeMission.timer <= 0) {
            this.activeMission = null; // Mission failed
        }
    }
}
