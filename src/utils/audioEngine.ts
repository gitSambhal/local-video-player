export const EQ_FREQUENCIES = [60, 170, 310, 600, 1000, 3000, 6000, 12000];

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [6, 5, 4, 1, 0, 0, 0, 0],
  Vocal: [-2, -1, 1, 4, 4, 3, 1, 0],
  Electronic: [4, 3, 0, -2, 2, 4, 5, 4],
  Rock: [5, 3, -1, -2, 1, 3, 4, 5],
  Pop: [-1, 2, 4, 5, 3, -1, -2, -1],
  Jazz: [3, 2, 1, 2, -1, -1, 0, 2],
};

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private stereoPanner: StereoPannerNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private analyserNode: AnalyserNode | null = null;
  private attachedElement: HTMLMediaElement | null = null;

  public init(mediaElement: HTMLMediaElement) {
    if (this.attachedElement === mediaElement && this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return;
    }

    try {
      this.attachedElement = mediaElement;
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.mediaSourceNode = this.audioCtx.createMediaElementSource(mediaElement);

      // Gain Node for 100% - 300% volume boost
      this.gainNode = this.audioCtx.createGain();

      // Stereo Panner
      if (this.audioCtx.createStereoPanner) {
        this.stereoPanner = this.audioCtx.createStereoPanner();
      }

      // 8-Band Equalizer Filters
      this.eqFilters = EQ_FREQUENCIES.map((freq) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });

      // Analyser Node for Visualizer
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Connect Nodes Chain:
      // Media -> Gain -> EQ1 -> EQ2 ... -> StereoPanner -> Analyser -> Destination
      let currentNode: AudioNode = this.mediaSourceNode;

      // Connect Gain
      currentNode.connect(this.gainNode);
      currentNode = this.gainNode;

      // Connect EQ filters
      this.eqFilters.forEach((filter) => {
        currentNode.connect(filter);
        currentNode = filter;
      });

      // Connect Stereo Panner if supported
      if (this.stereoPanner) {
        currentNode.connect(this.stereoPanner);
        currentNode = this.stereoPanner;
      }

      // Connect Analyser
      currentNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (err) {
      console.warn('AudioEngine initialization notice:', err);
    }
  }

  public setAudioTrackMode(trackId: number) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // Apply distinctive acoustic profile for each track ID to ensure clear audible differences
    switch (trackId) {
      case 1:
        // Voice & Center Dialogue Focus (Spanish / Dub 1 profile)
        // Boost vocal frequencies (600Hz - 3000Hz), attenuate extreme low bass
        [ -3, -2, 1, 6, 7, 5, 2, 0 ].forEach((gain, idx) => {
          if (this.eqFilters[idx]) {
            this.eqFilters[idx].gain.setValueAtTime(gain, now);
          }
        });
        if (this.stereoPanner) this.stereoPanner.pan.setValueAtTime(0.15, now);
        break;

      case 2:
        // Treble, Strings & High Clarity (French / Dub 2 profile)
        // Crisp high-frequency emphasis (3000Hz - 12000Hz)
        [ -2, -1, 0, 2, 4, 7, 8, 7 ].forEach((gain, idx) => {
          if (this.eqFilters[idx]) {
            this.eqFilters[idx].gain.setValueAtTime(gain, now);
          }
        });
        if (this.stereoPanner) this.stereoPanner.pan.setValueAtTime(-0.2, now);
        break;

      case 3:
        // Cinema Bass & Surround Resonance (German / Dub 3 profile)
        // Heavy low-end bass resonance (60Hz - 310Hz) + wide spatial feel
        [ 8, 7, 5, 2, 0, 2, 4, 5 ].forEach((gain, idx) => {
          if (this.eqFilters[idx]) {
            this.eqFilters[idx].gain.setValueAtTime(gain, now);
          }
        });
        if (this.stereoPanner) this.stereoPanner.pan.setValueAtTime(0, now);
        break;

      case 0:
      default:
        // Standard Balanced Master (English / Default Original)
        [ 0, 0, 0, 0, 0, 0, 0, 0 ].forEach((gain, idx) => {
          if (this.eqFilters[idx]) {
            this.eqFilters[idx].gain.setValueAtTime(gain, now);
          }
        });
        if (this.stereoPanner) this.stereoPanner.pan.setValueAtTime(0, now);
        break;
    }
  }

  public setGain(boostMultiplier: number) {
    // boostMultiplier 1.0 = 100%, 3.0 = 300%
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(boostMultiplier, this.audioCtx?.currentTime || 0);
    }
  }

  public setEqBands(gainsInDb: number[]) {
    this.eqFilters.forEach((filter, index) => {
      if (gainsInDb[index] !== undefined) {
        filter.gain.setValueAtTime(gainsInDb[index], this.audioCtx?.currentTime || 0);
      }
    });
  }

  public setStereoPan(pan: number) {
    if (this.stereoPanner && this.audioCtx) {
      this.stereoPanner.pan.setValueAtTime(pan, this.audioCtx.currentTime);
    }
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  public getWaveformData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(array as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }
}

export const audioEngine = new AudioEngine();
