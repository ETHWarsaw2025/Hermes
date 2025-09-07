// Type declarations for @strudel/web
declare module "@strudel/web" {
  export interface StrudelInstance {
    evaluate(code: string): any;
    stop(): void;
    play(): void;
    pause(): void;
  }

  export function initStrudel(): Promise<StrudelInstance>;
}
