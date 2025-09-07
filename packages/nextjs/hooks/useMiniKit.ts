"use client";

import { useMiniKit as useOnchainKitMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";

export interface MiniKitUser {
  id: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface MiniKitContext {
  isInMiniApp: boolean;
  user: MiniKitUser | null;
  isLoading: boolean;
  error: string | null;
}

export function useMiniKit(): MiniKitContext & {
  shareTrack: (trackId: string, chainName: string) => Promise<void>;
  openProfile: () => Promise<void>;
  requestAuth: () => Promise<void>;
  setFrameReady: () => void;
} {
  const { setFrameReady, isFrameReady } = useOnchainKitMiniKit();
  const [context, setContext] = useState<MiniKitContext>({
    isInMiniApp: false,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        if (typeof window === "undefined") return;

        // Check if we're in a Mini App environment
        const isInMiniApp = typeof window !== "undefined" && 
          (window.parent !== window || window.location !== window.parent.location);
        
        if (isInMiniApp) {
          console.log("🌍 Running in Base Mini App environment");
          
          // Set frame ready when in Mini App
          if (!isFrameReady) {
            setFrameReady();
          }
          
          setContext({
            isInMiniApp: true,
            user: null, // OnchainKit handles user context differently
            isLoading: false,
            error: null,
          });
        } else {
          console.log("🌐 Running in regular web environment");
          setContext({
            isInMiniApp: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("❌ Base Mini App initialization error:", error);
        setContext({
          isInMiniApp: false,
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to initialize Base Mini App",
        });
      }
    };

    initializeMiniApp();
  }, [isFrameReady, setFrameReady]);

  const shareTrack = async (trackId: string, chainName: string) => {
    if (!context.isInMiniApp) {
      // Fallback to Web Share API or copy to clipboard
      const shareData = {
        title: `🎵 ${chainName.toUpperCase()} Track on Hermes Player`,
        text: `Check out this blockchain audio visualization: ${chainName} track with Strudel patterns and Hydra visuals!`,
        url: `${window.location.origin}?track=${trackId}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        console.log("📋 Track URL copied to clipboard");
      }
      return;
    }

    try {
      // Use Base Mini App sharing capabilities
      const shareText = `🎵 Check out this ${chainName.toUpperCase()} track on Hermes Player! Blockchain data turned into immersive audio-visual experience with Strudel patterns and Hydra visuals.`;
      
      // For now, copy to clipboard - OnchainKit may have specific sharing methods
      await navigator.clipboard.writeText(`${shareText}\n${window.location.origin}?track=${trackId}`);
      console.log("🚀 Track shared successfully (copied to clipboard)");
    } catch (error) {
      console.error("❌ Share failed:", error);
      throw error;
    }
  };

  const openProfile = async () => {
    if (!context.isInMiniApp) return;
    
    try {
      // OnchainKit may provide profile opening functionality
      console.log("📱 Profile functionality with OnchainKit");
    } catch (error) {
      console.error("❌ Failed to open profile:", error);
    }
  };

  const requestAuth = async () => {
    if (!context.isInMiniApp) return;

    try {
      // OnchainKit handles authentication differently
      console.log("🔐 Authentication with OnchainKit");
      setContext(prev => ({
        ...prev,
        user: {
          id: "base_user",
          username: "Base User",
          displayName: "Base User",
          avatar: undefined,
          isVerified: false,
        },
      }));
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      setContext(prev => ({
        ...prev,
        error: "Authentication failed",
      }));
    }
  };

  return {
    ...context,
    shareTrack,
    openProfile,
    requestAuth,
    setFrameReady,
  };
}