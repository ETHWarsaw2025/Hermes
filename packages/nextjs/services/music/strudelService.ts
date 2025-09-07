import { MusicService } from "~~/types/hermes";

class StrudelMusicService implements MusicService {
  private strudel: any = null;
  private isCurrentlyPlaying: boolean = false;
  private currentPattern: any = null;
  private currentCode: string = "";
  private isInitialized: boolean = false;
  private playbackPosition: number = 0;
  private playbackInterval: NodeJS.Timeout | null = null;
  private onPositionUpdate: ((position: number) => void) | null = null;

  constructor() {
    // Don't initialize in constructor - wait for first use
  }

  private async initializeStrudel() {
    try {
      // Check if we're in browser environment
      if (typeof window === "undefined") {
        console.log("⏳ Strudel initialization deferred - waiting for browser environment");
        return;
      }

      // Dynamically import Strudel web package to avoid SSR issues
      const { initStrudel } = await import("@strudel/web");

      // Initialize Strudel
      this.strudel = await initStrudel();
      this.isInitialized = true;
      console.log("✅ Strudel initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Strudel:", error);
      // Don't throw error during SSR, just log it
      if (typeof window !== "undefined") {
        throw new Error("Failed to initialize audio engine");
      }
    }
  }

  async play(strudelCode: string): Promise<void> {
    try {
      if (!this.isInitialized || !this.strudel) {
        await this.initializeStrudel();
      }

      if (!this.strudel) {
        throw new Error("Failed to initialize Strudel audio engine");
      }

      // Stop any currently playing pattern
      if (this.strudel && this.isCurrentlyPlaying) {
        try {
          this.strudel.evaluate("silence");
        } catch (error) {
          console.warn("Error stopping previous pattern:", error);
        }
      }

      // Clear any existing playback tracking
      this.clearPlaybackTracking();

      // Store the code and evaluate it
      this.currentCode = strudelCode;
      console.log("Evaluating Strudel code:", strudelCode);
      this.currentPattern = this.strudel.evaluate(strudelCode);
      console.log("Pattern created:", this.currentPattern);

      this.isCurrentlyPlaying = true;

      // Start playback position tracking
      this.startPlaybackTracking();

      console.log("Playing Strudel pattern:", strudelCode);
    } catch (error) {
      console.error("Error playing Strudel pattern:", error);
      throw new Error(`Failed to play audio: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  pause(): void {
    try {
      if (this.isCurrentlyPlaying && this.strudel) {
        // Try to pause/stop the audio
        try {
          if (typeof this.strudel.hush === 'function') {
            this.strudel.hush();
          } else {
            this.strudel.evaluate("silence");
          }
        } catch (e) {
          console.warn("Failed to pause audio:", e);
        }
        
        this.isCurrentlyPlaying = false;
        this.clearPlaybackTracking();
        console.log("Paused Strudel pattern");
      }
    } catch (error) {
      console.error("Error pausing Strudel pattern:", error);
    }
  }

  stop(): void {
    try {
      if (this.strudel) {
        // Try multiple methods to stop Strudel
        try {
          // Method 1: Use hush() if available - this should stop all patterns
          if (typeof this.strudel.hush === 'function') {
            this.strudel.hush();
            console.log("Used strudel.hush() to stop");
          } else if (this.strudel.eval && typeof this.strudel.eval === 'function') {
            // Alternative: evaluate hush command
            this.strudel.eval('hush()');
            console.log("Evaluated hush() command");
          }
        } catch (e) {
          console.warn("hush() not available:", e);
        }
        
        try {
          // Method 2: Evaluate silence
          this.strudel.evaluate("silence");
          console.log("Evaluated silence");
        } catch (e) {
          console.warn("silence evaluation failed:", e);
        }
        
        try {
          // Method 3: Try to stop the scheduler if available
          if (this.strudel.scheduler && typeof this.strudel.scheduler.stop === 'function') {
            this.strudel.scheduler.stop();
            console.log("Stopped scheduler");
          }
        } catch (e) {
          console.warn("scheduler.stop() not available:", e);
        }
        
        try {
          // Method 4: Try global stop if available
          if (typeof this.strudel.stop === 'function') {
            this.strudel.stop();
            console.log("Used strudel.stop()");
          }
        } catch (e) {
          console.warn("strudel.stop() not available:", e);
        }
        
        try {
          // Method 5: Try to access global window context
          if (typeof window !== 'undefined' && (window as any).hush) {
            (window as any).hush();
            console.log("Used global window.hush()");
          }
        } catch (e) {
          console.warn("global hush() not available:", e);
        }
        
        try {
          // Method 6: Try to clear all intervals and timeouts
          if (typeof window !== 'undefined') {
            // Clear all intervals (Strudel uses setInterval for scheduling)
            const highestIntervalId = (window as any).setInterval(() => {}, 0);
            for (let i = 0; i < highestIntervalId; i++) {
              (window as any).clearInterval(i);
            }
            console.log("Cleared all intervals");
          }
        } catch (e) {
          console.warn("Failed to clear intervals:", e);
        }
        
        try {
          // Method 7: Try to stop all Web Audio contexts
          if (typeof window !== 'undefined' && (window as any).AudioContext) {
            // This is a more aggressive approach - suspend all audio contexts
            const audioContexts = (window as any).__strudelAudioContexts || [];
            audioContexts.forEach((ctx: any) => {
              if (ctx && typeof ctx.suspend === 'function') {
                ctx.suspend();
                console.log("Suspended audio context");
              }
            });
          }
        } catch (e) {
          console.warn("Failed to suspend audio contexts:", e);
        }
      }
      
      this.currentPattern = null;
      this.currentCode = "";
      this.isCurrentlyPlaying = false;
      this.clearPlaybackTracking();
      this.playbackPosition = 0;
      console.log("Stopped Strudel pattern");
    } catch (error) {
      console.error("Error stopping Strudel pattern:", error);
    }
  }

  isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  // Additional utility methods
  resume(): void {
    try {
      if (this.currentCode && !this.isCurrentlyPlaying) {
        // Re-evaluate the original code to resume
        this.strudel.evaluate(this.currentCode);
        this.isCurrentlyPlaying = true;
        this.startPlaybackTracking();
        console.log("Resumed Strudel pattern");
      }
    } catch (error) {
      console.error("Error resuming Strudel pattern:", error);
    }
  }

  getCurrentPattern(): any {
    return this.currentPattern;
  }

  // Playback position tracking methods
  private startPlaybackTracking(): void {
    this.clearPlaybackTracking();
    this.playbackPosition = 0;

    // Update position every 100ms for smooth cursor movement
    this.playbackInterval = setInterval(() => {
      if (this.isCurrentlyPlaying) {
        this.playbackPosition += 0.1; // Increment by 0.1 seconds
        if (this.onPositionUpdate) {
          this.onPositionUpdate(this.playbackPosition);
        }
      }
    }, 100);
  }

  private clearPlaybackTracking(): void {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  // Set callback for position updates
  setOnPositionUpdate(callback: (position: number) => void): void {
    this.onPositionUpdate = callback;
  }

  // Get current playback position
  getPlaybackPosition(): number {
    return this.playbackPosition;
  }

  // Cleanup method
  destroy(): void {
    this.clearPlaybackTracking();
    if (this.strudel && this.isCurrentlyPlaying) {
      // Stop by evaluating silence
      try {
        this.strudel.evaluate("silence");
      } catch (error) {
        console.warn("Error stopping pattern during cleanup:", error);
      }
    }
    this.currentPattern = null;
    this.currentCode = "";
    this.isCurrentlyPlaying = false;
    this.playbackPosition = 0;
  }
}

// Export class only - create instance when needed
export { StrudelMusicService };

// Factory function to create instance only when needed
export const createStrudelMusicService = () => new StrudelMusicService();
