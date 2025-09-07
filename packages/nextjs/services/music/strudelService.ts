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
      if (this.currentPattern) {
        this.currentPattern.stop();
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
      if (this.isCurrentlyPlaying) {
        // Try to stop all patterns by evaluating silence
        this.strudel.evaluate("silence");
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
      if (this.currentPattern) {
        // Stop by evaluating silence
        this.strudel.evaluate("silence");
        this.currentPattern = null;
        this.isCurrentlyPlaying = false;
        this.clearPlaybackTracking();
        this.playbackPosition = 0;
        console.log("Stopped Strudel pattern");
      }
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
    if (this.currentPattern) {
      this.currentPattern.stop();
    }
    this.currentPattern = null;
    this.isCurrentlyPlaying = false;
    this.playbackPosition = 0;
  }
}

// Export class only - create instance when needed
export { StrudelMusicService };

// Factory function to create instance only when needed
export const createStrudelMusicService = () => new StrudelMusicService();
