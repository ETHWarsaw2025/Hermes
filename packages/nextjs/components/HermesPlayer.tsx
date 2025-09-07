"use client";

import { useEffect, useState } from "react";
import { MusicalNoteIcon, ShareIcon, UserIcon } from "@heroicons/react/24/solid";
import { PlayerState, StrudelTrack } from "~~/types/hermes";
import { useMiniKit } from "~~/hooks/useMiniKit";

// Component to render Strudel REPL with dynamic content
const StrudelRepl = ({ code, onStrudelEvent }: { code: string; onStrudelEvent?: (event: any) => void }) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const replId = `strudel-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    // Check if Strudel script is loaded
    const checkScript = () => {
      if (typeof window !== 'undefined' && (window as any).customElements && (window as any).customElements.get('strudel-repl')) {
        setIsScriptLoaded(true);
      } else {
        setTimeout(checkScript, 100);
      }
    };
    checkScript();
  }, []);

  useEffect(() => {
    if (!isScriptLoaded) return;

    // Set up event listeners for Strudel events after component mounts
    const timer = setTimeout(() => {
      const replElement = document.getElementById(replId);
      if (replElement && onStrudelEvent) {
        const handleStrudelEvent = (event: any) => {
          console.log("🎵 Strudel event received:", event);
          onStrudelEvent(event);
        };

        // Listen for custom Strudel events
        replElement.addEventListener('strudel:start', handleStrudelEvent);
        replElement.addEventListener('strudel:stop', handleStrudelEvent);
        replElement.addEventListener('strudel:note', handleStrudelEvent);
        
        return () => {
          replElement.removeEventListener('strudel:start', handleStrudelEvent);
          replElement.removeEventListener('strudel:stop', handleStrudelEvent);
          replElement.removeEventListener('strudel:note', handleStrudelEvent);
        };
      }
    }, 500); // Longer delay to ensure Strudel is fully initialized

    return () => clearTimeout(timer);
  }, [isScriptLoaded, replId, onStrudelEvent]);

  if (!isScriptLoaded) {
    return (
      <div className="w-full p-4 text-center text-white/70">
        <div className="loading loading-spinner loading-sm mr-2"></div>
        Loading Strudel...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        dangerouslySetInnerHTML={{
          __html: `<strudel-repl id="${replId}"><!--
${code}
--></strudel-repl>`
        }}
      />
    </div>
  );
};

const HermesPlayer = () => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isLoading: false,
    currentTrack: null,
    error: null,
  });
  const [tracks, setTracks] = useState<StrudelTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [hydraService, setHydraService] = useState<any>(null);
  const [showVisuals, setShowVisuals] = useState<boolean>(true);
  
  // MiniKit integration
  const { isInMiniApp, user, isLoading: miniKitLoading, shareTrack, openProfile, requestAuth, setFrameReady } = useMiniKit();

  // Load tracks on component mount
  useEffect(() => {
    loadTracks();
  }, []);

  // Initialize Mini App frame
  useEffect(() => {
    if (isInMiniApp && setFrameReady) {
      setFrameReady();
    }
  }, [isInMiniApp, setFrameReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hydraService) {
        hydraService.destroy();
      }
    };
  }, [hydraService]);

  const loadTracks = async () => {
    try {
      setPlayerState(prev => ({ ...prev, isLoading: true }));
      const response = await fetch("/api/tracks");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTracks(data.tracks || []);
      setPlayerState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      console.error("Error loading tracks:", error);
      setPlayerState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load tracks",
      }));
    }
  };

  const handleTrackSelect = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      setSelectedTrackId(trackId);
      setPlayerState(prev => ({ ...prev, currentTrack: track, error: null }));
    }
  };

  const handleStartVisuals = async (track: StrudelTrack) => {
    if (!showVisuals) return;

    try {
      const canvas = document.getElementById("hydra-canvas") as HTMLCanvasElement;
      if (!canvas) {
        console.error("Hydra canvas not found");
        return;
      }

      // If service doesn't exist, create it
      if (!hydraService) {
        const { createHydraVisualsService } = await import("~~/services/visuals/hydraService");
        const service = createHydraVisualsService();
        setHydraService(service);
        console.log("🎨 Creating new Hydra service for track:", track.chain_name);
        await service.startVisuals(canvas, track);
      } else {
        // Reuse existing service, just stop current visuals and start new ones
        hydraService.stop();
        console.log("🎨 Reusing Hydra service for track:", track.chain_name);
        await hydraService.startVisuals(canvas, track);
      }
    } catch (error) {
      console.error("Error starting visuals:", error);
    }
  };

  const handleStopVisuals = () => {
    if (hydraService) {
      hydraService.stop();
      // Don't set to null, keep the service for reuse
    }
  };

  const handleStrudelEvent = (event: any) => {
    console.log("🎵 Strudel event:", event);
    
    if (hydraService && playerState.currentTrack) {
      switch (event.type) {
        case 'strudel:start':
          console.log("🎵 Strudel started playing");
          break;
        case 'strudel:stop':
          console.log("🎵 Strudel stopped playing");
          break;
        case 'strudel:note':
          console.log("🎵 Strudel note event:", event.detail);
          // Update Hydra visuals based on note events
          if (event.detail && event.detail.note) {
            hydraService.updatePlaybackPosition(event.detail.time || 0);
          }
          break;
      }
    }
  };

  // Handle track selection and start visuals
  useEffect(() => {
    if (playerState.currentTrack && showVisuals) {
      handleStartVisuals(playerState.currentTrack);
    } else if (!showVisuals) {
      handleStopVisuals();
    }
  }, [playerState.currentTrack, showVisuals, handleStartVisuals, handleStopVisuals]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black">
      {/* Fullscreen Hydra Canvas Background */}
      <canvas
        id="hydra-canvas"
        className="absolute inset-0 w-full h-full"
        width={1920}
        height={1080}
        style={{ 
          display: showVisuals ? "block" : "none",
          backgroundColor: "black",
          zIndex: 1
        }}
      />

      {/* Light overlay for better text readability - no blur to keep visuals vivid */}
      <div className="absolute inset-0 bg-black/20" style={{ zIndex: 2 }} />

      {/* UI Overlay */}
      <div className="relative min-h-screen flex flex-col p-6" style={{ zIndex: 10 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            {/* User Profile (Mini App) */}
            {isInMiniApp && (
              <div className="flex items-center gap-2">
                {user ? (
                  <button
                    onClick={openProfile}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 text-white hover:bg-white/20 transition-colors"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-6 h-6 rounded-full" />
                    ) : (
                      <UserIcon className="w-6 h-6" />
                    )}
                    <span className="text-sm">{user.displayName || user.username || "User"}</span>
                    {user.isVerified && <span className="text-blue-400">✓</span>}
                  </button>
                ) : (
                  <button
                    onClick={requestAuth}
                    className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm rounded-full px-3 py-2 text-blue-300 hover:bg-blue-500/30 transition-colors"
                    disabled={miniKitLoading}
                  >
                    <UserIcon className="w-6 h-6" />
                    <span className="text-sm">Sign In</span>
                  </button>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-center flex-1">
              <MusicalNoteIcon className="h-12 w-12 text-white" />
            </div>
            
            {/* Share Button */}
            {playerState.currentTrack && (
              <button
                onClick={() => shareTrack(playerState.currentTrack!.id, playerState.currentTrack!.chain_name)}
                className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm rounded-full px-3 py-2 text-green-300 hover:bg-green-500/30 transition-colors"
                title="Share this track"
              >
                <ShareIcon className="w-6 h-6" />
                {isInMiniApp && <span className="text-sm">Share</span>}
              </button>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-white">Hermes Player</h1>
          <p className="text-white/70 mt-2">
            Blockchain Audio + Visual Experience
            {isInMiniApp && <span className="block text-sm text-blue-300 mt-1">🌍 Base Mini App</span>}
          </p>
        </div>

        {/* Controls Section */}
        <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full px-2 sm:px-0">
          {/* Track Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Select Track</label>
            <select
              className="select select-bordered w-full bg-black/50 text-white border-white/30 backdrop-blur-sm"
              value={selectedTrackId}
              onChange={e => handleTrackSelect(e.target.value)}
              disabled={playerState.isLoading}
            >
              <option value="" className="bg-black text-white">Choose a track...</option>
              {tracks.map(track => (
                <option key={track.id} value={track.id} className="bg-black text-white">
                  {track.chain_name.toUpperCase()} - {track.musical_parameters.sound_profile} (
                  {track.musical_parameters.tempo} BPM)
                </option>
              ))}
            </select>
          </div>

          {/* Current Track Info */}
          {playerState.currentTrack && (
            <div className="mb-6 p-4 bg-black/30 rounded-lg backdrop-blur-sm border border-white/20">
              <h3 className="font-semibold text-white text-center sm:text-left">
                {playerState.currentTrack.chain_name.toUpperCase()} - Track {playerState.currentTrack.id}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm text-white/70">
                <div>
                  <span className="font-medium">Tempo:</span> {playerState.currentTrack.musical_parameters.tempo} BPM
                </div>
                <div>
                  <span className="font-medium">Scale:</span> {playerState.currentTrack.musical_parameters.scale}
                </div>
                <div>
                  <span className="font-medium">Instrument:</span>{" "}
                  {playerState.currentTrack.musical_parameters.instrument_type}
                </div>
                <div>
                  <span className="font-medium">Activity Score:</span>{" "}
                  {playerState.currentTrack.source_kpis.network_activity_score}%
                </div>
              </div>
            </div>
          )}

          {/* Strudel REPL */}
          {playerState.currentTrack && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-white">Strudel Pattern</h4>
                <button
                  className="btn btn-xs btn-outline border-white/30 text-white hover:bg-white/10"
                  onClick={() => {
                    navigator.clipboard.writeText(playerState.currentTrack?.strudel_code_string || "");
                  }}
                  title="Copy to clipboard"
                >
                  📋 Copy
                </button>
              </div>
              <div className="bg-black/30 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                <StrudelRepl 
                  code={playerState.currentTrack.strudel_code_string} 
                  onStrudelEvent={handleStrudelEvent}
                />
              </div>
              <div className="mt-2 text-xs text-white/60">
                <span className="font-medium">Complexity:</span> {playerState.currentTrack.musical_parameters.complexity}
                /10 |<span className="font-medium ml-2">Effects:</span>{" "}
                {playerState.currentTrack.musical_parameters.effects.join(", ") || "None"}
              </div>
            </div>
          )}

          {/* Error Display */}
          {playerState.error && (
            <div className="alert alert-error mb-4 bg-red-500/20 border-red-500/50 backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-200">{playerState.error}</span>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="flex justify-center items-center p-4">
          <label className="cursor-pointer flex items-center gap-2">
            <span className="text-white text-sm">Show Visuals</span>
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={showVisuals}
              onChange={e => setShowVisuals(e.target.checked)}
            />
          </label>
        </div>

        {/* Status */}
        <div className="text-center text-sm text-white/70 pb-4">
          {playerState.currentTrack ? "🎵 Use the Strudel controls above to play" : "🎵 Select a track to begin"}
        </div>
      </div>
    </div>
  );
};

export default HermesPlayer;