"use client";

import { ReactNode, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface MiniKitProviderProps {
  children: ReactNode;
}

export default function MiniKitProvider({ children }: MiniKitProviderProps) {
  useEffect(() => {
    // Initialize Farcaster Mini App SDK when component mounts
    const initializeMiniApp = async () => {
      if (typeof window !== "undefined") {
        try {
          // Signal that the app is ready to display
          await sdk.actions.ready();
          console.log("🌍 Farcaster Mini App SDK initialized successfully");
        } catch (error) {
          console.error("❌ Failed to initialize Farcaster Mini App SDK:", error);
        }
      }
    };

    initializeMiniApp();
  }, []);

  return <>{children}</>;
}
