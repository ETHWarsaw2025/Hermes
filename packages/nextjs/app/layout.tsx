import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { MiniKitContextProvider } from "~~/providers/MiniKitProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Hermes Player - Blockchain Audio + Visual Experience",
  description: "Turn blockchain data into immersive Strudel patterns with synchronized Hydra visuals. A Base Mini App for the decentralized music experience.",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <head>
        <script src="https://unpkg.com/@strudel/embed@latest" async></script>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <MiniKitContextProvider>
          <ThemeProvider enableSystem>
            <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
          </ThemeProvider>
        </MiniKitContextProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
