import * as Tone from 'tone';
import { Logger } from '../../utils/Logger';

export class SoundManager {
    private synth!: Tone.PolySynth;
    private notes: string[] = [];
    private logger: Logger;
    private isInitialized = false;
    private initPromise: Promise<void> | null = null;
    private gestureHandlersAttached = false;
    private gestureUnlockHandler?: (e: Event) => void;
    private readonly gestureEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'];

    constructor() {
        this.logger = new Logger('SoundManager');
        // Expand the notes array with more tones
        this.notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];

        // Try to initialize on construction
        this.attemptAutoInit();
        // Ensure we unlock audio on first user gesture across devices
        this.attachUserGestureUnlock();
    }

    private async attemptAutoInit() {
        // Try to initialize if audio context is already allowed
        if (Tone.context.state === 'running') {
            await this.initializeSynth();
        }
    }

    private async initializeSynth(): Promise<void> {
        if (this.isInitialized) return;

        // If already initializing, wait for it
        if (this.initPromise) {
            await this.initPromise;
            return;
        }

        this.initPromise = this.doInitialize();
        await this.initPromise;
    }

    private async doInitialize(): Promise<void> {
        try {
            this.logger.log('Initializing audio context...');

            // Start the audio context
            await Tone.start();

            // Set low latency
            Tone.context.lookAhead = 0.01;
            Tone.context.latencyHint = 'interactive';

            // Create the synthesizer (original soft feel)
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.5
                },
                volume: -12
            }).toDestination();

            this.isInitialized = true;
            this.logger.log('Audio initialized successfully');
            // Once initialized, remove gesture handlers
            this.detachUserGestureUnlock();
        } catch (error) {
            this.logger.error('Error initializing sound manager:', error);
            // Reset promise so we can retry
            this.initPromise = null;
        }
    }

    // Public method to manually initialize audio (for button clicks)
    async initialize(): Promise<void> {
        await this.initializeSynth();
    }

    private attachUserGestureUnlock(): void {
        if (this.gestureHandlersAttached) return;
        this.gestureUnlockHandler = async () => {
            if (this.isInitialized) {
                this.detachUserGestureUnlock();
                return;
            }
            try {
                await this.initializeSynth();
            } catch (e) {
                // ignore, will retry on next gesture
            }
        };
        this.gestureEvents.forEach(evt => {
            window.addEventListener(evt as any, this.gestureUnlockHandler as EventListener, { once: false, passive: true } as any);
        });
        this.gestureHandlersAttached = true;
        this.logger.log('Attached user-gesture unlock handlers for audio');
    }

    private detachUserGestureUnlock(): void {
        if (!this.gestureHandlersAttached) return;
        if (this.gestureUnlockHandler) {
            this.gestureEvents.forEach(evt => {
                window.removeEventListener(evt as any, this.gestureUnlockHandler as EventListener, false);
            });
        }
        this.gestureUnlockHandler = undefined;
        this.gestureHandlersAttached = false;
        this.logger.log('Detached user-gesture unlock handlers');
    }

    async playDotSound(dotIndex: number): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initializeSynth();
            }

            const note = this.getNoteForIndex(dotIndex);
            this.triggerNote(note, '0.2');
        } catch (error) {
            this.logger.error('Error playing dot sound:', error);
        }
    }

    // Distinct phonetic feedback variants
    async playTapSound(index: number): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initializeSynth();
            }
            const note = this.getNoteForIndex(index);
            this.triggerNote(note, '0.18');
        } catch (error) {
            this.logger.error('Error playing tap sound:', error);
        }
    }

    async playHoldSound(index: number): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initializeSynth();
            }
            const note = this.getNoteForIndex(index);
            this.triggerNote(note, '0.5');
        } catch (error) {
            this.logger.error('Error playing hold sound:', error);
        }
    }

    async playRapidSound(index: number): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initializeSynth();
            }
            const note = this.getNoteForIndex(index);
            this.triggerNote(note, '0.08');
        } catch (error) {
            this.logger.error('Error playing rapid sound:', error);
        }
    }

    async playComboSound(comboCount: number): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initializeSynth();
            }

            // Play ascending arpeggio for combos 3+
            if (comboCount >= 3) {
                const baseNoteIndex = Math.min(Math.floor(comboCount / 3), 8);
                const chordNotes = [
                    this.notes[baseNoteIndex],
                    this.notes[baseNoteIndex + 2],
                    this.notes[baseNoteIndex + 4]
                ];

                chordNotes.forEach((note, index) => {
                    this.synth?.triggerAttackRelease(note, '0.3', Tone.now() + (index * 0.1));
                });
            }
        } catch (error) {
            this.logger.error('Error playing combo sound:', error);
        }
    }

    async playMilestoneSound(milestone: number): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initializeSynth();
            }

            // Play celebratory ascending scale
            // Use milestone to shift the start note up slightly for higher milestones
            const startNote = 8 + Math.min(Math.max(milestone, 0), 5); // keep within range
            const scale = [0, 2, 4, 5, 7, 9, 11, 12]; // Major scale

            scale.forEach((offset, index) => {
                const noteIndex = (startNote + offset) % this.notes.length;
                this.synth?.triggerAttackRelease(
                    this.notes[noteIndex],
                    '0.4',
                    Tone.now() + (index * 0.15)
                );
            });
        } catch (error) {
            this.logger.error('Error playing milestone sound:', error);
        }
    }

    async playComboBreakSound(): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initializeSynth();
            }

            // Play descending chromatic notes for "failure" sound
            const breakNotes = ['C5', 'B4', 'Bb4', 'A4'];
            breakNotes.forEach((note, index) => {
                this.synth?.triggerAttackRelease(note, '0.2', Tone.now() + (index * 0.1));
            });
        } catch (error) {
            this.logger.error('Error playing combo break sound:', error);
        }
    }

    async playMenuClick(): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initializeSynth();
            }
            // Short, light click for UI
            this.synth?.triggerAttackRelease('C6', '0.08', Tone.now());
        } catch (error) {
            this.logger.error('Error playing menu click sound:', error);
        }
    }

    // Helpers to keep phonetic mapping consistent and safe
    private getNoteForIndex(index: number): string {
        return this.notes[index % this.notes.length];
    }

    private triggerNote(note: string, duration: string, time: number = Tone.now()): void {
        this.synth?.triggerAttackRelease(note, duration, time);
    }

    cleanup(): void {
        if (this.synth) {
            this.synth.dispose();
        }
        this.isInitialized = false;
        this.attachUserGestureUnlock();
    }
}
