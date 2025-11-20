// Tanpa 'any' — gunakan type guard berbasis 'unknown'
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function getString(o: Record<string, unknown>, k: string): string | undefined {
  const v = o[k];
  return typeof v === "string" ? v : undefined;
}

/** True jika error berasal dari pembatalan request (fetch AbortController / axios cancel) */
export function isAbortLike(err: unknown): boolean {
  // AbortController (fetch)
  if (err instanceof DOMException && err.name === "AbortError") return true;

  if (isRecord(err)) {
    const name = getString(err, "name");
    const code = getString(err, "code");
    const message = getString(err, "message");

    if (name === "AbortError") return true;         // fetch
    if (code === "ERR_CANCELED") return true;       // axios v1
    if (message && /aborted|canceled/i.test(message)) return true; // fallback
  }
  return false;
}
