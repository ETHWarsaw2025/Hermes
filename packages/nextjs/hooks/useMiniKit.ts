"use client";

import { sdk } from "@farcaster/miniapp-sdk";
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
} {
  const [context, setContext] = useState<MiniKitContext>({
    isInMiniApp: false,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initializeFarcasterMiniApp = async () => {
      try {
        if (typeof window === "undefined") return;

        // Get Farcaster Mini App context
        const context = await sdk.context;
        // Check if we're in a framed environment (Mini App)
        const isInMiniApp = typeof window !== "undefined" && 
          (window.parent !== window || window.location !== window.parent.location);
        
        if (isInMiniApp) {
          console.log("🌍 Running in Farcaster Mini App environment");
          
          // Try to get user context
          try {
            const userContext = context.user;
            setContext({
              isInMiniApp: true,
              user: userContext ? {
                id: userContext.fid?.toString() || "anonymous",
                username: userContext.username,
                displayName: userContext.displayName,
                avatar: userContext.pfpUrl,
                isVerified: false, // Simplified for now
              } : null,
              isLoading: false,
              error: null,
            });
          } catch (userError) {
            console.log("🔐 User not authenticated, showing anonymous mode");
            setContext({
              isInMiniApp: true,
              user: null,
              isLoading: false,
              error: null,
            });
          }
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
        console.error("❌ Farcaster Mini App initialization error:", error);
        setContext({
          isInMiniApp: false,
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to initialize Farcaster Mini App",
        });
      }
    };

    initializeFarcasterMiniApp();
  }, []);

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
      // Use Farcaster SDK to share
      const shareText = `🎵 Check out this ${chainName.toUpperCase()} track on Hermes Player! Blockchain data turned into immersive audio-visual experience with Strudel patterns and Hydra visuals.`;
      
      // For now, copy to clipboard as Farcaster SDK sharing might require specific setup
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
      // Farcaster SDK doesn't have direct profile opening
      // This could be implemented with navigation or other actions
      console.log("📱 Profile functionality not yet implemented in Farcaster SDK");
    } catch (error) {
      console.error("❌ Failed to open profile:", error);
    }
  };

  const requestAuth = async () => {
    if (!context.isInMiniApp) return;

    try {
      // Farcaster SDK authentication would be handled differently
      // For now, we'll just refresh the context
      const sdkContext = await sdk.context;
      const userContext = sdkContext.user;
      setContext(prev => ({
        ...prev,
        user: userContext ? {
          id: userContext.fid?.toString() || "anonymous",
          username: userContext.username,
          displayName: userContext.displayName,
          avatar: userContext.pfpUrl,
          isVerified: false, // Simplified for now
        } : null,
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
  };
}
