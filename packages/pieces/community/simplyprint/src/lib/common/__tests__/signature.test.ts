import { describe, expect, it } from 'vitest';

import { simplyprintSignature } from '../signature';

const { generateWebhookSecret, verifySimplyprintSignature, extractSecretHeader } =
  simplyprintSignature;

describe('generateWebhookSecret', () => {
  it('returns a 64-character lowercase hex string', () => {
    const s = generateWebhookSecret();
    expect(s).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces distinct secrets on repeated calls', () => {
    const a = generateWebhookSecret();
    const b = generateWebhookSecret();
    expect(a).not.toBe(b);
  });
});

describe('verifySimplyprintSignature', () => {
  it('returns true for matching header + secret', () => {
    const secret = 'a'.repeat(64);
    expect(verifySimplyprintSignature(secret, secret)).toBe(true);
  });

  it('returns false when header is missing', () => {
    expect(verifySimplyprintSignature(undefined, 'abc')).toBe(false);
  });

  it('returns false when secret is missing', () => {
    expect(verifySimplyprintSignature('abc', undefined)).toBe(false);
  });

  it('returns false when both are missing', () => {
    expect(verifySimplyprintSignature(undefined, undefined)).toBe(false);
  });

  it('returns false for mismatched values of the same length', () => {
    const a = 'a'.repeat(64);
    const b = 'b'.repeat(64);
    expect(verifySimplyprintSignature(a, b)).toBe(false);
  });

  it('returns false when lengths differ (cannot run timing-safe compare)', () => {
    expect(verifySimplyprintSignature('short', 'much-longer-secret-value')).toBe(false);
  });

  it('returns false when either value is empty string', () => {
    expect(verifySimplyprintSignature('', 'abc')).toBe(false);
    expect(verifySimplyprintSignature('abc', '')).toBe(false);
  });

  it('handles freshly-generated secret end-to-end', () => {
    const secret = generateWebhookSecret();
    expect(verifySimplyprintSignature(secret, secret)).toBe(true);
    expect(verifySimplyprintSignature(secret + 'x', secret)).toBe(false);
  });
});

describe('extractSecretHeader', () => {
  it('finds the header under the AP-lowercased key', () => {
    expect(extractSecretHeader({ 'x-sp-secret': 'abc' })).toBe('abc');
  });

  it("falls back to canonical casing if the proxy didn't lowercase", () => {
    expect(extractSecretHeader({ 'X-SP-Secret': 'def' })).toBe('def');
  });

  it('falls back to mixed casing some proxies emit', () => {
    expect(extractSecretHeader({ 'X-Sp-Secret': 'ghi' })).toBe('ghi');
  });

  it('returns undefined when the header is absent', () => {
    expect(extractSecretHeader({ 'content-type': 'application/json' })).toBeUndefined();
    expect(extractSecretHeader({})).toBeUndefined();
  });

  it('prefers the lowercase variant when multiple casings are present', () => {
    expect(
      extractSecretHeader({ 'x-sp-secret': 'winner', 'X-SP-Secret': 'loser' }),
    ).toBe('winner');
  });
});
