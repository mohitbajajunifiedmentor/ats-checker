// Module-level store for passing upload state between pages.
// File objects and in-flight Promises can't go in localStorage/sessionStorage,
// but module-level variables persist across client-side navigation.

let _pendingFile: File | null = null;
let _pendingPromise: Promise<any> | null = null;

export const uploadStore = {
  setPendingFile(f: File | null)           { _pendingFile    = f; },
  getPendingFile(): File | null             { return _pendingFile; },

  setPendingPromise(p: Promise<any> | null) { _pendingPromise = p; },
  getPendingPromise(): Promise<any> | null  { return _pendingPromise; },

  clearAll() { _pendingFile = null; _pendingPromise = null; },
};
