/**
 * Paved Path Concurrent Dev Server Orchestrator
 * Spawns both ConnectRPC Backend and Vite Dev Server concurrently.
 * Ensures zero zombie orphan processes on SIGINT/SIGTERM.
 */

const serverProc = Bun.spawn(["bun", "run", "server/index.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

const clientProc = Bun.spawn(["bun", "run", "dev:client"], {
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

function cleanup(signal?: string) {
  if (signal) {
    console.log(`\n[dev] Received ${signal}. Terminating dev processes...`);
  }
  try {
    serverProc.kill();
  } catch {}
  try {
    clientProc.kill();
  } catch {}
  process.exit(0);
}

process.on("SIGINT", () => cleanup("SIGINT"));
process.on("SIGTERM", () => cleanup("SIGTERM"));
process.on("exit", () => cleanup());
