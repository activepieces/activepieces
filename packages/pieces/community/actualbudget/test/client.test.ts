import fs from 'fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AUTH, fake } from './fake-api';

vi.mock('@actual-app/api', async () => (await import('./fake-api')).fake);

import {
  ActualBudgetError,
  mapSdkError,
  normalizeServerUrl,
  withBudget,
} from '../src/lib/common/client';
import { actualBudgetAuth } from '../src/lib/common/auth';

beforeEach(() => {
  vi.clearAllMocks();
  fake.state.order.length = 0;
  fake.state.initDelayMs = 0;
});

describe('withBudget', () => {
  test('opens the budget in a fresh temp dir, trims the URL, and treats an empty E2E password as none', async () => {
    let seenDir = '';
    await withBudget({
      auth: AUTH,
      fn: async () => {
        seenDir = fake.state.lastDataDir;
        expect(fs.existsSync(seenDir)).toBe(true);
      },
    });
    expect(fake.init).toHaveBeenCalledWith({
      dataDir: seenDir,
      serverURL: 'http://localhost:5006',
      password: 'pw',
    });
    expect(seenDir).toMatch(/ap-actual-/);
    expect(fake.downloadBudget).toHaveBeenCalledWith('sync-1', {
      password: undefined,
    });
    expect(fs.existsSync(seenDir)).toBe(false);
    expect(fake.shutdown).toHaveBeenCalledTimes(1);
  });

  test('shuts down and cleans up when the callback throws', async () => {
    await expect(
      withBudget({
        auth: AUTH,
        fn: async () => {
          throw new Error('boom');
        },
      })
    ).rejects.toThrow('boom');
    expect(fake.shutdown).toHaveBeenCalledTimes(1);
  });

  test('runs in the same worker are serialized (no interleaved init)', async () => {
    fake.state.initDelayMs = 20;
    await Promise.all([
      withBudget({ auth: AUTH, fn: async () => 1 }),
      withBudget({ auth: AUTH, fn: async () => 2 }),
      withBudget({ auth: AUTH, fn: async () => 3 }),
    ]);
    expect(fake.state.order).toEqual([
      'init',
      'shutdown',
      'init',
      'shutdown',
      'init',
      'shutdown',
    ]);
  });

  test('a failed run releases the lock for the next one', async () => {
    const first = withBudget({
      auth: AUTH,
      fn: async () => {
        throw new Error('x');
      },
    });
    const second = withBudget({ auth: AUTH, fn: async () => 'ok' });
    await expect(first).rejects.toThrow('x');
    await expect(second).resolves.toBe('ok');
  });
});

describe('server URL', () => {
  test('accepts http(s) with a sub-path and strips the trailing slash', () => {
    expect(normalizeServerUrl(' https://x.example.com/actual/ ')).toBe(
      'https://x.example.com/actual'
    );
  });
  test.each([
    'ftp://x',
    'localhost:5006',
    'https://user:pw@x.com',
    'https://x.com/?a=1',
  ])('refuses %s', (url) => {
    expect(() => normalizeServerUrl(url)).toThrow(ActualBudgetError);
  });
});

describe('error mapping', () => {
  test('maps SDK auth/network/budget errors to clear messages', () => {
    expect(
      mapSdkError({
        error: new Error('Authentication failed: invalid-password'),
        serverUrl: 'u',
      }).message
    ).toContain('rejected the password');
    expect(
      mapSdkError({
        error: new Error('Authentication failed: network-failure'),
        serverUrl: 'http://h',
      }).message
    ).toContain('Could not reach the Actual server at http://h');
    expect(
      mapSdkError({
        error: new Error('Budget "abc" not found. Check the sync id'),
        serverUrl: 'u',
      }).message
    ).toContain('Sync ID');
    const other = new Error('something else');
    expect(mapSdkError({ error: other, serverUrl: 'u' })).toBe(other);
  });
});

describe('auth validate', () => {
  test('invalid password → invalid with message', async () => {
    fake.downloadBudget.mockRejectedValueOnce(
      new Error('Authentication failed: invalid-password')
    );
    const result = await actualBudgetAuth.validate?.({
      auth: AUTH,
      server: { apiUrl: '', publicUrl: '' },
    });
    expect(result).toEqual({
      valid: false,
      error: expect.stringContaining('rejected the password'),
    });
    expect(fake.shutdown).toHaveBeenCalled();
  });
  test('valid connection', async () => {
    await expect(
      actualBudgetAuth.validate?.({
        auth: AUTH,
        server: { apiUrl: '', publicUrl: '' },
      })
    ).resolves.toEqual({ valid: true });
  });
});
