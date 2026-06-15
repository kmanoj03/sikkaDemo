import { useCallback, useEffect, useState } from "react";

import {
  fetchPublicConfig,
  loadCloverSdk,
  type CloverInstance,
  type CloverPublicConfig,
} from "../clover";

interface UseCloverResult {
  /** Browser-safe config from the backend (null until loaded). */
  config: CloverPublicConfig | null;
  /** Whether card entry is available (public key + merchant configured). */
  cardEntryEnabled: boolean;
  /** Initialised Clover instance, or null until the SDK is lazily loaded. */
  clover: CloverInstance | null;
  /** True while the SDK is loading. */
  loading: boolean;
  error: string | null;
  /** Lazily load + initialise the Clover SDK (call when entering card mode). */
  ensureLoaded: () => void;
}

/**
 * Manages the Clover hosted-iframe SDK.
 *
 * The public config is fetched on mount (a cheap JSON call), but the SDK script
 * — which injects Clover's branding footer + reCAPTCHA into the page — is only
 * loaded on demand, so the demo-token flow never pulls it in.
 */
export function useClover(): UseCloverResult {
  const [config, setConfig] = useState<CloverPublicConfig | null>(null);
  const [clover, setClover] = useState<CloverInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicConfig()
      .then((cfg) => !cancelled && setConfig(cfg))
      .catch(() => !cancelled && setConfig(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureLoaded = useCallback(() => {
    if (clover || loading) return;
    if (!config?.cardEntryEnabled || !config.publicKey) return;

    setLoading(true);
    loadCloverSdk(config.sdkUrl)
      .then((Clover) => {
        setClover(
          new Clover(config.publicKey!, {
            merchantId: config.merchantId ?? undefined,
          })
        );
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Clover SDK error")
      )
      .finally(() => setLoading(false));
  }, [clover, loading, config]);

  return {
    config,
    cardEntryEnabled: Boolean(config?.cardEntryEnabled),
    clover,
    loading,
    error,
    ensureLoaded,
  };
}
