/**
 * Polyfill for crypto.randomUUID() in non-secure contexts.
 *
 * crypto.randomUUID() requires a secure context (HTTPS or localhost).
 * In FIPS-enabled environments (e.g., RHEL 9) accessed over plain HTTP,
 * this function is unavailable and causes runtime errors from libraries
 * like @tanstack/db that depend on it.
 *
 * This polyfill uses crypto.getRandomValues() (available in all contexts)
 * to generate a spec-compliant v4 UUID when randomUUID is missing.
 */
if (
  typeof crypto !== 'undefined' &&
  typeof crypto.randomUUID !== 'function' &&
  typeof crypto.getRandomValues === 'function'
) {
  crypto.randomUUID =
    function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // Set version 4 (0100) in byte 6
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      // Set variant 1 (10xx) in byte 8
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
        12,
        16,
      )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    };
}
