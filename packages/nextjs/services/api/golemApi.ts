import { ApiService, StrudelTrack } from "~~/types/hermes";

// Golem DB Configuration
const GOLEM_CONFIG = {
  privateKey:
    process.env.NEXT_PUBLIC_GOLEM_PRIVATE_KEY || "0xfb7bd8867f2c0835b7dea8e830c86dc2fe6f1ebd095409b3b16096a29b95970c",
  rpcUrl: process.env.NEXT_PUBLIC_GOLEM_RPC_URL || "https://ethwarsaw.holesky.golemdb.io/rpc",
  wsUrl: process.env.NEXT_PUBLIC_GOLEM_WS_URL || "wss://ethwarsaw.holesky.golemdb.io/rpc/ws",
  chainId: process.env.NEXT_PUBLIC_GOLEM_CHAIN_ID || "60138453033",
};

class GolemApiService implements ApiService {
  private client: any = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // Dynamically import Golem SDK to avoid SSR issues
      const golemSdk = await import("golem-base-sdk");

      // Convert private key to bytes
      const privateKeyHex = GOLEM_CONFIG.privateKey.replace("0x", "");
      const privateKeyBytes = new Uint8Array(Buffer.from(privateKeyHex, "hex"));

      // Create client using the correct API
      this.client = await golemSdk.createClient(
        parseInt(GOLEM_CONFIG.chainId),
        { tag: "privatekey", data: privateKeyBytes },
        GOLEM_CONFIG.rpcUrl,
        GOLEM_CONFIG.wsUrl,
      );

      this.isConnected = true;
      console.log("✅ Connected to Golem DB");
    } catch (error) {
      console.error("Failed to connect to Golem DB:", error);
      this.isConnected = false;
    }
  }

  async fetchTrack(trackId: string): Promise<StrudelTrack> {
    try {
      if (!this.isConnected || !this.client) {
        await this.initializeClient();
      }

      if (!this.client) {
        throw new Error("Not connected to Golem DB");
      }

      // Query for the specific track by ID
      const entities = await this.client.queryEntities(`type = "strudel_track" && track_id = "${trackId}"`);

      if (entities.length === 0) {
        throw new Error(`Track with ID ${trackId} not found`);
      }

      // Decode the first matching entity
      const entity = entities[0];
      const trackData = JSON.parse(new TextDecoder().decode(entity.storageValue));

      return trackData;
    } catch (error) {
      console.error("Error fetching track from Golem:", error);
      throw new Error(`Failed to fetch track: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async fetchTracks(): Promise<StrudelTrack[]> {
    try {
      if (!this.isConnected || !this.client) {
        await this.initializeClient();
      }

      if (!this.client) {
        throw new Error("Not connected to Golem DB");
      }

      // Query for all strudel tracks
      const entities = await this.client.queryEntities('type = "strudel_track"');

      const tracks: StrudelTrack[] = [];

      for (const entity of entities) {
        try {
          const trackData = JSON.parse(new TextDecoder().decode(entity.storageValue));
          tracks.push(trackData);
        } catch (parseError) {
          console.warn("Failed to parse track data:", parseError);
        }
      }

      console.log(`✅ Retrieved ${tracks.length} tracks from Golem DB`);
      return tracks;
    } catch (error) {
      console.error("Error fetching tracks from Golem:", error);
      throw new Error(`Failed to fetch tracks: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Additional method to store a track (for testing purposes)
  async storeTrack(track: StrudelTrack): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        await this.initializeClient();
      }

      if (!this.client) {
        throw new Error("Not connected to Golem DB");
      }

      // Create entity data
      const dataBytes = new TextEncoder().encode(JSON.stringify(track));

      // Create annotations
      const annotations = [
        { key: "type", value: "strudel_track" },
        { key: "track_id", value: track.id },
        { key: "chain_name", value: track.chain_name },
        { key: "created_at", value: new Date().toISOString() },
      ];

      // Store the entity
      await this.client.createEntity({
        data: dataBytes,
        btl: 1000000, // Block time limit
        stringAnnotations: annotations,
        numericAnnotations: [],
      });

      console.log(`✅ Stored track: ${track.id}`);
      return true;
    } catch (error) {
      console.error("Error storing track to Golem:", error);
      return false;
    }
  }

  // Method to get connection status
  isConnectedToGolem(): boolean {
    return this.isConnected && this.client !== null;
  }
}

// Export singleton instance
export const golemApi = new GolemApiService();

// Export class for testing
export { GolemApiService };
