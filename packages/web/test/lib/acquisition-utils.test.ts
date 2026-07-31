import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { acquisitionUtils } from '@/lib/acquisition-utils';

const STORAGE_KEY = 'ap_acquisition_params';

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

function stubLocation(search: string): void {
  vi.stubGlobal('window', { location: { search } });
}

describe('acquisitionUtils', () => {
  let sessionStorage: Storage;

  beforeEach(() => {
    sessionStorage = makeSessionStorage();
    vi.stubGlobal('sessionStorage', sessionStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stashes known params from the landing URL', () => {
    stubLocation(
      '?utm_source=google&utm_medium=cpc&gclid=g123&ap_cta=hero&irrelevant=x',
    );
    acquisitionUtils.stashAcquisitionParams();
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      gclid: 'g123',
      ap_cta: 'hero',
    });
  });

  it('does not stash when the URL has no acquisition params', () => {
    stubLocation('?foo=bar');
    acquisitionUtils.stashAcquisitionParams();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('first touch wins: a later stash never overwrites', () => {
    stubLocation('?utm_source=google');
    acquisitionUtils.stashAcquisitionParams();
    stubLocation('?utm_source=facebook&fbclid=f1');
    acquisitionUtils.stashAcquisitionParams();
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)).toEqual({
      utm_source: 'google',
    });
  });

  it('getAcquisitionParams prefers the stash over the current URL', () => {
    stubLocation('?utm_source=google&ref=/pricing');
    acquisitionUtils.stashAcquisitionParams();
    stubLocation('');
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_source: 'google',
      ref: '/pricing',
    });
  });

  it('falls back to the current URL when there is no stash', () => {
    stubLocation('?utm_campaign=spring&utm_term=flows');
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_campaign: 'spring',
      utm_term: 'flows',
    });
  });

  it('ignores a corrupt stash and falls back to the URL', () => {
    sessionStorage.setItem(STORAGE_KEY, 'not-json{');
    stubLocation('?utm_source=bing');
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_source: 'bing',
    });
  });

  it('filters unknown keys and non-string values out of the stash', () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        utm_source: 'x',
        evil: 'y',
        utm_medium: 42,
        fbclid: '',
      }),
    );
    stubLocation('');
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_source: 'x',
    });
  });

  it('survives sessionStorage throwing (storage disabled)', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    stubLocation('?utm_source=google');
    expect(() => acquisitionUtils.stashAcquisitionParams()).not.toThrow();
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_source: 'google',
    });
  });
});
