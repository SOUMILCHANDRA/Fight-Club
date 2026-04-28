/**
 * @file E:\Fight Club\src\game\MissionManager.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\game\MissionManager.js
 * @description Senior implementation for Project Mayhem.
 */
export class MissionManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.activeMission = null;
    }

    startMission(type) {
        this.activeMission = {
            type, // 'STEALTH' or 'CHAOS'
            timer: type === 'STEALTH' ? 30000 : 15000,
            targets: type === 'CHAOS' ? 5 : 0,
            progress: 0,
            completed: false
        };
        console.log(`Mission started: ${type}`);
    }

    update(deltaTime) {
        if (!this.activeMission) return null;

        this.activeMission.timer -= deltaTime;
        
        if (this.activeMission.timer <= 0) {
            return this.failMission();
        }

        if (this.activeMission.progress >= this.activeMission.targets && this.activeMission.type === 'CHAOS') {
            return this.completeMission();
        }

        return null;
    }

    completeMission() {
        const type = this.activeMission.type;
        this.activeMission = null;
        
        if (type === 'STEALTH') {
            this.gameState.reputation += 20;
            this.gameState.sanity += 10;
        } else {
            this.gameState.reputation += 50;
            this.gameState.policeAttention += 15;
            this.gameState.sanity -= 20;
        }
        
        return { status: 'SUCCESS', type };
    }

    failMission() {
        const type = this.activeMission.type;
        this.activeMission = null;
        this.gameState.sanity -= 15;
        this.gameState.policeAttention += 10;
        return { status: 'FAILED', type };
    }
}

// End of module: E:\Fight Club\src\game\MissionManager.js
