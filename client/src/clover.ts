/**
 * Clover hosted-iframe SDK integration (client side).
 *
 * The SDK is loaded from Clover's checkout host and initialised with the
 * merchant's PUBLIC key (safe to expose). Card data is entered inside
 * Clover-controlled iframes, so raw card details never touch our code; the
 * SDK returns a clv_ source token which we forward to our backend.
 */

export interface CloverPublicConfig {
  publicKey: string | null;
  merchantId: string | null;
  sdkUrl: string;
  cardEntryEnabled: boolean;
}

export type CloverElementType =
  | "CARD_NUMBER"
  | "CARD_DATE"
  | "CARD_CVV"
  | "CARD_POSTAL_CODE";

export interface CloverElement {
  mount(target: string | HTMLElement): void;
  unmount(): void;
  addEventListener?(event: string, handler: (event: unknown) => void): void;
}

export interface CloverElements {
  create(type: CloverElementType, options?: unknown): CloverElement;
}

export interface CloverCreateTokenResult {
  token?: string;
  errors?: Record<string, unknown> | { message?: string };
}

export interface CloverInstance {
  elements(): CloverElements;
  createToken(): Promise<CloverCreateTokenResult>;
}

type CloverConstructor = new (
  apiKey: string,
  options?: { merchantId?: string }
) => CloverInstance;

declare global {
  interface Window {
    Clover?: CloverConstructor;
  }
}

export async function fetchPublicConfig(): Promise<CloverPublicConfig> {
  const res = await fetch("/api/clover/public-config");
  if (!res.ok) throw new Error(`Failed to load Clover config (${res.status})`);
  return (await res.json()) as CloverPublicConfig;
}

let sdkPromise: Promise<CloverConstructor> | null = null;

/** Inject Clover's sdk.js once and resolve with the global Clover constructor. */
export function loadCloverSdk(sdkUrl: string): Promise<CloverConstructor> {
  if (window.Clover) return Promise.resolve(window.Clover);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<CloverConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => {
      if (window.Clover) resolve(window.Clover);
      else reject(new Error("Clover SDK loaded but window.Clover is missing"));
    };
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("Failed to load the Clover SDK"));
    };
    document.head.appendChild(script);
  });

  return sdkPromise;
}

/** Flatten Clover's createToken errors into a single readable message. */
export function describeTokenErrors(
  errors: CloverCreateTokenResult["errors"]
): string {
  if (!errors) return "Card could not be tokenized.";
  if (typeof errors === "object" && "message" in errors && errors.message) {
    return String(errors.message);
  }
  const parts = Object.values(errors).filter(Boolean).map(String);
  return parts.length ? parts.join(" ") : "Please check the card details.";
}
