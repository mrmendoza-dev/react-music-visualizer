import * as THREE from "three";
import type { GUI } from "dat.gui";

export interface Song {
  url: string;
  title?: string;
  artist?: string;
}

export interface FrequencyRanges {
  lowFrequency: number;
  midFrequency: number;
  highFrequency: number;
}

export default class AudioManager {
  private frequencyArray: number[];
  private frequencyData: {
    low: number;
    mid: number;
    high: number;
  };
  public isPlaying: boolean;
  private frequencyRanges: FrequencyRanges;
  private smoothedLowFrequency: number;
  private audioContext: AudioContext | null;
  private audio: THREE.Audio | any;
  private audioAnalyser: THREE.AudioAnalyser | null;
  private bufferLength: number | null;
  private currentSong: Song;
  private gui: GUI | null = null;
  private monitorValues: { low: number; mid: number; high: number };

  constructor(initialSong?: Song) {
    this.audio = null;
    this.audioAnalyser = null;
    this.bufferLength = null;
    this.frequencyArray = [];
    this.frequencyData = {
      low: 0,
      mid: 0,
      high: 0,
    };
    this.monitorValues = {
      low: 0,
      mid: 0,
      high: 0,
    };
    this.isPlaying = false;
    this.frequencyRanges = {
      lowFrequency: 10,
      midFrequency: 150,
      highFrequency: 9000,
    };
    this.smoothedLowFrequency = 0;
    this.audioContext = null;

    this.currentSong = initialSong || {
      url: "/src/data/crystal-teardrops.mp3",
      title: "Crystal Teardrops",
    };
  }

  initGUI(gui: GUI) {
    this.gui = gui;
    const audioFolder = gui.addFolder("FREQUENCY RANGES");

    // Frequency range controls
    audioFolder
      .add(this.frequencyRanges, "lowFrequency", 1, 100, 1)
      .name("Low Freq (Hz)")
      .onChange(() => {
        this.updateFrequencyRanges();
      });

    audioFolder
      .add(this.frequencyRanges, "midFrequency", 100, 1000, 10)
      .name("Mid Freq (Hz)")
      .onChange(() => {
        this.updateFrequencyRanges();
      });

    audioFolder
      .add(this.frequencyRanges, "highFrequency", 1000, 20000, 100)
      .name("High Freq (Hz)")
      .onChange(() => {
        this.updateFrequencyRanges();
      });

    // Monitor folder
    const monitors = audioFolder.addFolder("Frequency Monitors");

    // Add monitor controls
    monitors.add(this.monitorValues, "low").name("Low Band").listen();

    monitors.add(this.monitorValues, "mid").name("Mid Band").listen();

    monitors.add(this.monitorValues, "high").name("High Band").listen();

    // Open folders by default
    // audioFolder.open();
    // monitors.open();
  }
  async loadSong(song: Song) {
    this.currentSong = song;
    await this.loadAudioBuffer();
  }

  async loadAudioBuffer() {
    // Load the audio file and create the audio buffer
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        const audioListener = new THREE.AudioListener();
        this.audio = new THREE.Audio(audioListener);
        const audioLoader = new THREE.AudioLoader();

        audioLoader.load(
          this.currentSong.url,
          (buffer) => {
            this.audio.setBuffer(buffer);
            this.audio.setLoop(true);
            this.audio.setVolume(0.5);
            this.audioContext = this.audio.context;
            this.audioAnalyser = new THREE.AudioAnalyser(this.audio, 1024);
            this.bufferLength = this.audioAnalyser.data.length;
            resolve();
          },
          // Progress callback
          (progress: any) => {
            console.log(`Loading: ${Math.round(progress * 100)}%`);
          },
          // Error callback
          (error: any) => {
            console.error("Error loading audio:", error);
            reject(error);
          }
        );
      } catch (error) {
        console.error("Error in loadAudioBuffer:", error);
        reject(error);
      }
    });

    return promise;
  }

  getCurrentSong(): Song {
    return this.currentSong;
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.setVolume(Math.max(0, Math.min(1, volume)));
    }
  }

  getVolume(): number {
    return this.audio ? this.audio.getVolume() : 0;
  }

  play() {
    if (this.audio && this.audioContext) {
      this.audio.play();
      this.isPlaying = true;
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.audio) {
      this.audio.stop();
      this.isPlaying = false;
    }
  }

  collectAudioData() {
    if (this.audioAnalyser) {
      this.frequencyArray = Array.from(this.audioAnalyser.getFrequencyData());
    }
  }

  private updateFrequencyRanges() {
    if (this.isPlaying) {
      this.analyzeFrequency();
    }
  }

  private updateMonitors() {
    if (this.monitorValues) {
      this.monitorValues.low = this.frequencyData.low;
      this.monitorValues.mid = this.frequencyData.mid;
      this.monitorValues.high = this.frequencyData.high;
    }
  }

  analyzeFrequency() {
    if (!this.audioContext || !this.bufferLength || !this.frequencyArray.length)
      return;

    const { lowFrequency, midFrequency, highFrequency } = this.frequencyRanges;

    // Calculate ranges based on frequency values
    const lowFreqRangeStart = Math.floor(
      (lowFrequency * this.bufferLength) / this.audioContext.sampleRate
    );
    const lowFreqRangeEnd = Math.floor(
      (midFrequency * this.bufferLength) / this.audioContext.sampleRate
    );
    const midFreqRangeStart = lowFreqRangeEnd;
    const midFreqRangeEnd = Math.floor(
      (highFrequency * this.bufferLength) / this.audioContext.sampleRate
    );
    const highFreqRangeStart = midFreqRangeEnd;
    const highFreqRangeEnd = this.bufferLength - 1;

    // Calculate averages for each frequency band
    const lowAvg = this.normalizeValue(
      this.calculateAverage(
        this.frequencyArray,
        lowFreqRangeStart,
        lowFreqRangeEnd
      )
    );
    const midAvg = this.normalizeValue(
      this.calculateAverage(
        this.frequencyArray,
        midFreqRangeStart,
        midFreqRangeEnd
      )
    );
    const highAvg = this.normalizeValue(
      this.calculateAverage(
        this.frequencyArray,
        highFreqRangeStart,
        highFreqRangeEnd
      )
    );

    // Update frequency data
    this.frequencyData = {
      low: lowAvg,
      mid: midAvg,
      high: highAvg,
    };

    // Update monitor values
    this.updateMonitors();
  }

  calculateAverage(array: number[], start: number, end: number): number {
    let sum = 0;
    for (let i = start; i <= end; i++) {
      sum += array[i];
    }
    return sum / (end - start + 1);
  }

  normalizeValue(value: number): number {
    // Assuming the frequency values are in the range 0-256 (for 8-bit data)
    return value / 256;
  }

  getFrequencyData() {
    return this.frequencyData;
  }

  update() {
    if (!this.isPlaying) return;

    this.collectAudioData();
    this.analyzeFrequency();
  }
}
