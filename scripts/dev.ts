/**
 * Paved Path Concurrent Dev Server Orchestrator
 * Spawns ConnectRPC Backend and Vite Dev Server concurrently without stdin contention.
 * Propagates unexpected child exits cleanly and terminates both children on SIGINT/SIGTERM.
 */

const serverProc = Bun.spawn(["bun", "run", "server/index.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  stdin: "ignore",
});

const clientProc = Bun.spawn(["bun", "run", "dev:client"], {
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

let shuttingDown = false;

async function terminateChildren(exitCode: number, reason?: string): Promise<never> {
  if (shuttingDown) {
    return new Promise<never>(() => {});
  }
  shuttingDown = true;

  if (reason) {
    console.log(`\n[dev] ${reason}. Terminating dev processes...`);
  }

  for (const proc of [serverProc, clientProc]) {
    try {
      if (proc.exitCode === null) {
        proc.kill("SIGTERM");
      }
    } catch {
      // Child already exited
    }
  }

  const graceTimeout = new Promise<void>((resolve) => {
    setTimeout(resolve, 3_000);
  });

  await Promise.race([Promise.allSettled([serverProc.exited, clientProc.exited]), graceTimeout]);

  for (const proc of [serverProc, clientProc]) {
    try {
      if (proc.exitCode === null) {
        proc.kill("SIGKILL");
      }
    } catch {
      // Ignore already-terminated child
    }
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => {
  void terminateChildren(0, "Received SIGINT");
});

process.on("SIGTERM", () => {
  void terminateChildren(0, "Received SIGTERM");
});

void Promise.race([
  serverProc.exited.then((code) => ({ name: "dev:server", code })),
  clientProc.exited.then((code) => ({ name: "dev:client", code })),
]).then(({ name, code }) => {
  if (shuttingDown) {
    return;
  }
  const exitCode = code === 0 ? 1 : code;
  void terminateChildren(exitCode, `${name} exited unexpectedly with code ${code}`);
});
