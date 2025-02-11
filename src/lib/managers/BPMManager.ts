import { EventDispatcher } from "three";
import { guess } from "web-audio-beat-detector";

interface BeatEvent extends Event {
  type: "beat";
}

// Add this type to define allowed events
interface BPMManagerEventMap {
  beat: BeatEvent;
}

export default class BPMManager extends EventDispatcher<BPMManagerEventMap> {
  private interval: number;
  private intervalId: ReturnType<typeof setInterval> | null;
  private bpmValue: number;

  constructor() {
    super();
    // Initialization of beat management variables
    this.interval = 500; // Interval for beat events
    this.intervalId = null; // Timer ID for beat interval
    this.bpmValue = 0; // BPM value
  }

  setBPM(bpm: number): void {
    // Sets BPM and starts interval to emit beat events
    this.interval = 60000 / bpm;
    this.bpmValue = bpm;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(this.updateBPM.bind(this), this.interval);
  }

  private updateBPM(): void {
    // Function called at each beat interval
    const event: BeatEvent = { type: "beat" } as BeatEvent;
    this.dispatchEvent(event);
  }

  async detectBPM(audioBuffer: AudioBuffer): Promise<void> {
    try {
      // Analyzes the audio buffer to detect and set BPM
      const { bpm } = await guess(audioBuffer);
      this.setBPM(bpm);
      console.log(`BPM detected: ${bpm}`);
    } catch (error) {
      console.error("Error detecting BPM:", error);
      // Set a default BPM if detection fails
      this.setBPM(120);
    }
  }

  getBPMDuration(): number {
    // Returns the duration of one beat
    return this.interval;
  }

  getBPMValue(): number {
    return this.bpmValue;
  }

  dispose(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
