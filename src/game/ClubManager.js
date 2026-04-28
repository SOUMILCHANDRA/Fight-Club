/**
 * @file E:\Fight Club\src\game\ClubManager.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\game\ClubManager.js
 * @description Senior implementation for Project Mayhem.
 */
export class ClubManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.members = [];
        this.maxMembers = 10;
        
        // Initial recruitment
        this.addMember("Bob", 80, 50, 10);
    }

    addMember(name, loyalty, aggression, instability) {
        if (this.members.length < this.maxMembers) {
            this.members.push({
                name,
                loyalty,
                aggression,
                instability,
                status: 'IDLE' // IDLE, MISSION, TRAINING
            });
            return true;
        }
        return false;
    }

    trainMember(index) {
        const member = this.members[index];
        if (member) {
            member.loyalty += 5;
            member.aggression += 2;
            member.instability -= 1;
            this.clampStats(member);
        }
    }

    removeMember(index) {
        this.members.splice(index, 1);
    }

    clampStats(member) {
        member.loyalty = Math.max(0, Math.min(100, member.loyalty));
        member.aggression = Math.max(0, Math.min(100, member.aggression));
        member.instability = Math.max(0, Math.min(100, member.instability));
    }

    processRandomEvents() {
        this.members.forEach((member, index) => {
            const roll = Math.random() * 100;
            
            // Betrayal logic
            if (member.loyalty < 20 && roll < 5) {
                console.warn(`${member.name} has betrayed the club!`);
                this.removeMember(index);
                this.gameState.policeAttention += 20;
            }
            
            // Disobedience
            if (member.instability > 70 && roll < 10) {
                console.warn(`${member.name} is causing trouble in the club.`);
                this.gameState.sanity -= 5;
            }
        });
    }
}

// End of module: E:\Fight Club\src\game\ClubManager.js

// Module finalized by SOUMILCHANDRA
