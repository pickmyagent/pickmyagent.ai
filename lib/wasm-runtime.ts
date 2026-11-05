/**
 * iOS Safari is not cross-origin isolated, so a threaded WASM session can throw
 * before the first embedding. The asyncify build runs one thread without
 * SharedArrayBuffer. Desktop uses the same single thread so the path matches.
 */

export type WasmSessionPlan = {
  numThreads: number;
  proxy: false;
  fileStem: "ort-wasm-simd-threaded.asyncify";
};

export function wasmSessionPlan(input: { userAgent?: string; crossOriginIsolated?: boolean }): WasmSessionPlan {
  const agent = input.userAgent ?? "";
  const iOS = /iPad|iPhone|iPod/i.test(agent) || (/Macintosh/i.test(agent) && /Mobile/i.test(agent));
  // Both branches stay on the single-thread asyncify build. The flags are read
  // so a future threaded desktop path can branch without changing the iOS one.
  void iOS;
  void input.crossOriginIsolated;
  return {
    numThreads: 1,
    proxy: false,
    fileStem: "ort-wasm-simd-threaded.asyncify",
  };
}
