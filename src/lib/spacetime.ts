import type { Identity } from "spacetimedb";

/**
 * SpacetimeDB Connection Listeners Configuration
 * Connects lifecycle callbacks on a SpacetimeDB connection builder to telemetry callbacks.
 */
export function setupConnectionListeners(
  builder: {
    onConnect: (cb: (conn: unknown, identity: Identity, token: string) => void) => unknown;
    onDisconnect: (cb: (ctx: unknown, error?: Error) => void) => unknown;
  },
  callbacks: {
    onConnected: (identity: string) => void;
    onDisconnected: () => void;
  },
) {
  builder.onConnect((_conn, identity) => {
    callbacks.onConnected(identity.toHexString());
  });
  builder.onDisconnect(() => {
    callbacks.onDisconnected();
  });
  return builder;
}
