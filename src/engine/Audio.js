/**
 * Audio Engine: Web Audio API synthesis for Project Mayhem.
 * Generates punchy impacts, whooshes, blocks, low-sanity distortion drones,
 * and subterranean room tone without external audio file dependencies.
 */
export class SoundEngine {
    constructor() {
        this.ctx = null;
        this.ambientGain = null;
        this.isMuted = false;
        this.initialized = false;

        // Auto-initialize on first user interaction
        const initAudio = () => {
            if (!this.initialized) {
                this.init();
                window.removeEventListener('keydown', initAudio);
                window.removeEventListener('click', initAudio);
            }
        };
        window.addEventListener('keydown', initAudio);
        window.addEventListener('click', initAudio);
    }

    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
            this.startAmbientDrone();
        } catch (e) {
            console.warn('[Audio] Web Audio API unavailable:', e);
        }
    }

    playWhoosh() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(100, now + 0.18);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.19);
    }

    playHit(intensity = 1.0) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Punch impact tone (pitch drop)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160 * intensity, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.22);

        oscGain.gain.setValueAtTime(0.45 * intensity, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        // Noise crunch layer
        const bufferSize = this.ctx.sampleRate * 0.12;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(600, now);
        noiseFilter.Q.setValueAtTime(1.5, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35 * intensity, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.23);
        noise.start(now);
    }

    playBlock() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    playTylerGlitch() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.08);
        osc.frequency.linearRampToValueAtTime(110, now + 0.2);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
    }

    startAmbientDrone() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Subterranean 55Hz basement hum
        const drone = this.ctx.createOscillator();
        this.ambientGain = this.ctx.createGain();

        drone.type = 'sine';
        drone.frequency.setValueAtTime(55, now);

        this.ambientGain.gain.setValueAtTime(0.06, now);

        drone.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);

        drone.start();
    }
}
