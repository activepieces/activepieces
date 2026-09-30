import {
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_STORAGE_TTL_MS,
} from '@activepieces/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { acquisitionUtils } from '@/lib/acquisition-utils';

function makeStorage(): Storage {
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

function readStoredParams(storage: Storage): unknown {
  const raw = storage.getItem(ATTRIBUTION_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || !('params' in parsed)) {
    return parsed;
  }
  return parsed.params;
}

function writeStash({
  storage,
  params,
  capturedAt,
}: {
  storage: Storage;
  params: unknown;
  capturedAt: number;
}): void {
  storage.setItem(
    ATTRIBUTION_STORAGE_KEY,
    JSON.stringify({ params, capturedAt }),
  );
}

describe('acquisitionUtils', () => {
  let localStorage: Storage;

  beforeEach(() => {
    localStorage = makeStorage();
    vi.stubGlobal('localStorage', localStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('stashes every known attribution param from the landing URL', () => {
    stubLocation(
      '?utm_source=google&utm_medium=cpc&gclid=g123&ap_cta=hero&ap_landing=/pricing&ap_referrer=news&ap_sid=s1&irrelevant=x',
    );
    acquisitionUtils.stashAcquisitionParams();
    expect(readStoredParams(localStorage)).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      gclid: 'g123',
      ap_cta: 'hero',
      ap_landing: '/pricing',
      ap_referrer: 'news',
      ap_sid: 's1',
    });
  });

  it('records when the stash was captured', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    stubLocation('?utm_source=google');
    acquisitionUtils.stashAcquisitionParams();
    expect(JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)!)).toEqual({
      params: { utm_source: 'google' },
      capturedAt: Date.now(),
    });
  });

  it('does not stash when the URL has no acquisition params', () => {
    stubLocation('?foo=bar');
    acquisitionUtils.stashAcquisitionParams();
    expect(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
  });

  it('first touch wins while the stash is unexpired', () => {
    stubLocation('?utm_source=google');
    acquisitionUtils.stashAcquisitionParams();
    stubLocation('?utm_source=facebook&fbclid=f1');
    acquisitionUtils.stashAcquisitionParams();
    expect(readStoredParams(localStorage)).toEqual({ utm_source: 'google' });
  });

  it('lets a new touch replace an expired stash', () => {
    writeStash({
      storage: localStorage,
      params: { utm_source: 'google' },
      capturedAt: Date.now() - ATTRIBUTION_STORAGE_TTL_MS - 1,
    });
    stubLocation('?utm_source=facebook');
    acquisitionUtils.stashAcquisitionParams();
    expect(readStoredParams(localStorage)).toEqual({ utm_source: 'facebook' });
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

  it('treats an expired stash as absent', () => {
    writeStash({
      storage: localStorage,
      params: { utm_source: 'google' },
      capturedAt: Date.now() - ATTRIBUTION_STORAGE_TTL_MS - 1,
    });
    stubLocation('?utm_source=bing');
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_source: 'bing',
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
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, 'not-json{');
    stubLocation('?utm_source=bing');
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_source: 'bing',
    });
  });

  it('ignores a legacy stash without a capture time', () => {
    localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ utm_source: 'legacy' }),
    );
    stubLocation('?utm_source=bing');
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_source: 'bing',
    });
  });

  it('filters unknown keys and non-string values out of the stash', () => {
    writeStash({
      storage: localStorage,
      params: {
        utm_source: 'x',
        evil: 'y',
        utm_medium: 42,
        fbclid: '',
      },
      capturedAt: Date.now(),
    });
    stubLocation('');
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_source: 'x',
    });
  });

  it('clearAcquisitionParams removes the stash', () => {
    stubLocation('?utm_source=google');
    acquisitionUtils.stashAcquisitionParams();
    acquisitionUtils.clearAcquisitionParams();
    expect(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
    stubLocation('');
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({});
  });

  it('survives localStorage throwing (storage disabled)', () => {
    vi.stubGlobal('localStorage', {
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
    stubLocation('?utm_source=google');
    expect(() => acquisitionUtils.stashAcquisitionParams()).not.toThrow();
    expect(() => acquisitionUtils.clearAcquisitionParams()).not.toThrow();
    expect(acquisitionUtils.getAcquisitionParams()).toEqual({
      utm_source: 'google',
    });
  });
});
