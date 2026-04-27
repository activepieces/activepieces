/**
 * Polyfills stub — all browser polyfills (indexedDB, window, navigator) were removed.
 * @hcengineering packages guard browser globals with typeof checks, so no polyfills are needed in Node.js.
 * Setting window on globalThis was actively harmful: it defeated browser-detection guards
 * (e.g. account-client adding credentials:"include" to fetch).
 */
