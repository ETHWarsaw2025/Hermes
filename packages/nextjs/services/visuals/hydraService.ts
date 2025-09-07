import { StrudelTrack } from "~~/types/hermes";

class HydraVisualsService {
  private hydra: any = null;
  private canvas: HTMLCanvasElement | null = null;
  private isInitialized: boolean = false;
  private currentVisual: string = "";
  private animationFrame: number | null = null;

  constructor() {
    // Don't initialize in constructor - wait for first use
  }

  private async initializeHydra(canvas: HTMLCanvasElement) {
    try {
      // Check if we're in browser environment
      if (typeof window === "undefined") {
        console.log("⏳ Hydra initialization deferred - waiting for browser environment");
        return;
      }

      // Dynamically import Hydra to avoid SSR issues
      const Hydra = await import("hydra-synth");

      // Initialize Hydra with the canvas
      this.hydra = new Hydra.default({
        canvas: canvas,
        detectAudio: false, // We'll sync manually with Strudel
        enableStreamCapture: false,
      });

      // Initialize the H() function for pattern integration
      await this.initializeHFunction();

      this.canvas = canvas;
      this.isInitialized = true;
      console.log("✅ Hydra initialized successfully, testing basic pattern...");
      
      // Test with a simple pattern to verify it works
      this.hydra.eval("osc(10, 0.1, 0.5).color(0.5, 0.8, 1.0).out()");
      console.log("✅ Basic Hydra test pattern applied");
    } catch (error) {
      console.error("Failed to initialize Hydra:", error);
      if (typeof window !== "undefined") {
        throw new Error("Failed to initialize visual engine");
      }
    }
  }

  private async initializeHFunction(): Promise<void> {
    try {
      // For now, skip the H() function to avoid shader compilation issues
      // We'll implement basic pattern-driven visuals without the H() function
      console.log("✅ Hydra initialized with basic pattern support");
    } catch (error) {
      console.warn("Failed to initialize H() function:", error);
    }
  }

  async startVisuals(canvas: HTMLCanvasElement, track: StrudelTrack, playbackPosition: number = 0): Promise<void> {
    try {
      if (!this.isInitialized || !this.hydra) {
        await this.initializeHydra(canvas);
      }

      if (!this.hydra) {
        throw new Error("Failed to initialize Hydra visual engine");
      }

      // Generate visuals based on track characteristics
      const visual = this.generateVisualFromTrack(track);
      this.currentVisual = visual;

      console.log("🎨 Generated Hydra code for", track.chain_name, ":");
      console.log(visual);

      // Apply the generated visual directly
      console.log("🎨 Applying Strudel-based visual...");
      this.hydra.eval(visual);

      // Start animation loop for dynamic parameters
      this.startAnimationLoop(track, playbackPosition);

      console.log("🎨 Started Hydra visuals for track:", track.id);
    } catch (error) {
      console.error("Error starting Hydra visuals:", error);
      throw new Error(`Failed to start visuals: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private generateVisualFromTrack(track: StrudelTrack): string {
    const { musical_parameters, source_kpis, chain_name, strudel_code_string } = track;

    // Extract pattern information from Strudel code
    const patternInfo = this.extractPatternInfo(strudel_code_string);
    console.log("🎵 Pattern info for", chain_name, ":", patternInfo);
    
    // Map musical parameters to visual parameters
    const tempo = musical_parameters.tempo;
    const complexity = musical_parameters.complexity;
    const activityScore = source_kpis.network_activity_score;

    // Color based on chain
    const chainColors = {
      ethereum: { r: 0.4, g: 0.6, b: 1.0 },
      bitcoin: { r: 1.0, g: 0.6, b: 0.0 },
      polygon: { r: 0.8, g: 0.4, b: 1.0 },
      arbitrum: { r: 0.2, g: 0.8, b: 1.0 },
      optimism: { r: 1.0, g: 0.2, b: 0.2 },
      base: { r: 0.0, g: 0.4, b: 1.0 },
      default: { r: 0.5, g: 0.8, b: 0.9 },
    };

    const color = chainColors[chain_name as keyof typeof chainColors] || chainColors.default;

    // Generate visuals based on Strudel pattern characteristics
    return this.generatePatternBasedVisual(patternInfo, color, tempo, complexity, activityScore);
  }

  private extractPatternInfo(strudelCode: string) {
    const info = {
      cps: 1,
      notePattern: "<0 1 2 3 4>",
      scale: "major",
      noteCount: 5,
      hasJux: false,
      hasRoom: false,
      hasLpf: false,
      hasHpf: false,
      hasClip: false,
      hasSometimes: false,
      multiplier: 8,
      instrument: "gm_lead_6_voice",
      // Enhanced pattern analysis
      baseNote: "C4",
      roomAmount: 2,
      slowAmount: 8,
      rangeMin: 0.2,
      rangeMax: 0.8,
      filterRange: [200, 20000],
      addNote: "12"
    };

    // Extract setcps value
    const cpsMatch = strudelCode.match(/setcps\(([0-9.]+)\)/);
    if (cpsMatch) info.cps = parseFloat(cpsMatch[1]);

    // Extract note pattern with better parsing
    const noteMatch = strudelCode.match(/n\("([^"]+)"\)/);
    if (noteMatch) {
      info.notePattern = noteMatch[1];
      // Count unique notes in pattern
      const noteNumbers = noteMatch[1].match(/\d+/g);
      if (noteNumbers) {
        info.noteCount = [...new Set(noteNumbers)].length; // Unique notes only
      }
      // Extract multiplier
      const multMatch = noteMatch[1].match(/\*(\d+)/);
      if (multMatch) info.multiplier = parseInt(multMatch[1]);
    }

    // Extract scale with base note
    const scaleMatch = strudelCode.match(/scale\('([^']+)'\)/);
    if (scaleMatch) {
      const scaleInfo = scaleMatch[1];
      info.scale = scaleInfo.includes('minor') ? 'minor' : 'major';
      // Extract base note (e.g., "C4", "D4", "G4")
      const noteMatch = scaleInfo.match(/([A-G][#b]?[0-9])/);
      if (noteMatch) info.baseNote = noteMatch[1];
    }

    // Extract instrument
    const instrumentMatch = strudelCode.match(/s\("([^"]+)"\)/);
    if (instrumentMatch) info.instrument = instrumentMatch[1];

    // Extract room amount
    const roomMatch = strudelCode.match(/\.room\(([0-9.]+)\)/);
    if (roomMatch) info.roomAmount = parseFloat(roomMatch[1]);

    // Extract clip range
    const clipMatch = strudelCode.match(/\.range\(([0-9.]+),([0-9.]+)\)/);
    if (clipMatch) {
      info.rangeMin = parseFloat(clipMatch[1]);
      info.rangeMax = parseFloat(clipMatch[2]);
    }

    // Extract slow amount
    const slowMatch = strudelCode.match(/\.slow\(([0-9.]+)\)/);
    if (slowMatch) info.slowAmount = parseFloat(slowMatch[1]);

    // Extract filter range
    const filterMatch = strudelCode.match(/\.(?:lpf|hpf)\(perlin\.range\(([0-9.]+),([0-9.]+)\)/);
    if (filterMatch) {
      info.filterRange = [parseFloat(filterMatch[1]), parseFloat(filterMatch[2])];
    }

    // Extract add note
    const addMatch = strudelCode.match(/add\(note\("([^"]+)"\)\)/);
    if (addMatch) info.addNote = addMatch[1];

    // Check for effects
    info.hasJux = strudelCode.includes('.jux(');
    info.hasRoom = strudelCode.includes('.room(');
    info.hasLpf = strudelCode.includes('.lpf(');
    info.hasHpf = strudelCode.includes('.hpf(');
    info.hasClip = strudelCode.includes('.clip(');
    info.hasSometimes = strudelCode.includes('.sometimes(');

    return info;
  }

  private generatePatternBasedVisual(patternInfo: any, color: any, tempo: number, complexity: number, activityScore: number): string {
    const { 
      cps, noteCount, multiplier, hasJux, hasRoom, hasLpf, hasHpf, hasClip, hasSometimes, scale,
      roomAmount, slowAmount, rangeMin, rangeMax, filterRange, baseNote, addNote
    } = patternInfo;
    
    // Base frequency based on CPS and note count
    const baseFreq = Math.max(0.1, cps * (noteCount / 4));
    const oscSpeed = Math.max(0.1, baseFreq * (multiplier / 8));
    
    // Scale-based color variations
    const scaleColorMod = scale === 'minor' ? 0.8 : 1.2;
    const r = Math.min(1, Math.max(0, color.r * scaleColorMod));
    const g = Math.min(1, Math.max(0, color.g * scaleColorMod));
    const b = Math.min(1, Math.max(0, color.b * scaleColorMod));

    // Start with a simple, reliable base pattern
    let visual = `osc(${oscSpeed.toFixed(2)}, 0.1, ${r.toFixed(2)}).color(${r.toFixed(2)}, ${g.toFixed(2)}, ${b.toFixed(2)})`;

    // Add rotation based on note pattern
    visual += `.rotate(() => time * ${(cps * 0.1).toFixed(2)})`;

    // Add scale based on clip range from Strudel
    if (hasClip) {
      const scaleAmount = (rangeMax - rangeMin) * 0.5; // Use actual Strudel clip range
      visual += `.scale(() => ${rangeMin.toFixed(2)} + Math.sin(time * ${(cps * slowAmount / 4).toFixed(2)}) * ${scaleAmount.toFixed(2)})`;
    } else {
      visual += `.scale(() => 1 + Math.sin(time * ${cps.toFixed(2)}) * 0.2)`;
    }

    // Add kaleidoscope based on note count
    if (noteCount > 4) {
      visual += `.kaleid(${Math.min(noteCount, 8)})`;
    }

    // Add jux effect as visual symmetry (simplified)
    if (hasJux) {
      visual += `.mult(osc(${(oscSpeed * 0.5).toFixed(2)}, 0.1, 1.57).color(${g.toFixed(2)}, ${b.toFixed(2)}, ${r.toFixed(2)}))`;
    }

    // Add room effect based on actual Strudel room amount
    if (hasRoom) {
      const roomIntensity = roomAmount / 3; // Normalize room amount (0-3 range)
      visual += `.blend(noise(${(roomIntensity * 2).toFixed(2)}, ${(roomIntensity * 0.2).toFixed(2)}).color(${(b * roomIntensity).toFixed(2)}, ${(r * roomIntensity).toFixed(2)}, ${(g * roomIntensity).toFixed(2)}))`;
    }

    // Add filter effects based on actual Strudel filter ranges
    if (hasLpf) {
      const filterSpeed = filterRange[1] / 10000; // Normalize high frequency range
      visual += `.modulate(noise(${filterSpeed.toFixed(2)}, 0.1))`;
    }

    if (hasHpf) {
      const pixelSize = Math.max(2, Math.min(20, Math.floor(noteCount * 2)));
      visual += `.pixelate(${pixelSize}, ${pixelSize})`;
    }

    // Add sometimes effect based on the add note parameter
    if (hasSometimes) {
      const addNoteValue = parseInt(addNote) || 12;
      const shapeComplexity = Math.min(noteCount + (addNoteValue / 12), 8);
      visual += `.blend(shape(${shapeComplexity.toFixed(0)}, 0.3, 0.1).color(${b.toFixed(2)}, ${g.toFixed(2)}, ${r.toFixed(2)}).scale(() => 1 + Math.sin(time * ${(cps * 2).toFixed(2)}) * 0.3))`;
    }

    visual += `.out()`;

    return visual;
  }

  private startAnimationLoop(_track: StrudelTrack, _startPosition: number = 0) {

    const animate = () => {
      if (this.hydra && this.isInitialized) {
        // Update time-based parameters
        // Hydra automatically handles time variable, but we can add custom updates here

        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    animate();
  }

  updatePlaybackPosition(position: number): void {
    this.currentPlaybackPosition = position;
    
    // Update visuals based on playback position
    if (this.hydra && this.currentTrack) {
      // Create dynamic visual updates based on position
      const beatPosition = position % (60 / (this.currentTrack.musical_parameters.tempo / 60)); // Beat sync
      
      // Update visual parameters dynamically
      if (beatPosition < 0.1) { // On beat
        console.log("🎵 Beat detected, updating visuals");
        // Could trigger visual effects on beat
      }
    }
  }

  pause(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    console.log("⏸️ Paused Hydra visuals");
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.hydra) {
      // Clear the canvas
      this.hydra.eval("solid(0, 0, 0).out()");
    }

    this.currentVisual = "";
    console.log("⏹️ Stopped Hydra visuals");
  }

  resume(track: StrudelTrack, position: number): void {
    if (this.hydra && this.currentVisual) {
      // Re-evaluate the visual
      this.hydra.eval(this.currentVisual);
      this.startAnimationLoop(track, position);
      console.log("▶️ Resumed Hydra visuals");
    }
  }

  isRunning(): boolean {
    return this.animationFrame !== null;
  }

  getCurrentVisual(): string {
    return this.currentVisual;
  }

  // Cleanup method
  destroy(): void {
    this.stop();
    if (this.hydra) {
      // Clean up Hydra instance if possible
      this.hydra = null;
    }
    this.canvas = null;
    this.isInitialized = false;
  }
}

// Factory function to create instance only when needed
export const createHydraVisualsService = () => new HydraVisualsService();

// Export class for testing
export { HydraVisualsService };
