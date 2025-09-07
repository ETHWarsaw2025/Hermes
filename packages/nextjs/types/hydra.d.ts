declare module "hydra-synth" {
  interface HydraOptions {
    canvas?: HTMLCanvasElement;
    detectAudio?: boolean;
    enableStreamCapture?: boolean;
    width?: number;
    height?: number;
  }

  class Hydra {
    constructor(options?: HydraOptions);
    eval(code: string): void;
    setResolution(width: number, height: number): void;
    hush(): void;
  }

  export default Hydra;
}
