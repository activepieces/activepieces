import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { creditsAlertDismissal } from '@/features/billing/utils/credits-alert-dismissal';

function stubLocalStorage(store: Map<string, string>): void {
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
  });
}

function stubFailingLocalStorage(): void {
  vi.stubGlobal('window', {
    localStorage: {
      getItem: () => {
        throw new Error('storage disabled');
      },
      setItem: () => {
        throw new Error('storage disabled');
      },
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('creditsAlertDismissal.isActive', () => {
  it('is inactive when the alert was never dismissed', () => {
    expect(creditsAlertDismissal.isActive({ dismissedAt: undefined })).toBe(
      false,
    );
  });

  it('holds the alert back for the 24 hours after a dismissal', () => {
    expect(
      creditsAlertDismissal.isActive({ dismissedAt: dayjs().toISOString() }),
    ).toBe(true);
    expect(
      creditsAlertDismissal.isActive({
        dismissedAt: dayjs().subtract(23, 'hour').toISOString(),
      }),
    ).toBe(true);
  });

  it('lets the alert return once 24 hours have passed', () => {
    expect(
      creditsAlertDismissal.isActive({
        dismissedAt: dayjs().subtract(24, 'hour').toISOString(),
      }),
    ).toBe(false);
    expect(
      creditsAlertDismissal.isActive({
        dismissedAt: dayjs().subtract(10, 'day').toISOString(),
      }),
    ).toBe(false);
  });

  it('ignores a dismissal stamped in the future so clock skew cannot hide the alert', () => {
    expect(
      creditsAlertDismissal.isActive({
        dismissedAt: dayjs().add(5, 'hour').toISOString(),
      }),
    ).toBe(false);
  });
});

describe('creditsAlertDismissal.read', () => {
  it('returns nothing when no dismissal was stored', () => {
    stubLocalStorage(new Map());
    expect(creditsAlertDismissal.read({ platformId: 'platform-1' })).toBe(
      undefined,
    );
  });

  it('returns nothing when the stored value is not a timestamp', () => {
    stubLocalStorage(
      new Map([['ap-credits-alert-dismissed:platform-1', 'not-a-timestamp']]),
    );
    expect(creditsAlertDismissal.read({ platformId: 'platform-1' })).toBe(
      undefined,
    );
  });

  it('returns nothing when storage is unavailable instead of throwing', () => {
    stubFailingLocalStorage();
    expect(creditsAlertDismissal.read({ platformId: 'platform-1' })).toBe(
      undefined,
    );
  });

  it('reads back a timestamp it wrote', () => {
    stubLocalStorage(new Map());
    const dismissedAt = dayjs().toISOString();
    creditsAlertDismissal.write({ platformId: 'platform-1', dismissedAt });
    expect(creditsAlertDismissal.read({ platformId: 'platform-1' })).toBe(
      dismissedAt,
    );
  });

  it('keys dismissals per platform so switching platforms shows the alert again', () => {
    stubLocalStorage(new Map());
    creditsAlertDismissal.write({
      platformId: 'platform-1',
      dismissedAt: dayjs().toISOString(),
    });
    expect(creditsAlertDismissal.read({ platformId: 'platform-2' })).toBe(
      undefined,
    );
  });
});

describe('creditsAlertDismissal.write', () => {
  it('swallows a storage failure instead of breaking the dismiss click', () => {
    stubFailingLocalStorage();
    expect(() =>
      creditsAlertDismissal.write({
        platformId: 'platform-1',
        dismissedAt: dayjs().toISOString(),
      }),
    ).not.toThrow();
  });
});
