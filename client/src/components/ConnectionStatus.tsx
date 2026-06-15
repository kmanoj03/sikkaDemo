import type { ConnectionInfo } from "../api";

/**
 * Shows the current Clover auth mode in the header. When connected via OAuth
 * we show a status pill + Disconnect; otherwise a "Connect Clover" button that
 * kicks off the OAuth flow (a full navigation to the backend, which redirects
 * to Clover).
 *
 * Note: "connected" means our backend holds a stored OAuth token. Disconnect
 * only drops our copy — it doesn't revoke the grant on Clover's side.
 */
export function ConnectionStatus({
  info,
  onDisconnect,
}: {
  info: ConnectionInfo | null;
  onDisconnect: () => void;
}) {
  if (!info) return null;

  if (info.mode === "oauth") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Clover connected
        </span>
        <button
          type="button"
          onClick={onDisconnect}
          className="rounded-full border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-indigo-200 transition hover:bg-white/5"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {info.mode === "test" && (
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-indigo-200">
          Test-token mode
        </span>
      )}
      <a
        href="/api/clover/oauth/connect"
        className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-brand-600 shadow-sm transition hover:-translate-y-px"
      >
        Connect Clover
      </a>
    </div>
  );
}
