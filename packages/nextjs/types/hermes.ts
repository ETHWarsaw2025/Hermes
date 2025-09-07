// Hermes Player Types

export interface StrudelTrack {
  id: string;
  timestamp: string;
  chain_name: string;
  strudel_code_string: string;
  source_kpis: AnalyzedMetric;
  musical_parameters: MusicalParameters;
  created_at: string;
}

export interface AnalyzedMetric {
  chain_name: string;
  timestamp: string;
  price_change_percentage: number;
  gas_fee_trend: number;
  transaction_volume_change: number;
  block_production_rate: number;
  network_activity_score: number;
  volatility_index: number;
  liquidity_score: number;
}

export interface MusicalParameters {
  tempo: number;
  base_note: string;
  rhythm_pattern: string;
  gain: number;
  sound_profile: string;
  scale: string;
  complexity: number;
  effects: string[];
  instrument_type: string;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  duration?: number;
  bpm?: number;
}

export interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTrack: StrudelTrack | null;
  error: string | null;
}


export interface VisualsService {
  startVisuals: (canvas: HTMLCanvasElement, track: StrudelTrack, playbackPosition?: number) => Promise<void>;
  updatePlaybackPosition: (position: number) => void;
  pause: () => void;
  stop: () => void;
  resume: (track: StrudelTrack, position: number) => void;
  isRunning: () => boolean;
  getCurrentVisual: () => string;
  destroy: () => void;
}

export interface ApiService {
  fetchTrack: (trackId: string) => Promise<StrudelTrack>;
  fetchTracks: () => Promise<StrudelTrack[]>;
}
