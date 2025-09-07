# Hermes Player - Blockchain Audio Aggregator Player

A minimalist front-end player built with Scaffold-ETH 2 that fetches pre-generated StrudelTrack objects from a Golem-powered backend and plays them using the Strudel.js audio engine. The tracks are generated from blockchain data analysis, creating unique audio experiences based on network activity.

## Features

- 🎵 **Minimalist UI**: Clean, simple interface perfect for a Base Mini App
- 🎼 **Strudel.js Integration**: Uses the powerful Strudel audio engine for live coding music
- 🔗 **Golem DB Integration**: Fetches tracks from Golem-powered decentralized storage
- ⚡ **Real-time Controls**: Play, pause, resume, and stop functionality
- 🎨 **Scaffold-ETH 2**: Built on the robust Scaffold-ETH 2 framework
- 📊 **Blockchain Data**: Tracks generated from real blockchain metrics and KPIs
- 🌐 **Multi-Chain Support**: Supports Ethereum, Polygon, Base, Arbitrum, and more

## Architecture

### Core Components

1. **API Service** (`services/api/hermesApi.ts`)
   - Fetches StrudelTrack objects from backend
   - Handles error management and response parsing
   - Configurable API endpoint

2. **Music Service** (`services/music/strudelService.ts`)
   - Wrapper for Strudel.js audio engine
   - Manages playback state and pattern execution
   - Handles play, pause, stop, and resume operations

3. **Player UI** (`components/HermesPlayer.tsx`)
   - Minimalist player interface
   - Track selection dropdown
   - Control buttons (play, pause, stop, resume)
   - Real-time status display

4. **TypeScript Types** (`types/hermes.ts`)
   - Comprehensive type definitions
   - StrudelTrack interface
   - Player state management types

## Setup

1. **Install Dependencies**
   ```bash
   yarn install
   ```

2. **Configure Golem DB**
   Create a `.env.local` file in `packages/nextjs/`:
   ```env
   # Golem DB Configuration
   NEXT_PUBLIC_GOLEM_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001
   NEXT_PUBLIC_GOLEM_RPC_URL=https://ethwarsaw.holesky.golemdb.io/rpc
   NEXT_PUBLIC_GOLEM_WS_URL=wss://ethwarsaw.holesky.golemdb.io/rpc/ws
   NEXT_PUBLIC_GOLEM_CHAIN_ID=60138453033
   ```

3. **Start Development Server**
   ```bash
   yarn start
   ```

## API Integration

The player uses Next.js API routes that can connect to either mock data or Golem DB:

### GET /api/tracks
Returns an array of available tracks. Add `?golem=true` to use Golem DB.

### POST /api/tracks
Fetches a specific track by ID. Include `{ "trackId": "track_id", "useGolem": true }` in the body.

## StrudelTrack Interface

```typescript
interface StrudelTrack {
  id: string;
  timestamp: string;
  chain_name: string;
  strudel_code_string: string;
  source_kpis: AnalyzedMetric;
  musical_parameters: MusicalParameters;
  created_at: string;
}

interface AnalyzedMetric {
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

interface MusicalParameters {
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
```

## Usage

1. **Select a Track**: Use the dropdown to choose from available tracks
2. **Play**: Click the play button to start audio playback
3. **Control**: Use pause, resume, and stop buttons to control playback
4. **Status**: Monitor the current playback state in the status area

## Development

The player is built using:
- **Next.js 15** with App Router
- **React 19** with hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **DaisyUI** for components
- **Strudel.js** for audio processing

## Deployment

The player is designed to be deployed as a Base Mini App:

1. **Build the application**:
   ```bash
   yarn build
   ```

2. **Deploy to your preferred platform**:
   ```bash
   yarn vercel
   # or
   yarn ipfs
   ```

## Error Handling

The player includes comprehensive error handling for:
- Network connectivity issues
- Invalid track data
- Audio engine initialization failures
- Playback errors

All errors are displayed in the UI with user-friendly messages.

## Customization

The minimalist design can be easily customized by:
- Modifying the `HermesPlayer.tsx` component
- Updating the Tailwind CSS classes
- Adding additional UI elements as needed
- Extending the API service for additional functionality

## License

This project is part of the Scaffold-ETH 2 ecosystem and follows the same licensing terms.
