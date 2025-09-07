import { ApiService, StrudelTrack } from "~~/types/hermes";

// Configuration for the Golem-powered backend
const API_BASE_URL = process.env.NEXT_PUBLIC_HERMES_API_URL || "http://localhost:8080/api";

class HermesApiService implements ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchTrack(trackId: string): Promise<StrudelTrack> {
    try {
      const response = await fetch(`${this.baseUrl}/tracks/${trackId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch track: ${response.status} ${response.statusText}`);
      }

      const track = await response.json();
      return track;
    } catch (error) {
      console.error("Error fetching track:", error);
      throw new Error(`Failed to fetch track: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async fetchTracks(): Promise<StrudelTrack[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tracks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
      }

      const tracks = await response.json();
      return tracks;
    } catch (error) {
      console.error("Error fetching tracks:", error);
      throw new Error(`Failed to fetch tracks: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

// Export singleton instance
export const hermesApi = new HermesApiService();

// Export class for testing
export { HermesApiService };
