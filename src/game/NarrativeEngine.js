/**
 * @file E:\Fight Club\src\game\NarrativeEngine.js
 * @author SOUMILCHANDRA <SOUMILCHANDRA@GMAIL.COM>
 * @description Senior implementation for Project Mayhem.
 * @version 1.0.0
 */
/**
 * @file E:\Fight Club\src\game\NarrativeEngine.js
 * @description Senior implementation for Project Mayhem.
 */
export class NarrativeEngine {
    constructor() {
        this.dialogues = {
            STABLE: [
                "Everything is under control. The club is growing.",
                "Stay focused. The plan is working.",
                "We are the middle children of history, raised by television to believe that one day we'd all be millionaires."
            ],
            GLITCHY: [
                "The static is getting louder, isn't it?",
                "They are watching. Or maybe they are just shadows.",
                "You're not your job. You're not how much money you have in the bank."
            ],
            DISTORTED: [
                "ERROR: REALITY_BUFFER_OVERFLOW. Please restart the simulation.",
                "I see you watching me through the screen. Stop looking.",
                "Is this a game to you? To me, it's everything."
            ],
            HALLUCINATING: [
                "WAKE UP. WAKE UP. WAKE UP.",
                "01011001 01001111 01010101 00100000 01000001 01010010 01000101 00100000 01000111 01001100 01001001 01010100 01000011 01001000",
                "This isn't your code. This is our blood."
            ]
        };
    }

    getRandomDialogue(tier) {
        const pool = this.dialogues[tier] || this.dialogues.STABLE;
        return pool[Math.floor(Math.random() * pool.length)];
    }
}

// End of module: E:\Fight Club\src\game\NarrativeEngine.js
