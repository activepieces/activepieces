import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { federatedLoginRedirect } from '@/lib/federated-login-redirect';

const STORAGE_KEY = 'federatedLoginRedirect';

function makeSessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  };
}

describe('federatedLoginRedirect', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', makeSessionStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips a same-site path', () => {
    federatedLoginRedirect.save('/mcp-authorize?authRequestId=abc');

    expect(federatedLoginRedirect.consume()).toBe(
      '/mcp-authorize?authRequestId=abc',
    );
  });

  it('clears the value once consumed, so a later login is not hijacked', () => {
    federatedLoginRedirect.save('/mcp-authorize');

    expect(federatedLoginRedirect.consume()).toBe('/mcp-authorize');
    expect(federatedLoginRedirect.consume()).toBeNull();
  });

  it('returns null when nothing was saved', () => {
    expect(federatedLoginRedirect.consume()).toBeNull();
  });

  it.each([
    ['protocol-relative', '//evil.com'],
    ['backslash-escaped', '/\\evil.com'],
    ['absolute url', 'https://evil.com'],
    ['bare path', 'flows'],
    ['empty', ''],
  ])('refuses to store an off-site redirect (%s)', (_name, value) => {
    federatedLoginRedirect.save(value);

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(federatedLoginRedirect.consume()).toBeNull();
  });

  it.each([
    ['protocol-relative', '//evil.com'],
    ['backslash-escaped', '/\\evil.com'],
    ['absolute url', 'https://evil.com'],
  ])(
    'refuses to return an off-site redirect planted directly in storage (%s)',
    (_name, value) => {
      sessionStorage.setItem(STORAGE_KEY, value);

      expect(federatedLoginRedirect.consume()).toBeNull();
    },
  );

  it('does not throw when sessionStorage is unavailable', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    });

    expect(() => federatedLoginRedirect.save('/flows')).not.toThrow();
    expect(federatedLoginRedirect.consume()).toBeNull();
  });

  it('handles null and undefined without storing anything', () => {
    federatedLoginRedirect.save(null);
    federatedLoginRedirect.save(undefined);

    expect(federatedLoginRedirect.consume()).toBeNull();
  });
});
