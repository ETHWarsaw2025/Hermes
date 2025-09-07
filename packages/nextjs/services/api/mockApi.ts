import { StrudelTrack } from "~~/types/hermes";

// Mock data for testing the Hermes Player
const mockTracks: StrudelTrack[] = [
  {
    id: "ethereum_track_1",
    timestamp: "2025-01-01T00:00:00Z",
    chain_name: "ethereum",
    strudel_code_string: 'd1 $ s "bd*4" # n "0 2 4 7" # room 0.3',
    source_kpis: {
      chain_name: "ethereum",
      timestamp: "2025-01-01T00:00:00Z",
      price_change_percentage: 2.5,
      gas_fee_trend: 0.8,
      transaction_volume_change: 15.2,
      block_production_rate: 12.5,
      network_activity_score: 85.0,
      volatility_index: 0.3,
      liquidity_score: 92.0,
    },
    musical_parameters: {
      tempo: 128,
      base_note: "c3",
      rhythm_pattern: "bd*4",
      gain: 0.5,
      sound_profile: "ambient",
      scale: "C:major",
      complexity: 3,
      effects: ["room"],
      instrument_type: "drum",
    },
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "polygon_track_1",
    timestamp: "2025-01-01T00:00:00Z",
    chain_name: "polygon",
    strudel_code_string: 'd1 $ s "hh*8" # pan (sine * 0.5)',
    source_kpis: {
      chain_name: "polygon",
      timestamp: "2025-01-01T00:00:00Z",
      price_change_percentage: 1.2,
      gas_fee_trend: 0.2,
      transaction_volume_change: 8.5,
      block_production_rate: 2.0,
      network_activity_score: 75.0,
      volatility_index: 0.1,
      liquidity_score: 88.0,
    },
    musical_parameters: {
      tempo: 140,
      base_note: "e3",
      rhythm_pattern: "hh*8",
      gain: 0.3,
      sound_profile: "rhythmic",
      scale: "E:minor",
      complexity: 5,
      effects: ["pan"],
      instrument_type: "hihat",
    },
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "base_track_1",
    timestamp: "2025-01-01T00:00:00Z",
    chain_name: "base",
    strudel_code_string: 'd1 $ s "bd*2" # n "0 0 0 7" # gain 1.2',
    source_kpis: {
      chain_name: "base",
      timestamp: "2025-01-01T00:00:00Z",
      price_change_percentage: 3.8,
      gas_fee_trend: 0.1,
      transaction_volume_change: 25.0,
      block_production_rate: 2.0,
      network_activity_score: 90.0,
      volatility_index: 0.2,
      liquidity_score: 95.0,
    },
    musical_parameters: {
      tempo: 100,
      base_note: "f2",
      rhythm_pattern: "bd*2",
      gain: 1.2,
      sound_profile: "bass",
      scale: "F:major",
      complexity: 2,
      effects: [],
      instrument_type: "bass",
    },
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "arbitrum_track_1",
    timestamp: "2025-01-01T00:00:00Z",
    chain_name: "arbitrum",
    strudel_code_string: 'd1 $ s "piano*4" # n (run 8) # room 0.5 # pan sine',
    source_kpis: {
      chain_name: "arbitrum",
      timestamp: "2025-01-01T00:00:00Z",
      price_change_percentage: 1.8,
      gas_fee_trend: 0.3,
      transaction_volume_change: 12.5,
      block_production_rate: 0.25,
      network_activity_score: 80.0,
      volatility_index: 0.15,
      liquidity_score: 85.0,
    },
    musical_parameters: {
      tempo: 110,
      base_note: "g3",
      rhythm_pattern: "piano*4",
      gain: 0.7,
      sound_profile: "melodic",
      scale: "G:major",
      complexity: 7,
      effects: ["room", "pan"],
      instrument_type: "piano",
    },
    created_at: "2025-01-01T00:00:00Z",
  },
];

// Mock API service for testing
export const mockApi = {
  async fetchTrack(trackId: string): Promise<StrudelTrack> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const track = mockTracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error(`Track with ID ${trackId} not found`);
    }

    return track;
  },

  async fetchTracks(): Promise<StrudelTrack[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return [...mockTracks];
  },
};
