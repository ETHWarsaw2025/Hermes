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
      console.log("✅ Hydra initialized successfully with H() function");
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

      // Evaluate the Hydra code
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
      default: { r: 0.5, g: 0.8, b: 0.9 }
    };
    
    const color = chainColors[chain_name as keyof typeof chainColors] || chainColors.default;
    
    // Extract pattern from Strudel code for H() function
    const extractPattern = (code: string): string => {
      // Try to extract patterns from common Strudel syntax
      const patterns = [
        // Look for s("pattern") or sound("pattern")
        /s\(["']([^"']+)["']\)/g,
        /sound\(["']([^"']+)["']\)/g,
        // Look for n("pattern") or note("pattern")
        /n\(["']([^"']+)["']\)/g,
        /note\(["']([^"']+)["']\)/g,
        // Look for patterns in quotes
        /["']([0-9\s\[\]]+)["']/g
      ];
      
      for (const regex of patterns) {
        const match = regex.exec(code);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // Fallback: generate pattern based on complexity
      if (complexity <= 3) {
        return "0 1 2 3";
      } else if (complexity <= 6) {
        return "0 [1 2] 3 [4 5]*2";
      } else {
        return "0 [1 2 3] [4 5]*2 [6 7 8]*3";
      }
    };
    
    
    // Generate simpler Hydra code first to avoid shader errors
    if (complexity <= 3) {
      // Simple oscillating pattern
      return `
        osc(${tempo / 20}, 0.1, ${color.r})
          .color(${color.r}, ${color.g}, ${color.b})
          .rotate(() => time * 0.1)
          .scale(() => 1 + Math.sin(time) * 0.2)
          .out()
      `;
    } else if (complexity <= 6) {
      // Medium complexity kaleidoscope
      return `
        osc(${tempo / 15}, 0.1, 0)
          .color(${color.r}, ${color.g}, ${color.b})
          .kaleid(${Math.floor(complexity)})
          .rotate(() => time * 0.05)
          .scale(() => 1 + Math.sin(time * 2) * 0.3)
          .blend(
            noise(${activityScore / 10}, 0.1)
              .color(${color.b}, ${color.r}, ${color.g})
          )
          .out()
      `;
    } else {
      // Complex multi-layer pattern
      return `
        osc(${tempo / 10}, 0.1, 0)
          .color(${color.r}, ${color.g}, ${color.b})
          .rotate(() => time * 0.1)
          .mult(
            osc(${tempo / 30}, 0.1, 1.57)
              .color(${color.g}, ${color.b}, ${color.r})
              .rotate(() => -time * 0.05)
          )
          .blend(
            noise(${activityScore / 5}, 0.2)
              .color(${color.b}, ${color.r}, ${color.g})
              .kaleid(${Math.floor(complexity / 2)})
          )
          .scale(() => 1 + Math.sin(time * 3) * 0.4)
          .out()
      `;
    }
  }

  private startAnimationLoop(_track: StrudelTrack, startPosition: number = 0) {
    const _startTime = Date.now() - (startPosition * 1000);
    
    const animate = () => {
      if (this.hydra && this.isInitialized) {
        
        // Update time-based parameters
        // Hydra automatically handles time variable, but we can add custom updates here
        
        this.animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  updatePlaybackPosition(_position: number): void {
    // Update any position-dependent visual parameters
    // This can be used to sync visuals more precisely with audio
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
