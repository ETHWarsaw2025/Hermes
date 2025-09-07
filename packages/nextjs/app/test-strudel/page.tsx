"use client";

import { useState } from "react";
import { PauseIcon, PlayIcon, StopIcon } from "@heroicons/react/24/solid";
import { createStrudelMusicService } from "~~/services/music/strudelService";

const TestStrudelPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testPattern = 'd1 $ s "bd*4" # n "0 2 4 7"';

  const handlePlay = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const strudelService = createStrudelMusicService();
      await strudelService.play(testPattern);
      setIsPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to play");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    const strudelService = createStrudelMusicService();
    strudelService.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    const strudelService = createStrudelMusicService();
    strudelService.stop();
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-base-200 rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Strudel Test</h1>

        <div className="mb-4 p-4 bg-base-300 rounded-lg">
          <h3 className="font-semibold mb-2">Test Pattern:</h3>
          <code className="text-sm">{testPattern}</code>
        </div>

        <div className="flex justify-center space-x-4 mb-4">
          <button className="btn btn-primary" onClick={handlePlay} disabled={isLoading || isPlaying}>
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
            Play
          </button>

          <button className="btn btn-secondary" onClick={handlePause} disabled={!isPlaying}>
            <PauseIcon className="h-5 w-5" />
            Pause
          </button>

          <button className="btn btn-accent" onClick={handleStop} disabled={!isPlaying}>
            <StopIcon className="h-5 w-5" />
            Stop
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div className="text-center text-sm text-base-content/70">
          Status: {isPlaying ? "🎵 Playing" : "⏸️ Stopped"}
        </div>
      </div>
    </div>
  );
};

export default TestStrudelPage;
