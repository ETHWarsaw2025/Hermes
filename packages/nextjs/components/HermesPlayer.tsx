"use client";

import { useEffect, useState } from "react";
import { MusicalNoteIcon, PauseIcon, PlayIcon, StopIcon } from "@heroicons/react/24/solid";
import { PlayerState, StrudelTrack } from "~~/types/hermes";

// API services are accessed via Next.js API routes

// Component to display Strudel code with a moving cursor
const StrudelCodeWithCursor = ({
  code,
  position,
  isPlaying,
}: {
  code: string;
  position: number;
  isPlaying: boolean;
}) => {
  // Calculate cursor position based on playback time
  // This is a simplified approach - in reality, you'd need to parse the Strudel code
  // and map time positions to character positions
  const lines = code.split("\n");
  const totalLines = lines.length;
  const currentLine = Math.floor(((position % 4) * totalLines) / 4); // Cycle through lines every 4 seconds
  const currentChar = Math.floor((position * 10) % lines[currentLine]?.length || 0);

  return (
    <pre className="text-xs text-base-content/80 whitespace-pre-wrap font-mono leading-relaxed relative">
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} className="relative">
          {line.split("").map((char, charIndex) => {
            const isCurrentPosition = isPlaying && lineIndex === currentLine && charIndex === currentChar;

            return (
              <span
                key={charIndex}
                className={`
                  ${isCurrentPosition ? "bg-primary text-primary-content animate-pulse" : ""}
                  ${isCurrentPosition ? "px-1 rounded" : ""}
                `}
              >
                {char}
              </span>
            );
          })}
          {isPlaying && lineIndex === currentLine && (
            <span
              className="absolute top-0 left-0 w-0.5 h-4 bg-primary animate-pulse"
              style={{ left: `${currentChar * 0.5}rem` }}
            />
          )}
        </div>
      ))}
    </pre>
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
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [strudelService, setStrudelService] = useState<any>(null);

  // Load available tracks on component mount
  useEffect(() => {
    loadTracks();
  }, []);

  // Cleanup Strudel service on unmount
  useEffect(() => {
    return () => {
      if (strudelService) {
        strudelService.destroy();
      }
    };
  }, [strudelService]);

  const loadTracks = async () => {
    try {
      setPlayerState(prev => ({ ...prev, isLoading: true, error: null }));
      console.log("🔄 Loading tracks from API...");

      // Use API route - can switch between mock and Golem by adding ?golem=true
      const response = await fetch("/api/tracks");
      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const availableTracks = await response.json();
      console.log("🎵 Loaded tracks:", availableTracks.length, "tracks");
      console.log("🎵 First track:", availableTracks[0]);

      setTracks(availableTracks);
      setPlayerState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error("❌ Error loading tracks:", error);
      setPlayerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load tracks",
        isLoading: false,
      }));
    }
  };

  const handleTrackSelect = async (trackId: string) => {
    try {
      setPlayerState(prev => ({ ...prev, isLoading: true, error: null }));
      console.log("🎯 Selecting track:", trackId);

      // Use API route - can switch between mock and Golem by adding ?golem=true
      const response = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });

      console.log("📡 Track API Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const track = await response.json();
      console.log("🎵 Selected track:", track);

      setPlayerState(prev => ({ ...prev, currentTrack: track, isLoading: false }));
      setSelectedTrackId(trackId);
    } catch (error) {
      console.error("❌ Error selecting track:", error);
      setPlayerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load track",
        isLoading: false,
      }));
    }
  };

  const handlePlay = async () => {
    if (!playerState.currentTrack) {
      setPlayerState(prev => ({ ...prev, error: "No track selected" }));
      return;
    }

    // Check if we're in browser environment
    if (typeof window === "undefined") {
      setPlayerState(prev => ({ ...prev, error: "Audio engine not available on server side" }));
      return;
    }

    try {
      setPlayerState(prev => ({ ...prev, isLoading: true, error: null }));

      // Dynamically import and create Strudel service only when needed
      const { createStrudelMusicService } = await import("~~/services/music/strudelService");
      const service = createStrudelMusicService();

      // Set up position tracking callback
      service.setOnPositionUpdate((position: number) => {
        setPlaybackPosition(position);
      });

      await service.play(playerState.currentTrack.strudel_code_string);
      setStrudelService(service);
      setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
    } catch (error) {
      setPlayerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to play track",
        isLoading: false,
      }));
    }
  };

  const handlePause = async () => {
    try {
      if (strudelService) {
        strudelService.pause();
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      }
    } catch (error) {
      console.error("Error pausing:", error);
    }
  };

  const handleStop = async () => {
    try {
      if (strudelService) {
        strudelService.stop();
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
        setPlaybackPosition(0);
      }
    } catch (error) {
      console.error("Error stopping:", error);
    }
  };

  const handleResume = async () => {
    try {
      if (strudelService) {
        strudelService.resume();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      console.error("Error resuming:", error);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-base-200 rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MusicalNoteIcon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-base-content">Hermes Player</h1>
          <p className="text-base-content/70 mt-2">Minimalist Strudel Audio Player</p>
        </div>

        {/* Track Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-base-content mb-2">Select Track</label>
          <select
            className="select select-bordered w-full"
            value={selectedTrackId}
            onChange={e => handleTrackSelect(e.target.value)}
            disabled={playerState.isLoading}
          >
            <option value="">Choose a track...</option>
            {tracks.map(track => (
              <option key={track.id} value={track.id}>
                {track.chain_name.toUpperCase()} - {track.musical_parameters.sound_profile} (
                {track.musical_parameters.tempo} BPM)
              </option>
            ))}
          </select>
        </div>

        {/* Current Track Info */}
        {playerState.currentTrack && (
          <div className="mb-6 p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold text-base-content">
              {playerState.currentTrack.chain_name.toUpperCase()} - Track {playerState.currentTrack.id}
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-base-content/70">
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

        {/* Strudel Pattern Code */}
        {playerState.currentTrack && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-base-content">Strudel Pattern Code</h4>
              <div className="flex items-center gap-2">
                {playerState.isPlaying && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span>{playbackPosition.toFixed(1)}s</span>
                  </div>
                )}
                <button
                  className="btn btn-xs btn-outline"
                  onClick={() => {
                    navigator.clipboard.writeText(playerState.currentTrack?.strudel_code_string || "");
                  }}
                  title="Copy to clipboard"
                >
                  📋 Copy
                </button>
              </div>
            </div>
            <div className="bg-base-300 rounded-lg p-4 max-h-64 overflow-y-auto relative">
              <StrudelCodeWithCursor
                code={playerState.currentTrack.strudel_code_string}
                position={playbackPosition}
                isPlaying={playerState.isPlaying}
              />
            </div>
            <div className="mt-2 text-xs text-base-content/60">
              <span className="font-medium">Complexity:</span> {playerState.currentTrack.musical_parameters.complexity}
              /10 |<span className="font-medium ml-2">Effects:</span>{" "}
              {playerState.currentTrack.musical_parameters.effects.join(", ") || "None"}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4 mb-6">
          {!playerState.isPlaying ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={handlePlay}
              disabled={!playerState.currentTrack || playerState.isLoading}
            >
              {playerState.isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
              Play
            </button>
          ) : (
            <button className="btn btn-secondary btn-lg" onClick={handlePause}>
              <PauseIcon className="h-6 w-6" />
              Pause
            </button>
          )}

          <button
            className="btn btn-accent btn-lg"
            onClick={playerState.isPlaying ? handleResume : handleStop}
            disabled={!playerState.currentTrack}
          >
            {playerState.isPlaying ? <PlayIcon className="h-6 w-6" /> : <StopIcon className="h-6 w-6" />}
            {playerState.isPlaying ? "Resume" : "Stop"}
          </button>
        </div>

        {/* Error Display */}
        {playerState.error && (
          <div className="alert alert-error mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
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
            <span>{playerState.error}</span>
          </div>
        )}

        {/* Status */}
        <div className="text-center text-sm text-base-content/70">
          {playerState.isPlaying && "🎵 Now Playing"}
          {!playerState.isPlaying && playerState.currentTrack && "⏸️ Paused"}
          {!playerState.currentTrack && "🎵 Select a track to begin"}
        </div>
      </div>
    </div>
  );
};

export default HermesPlayer;
