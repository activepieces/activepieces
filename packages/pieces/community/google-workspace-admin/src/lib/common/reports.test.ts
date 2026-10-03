import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleWorkspaceAdminAuthValue } from '../auth';
import { googleAdminClient } from './client';
import { reportsHelpers } from './reports';

describe('reportsHelpers.createActivityPoller', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('emits matching events once, oldest first, including late arrivals', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-30T10:00:00.000Z'));
    const context = createContext();
    const poller = reportsHelpers.createActivityPoller<Record<string, unknown>>({
      getQuery: () => ({ application: 'admin', filter: (e) => e.event_name === 'CREATE_USER' }),
    });
    const listAll = vi.spyOn(googleAdminClient, 'listAll');

    await poller.onEnable(context);

    vi.setSystemTime(new Date('2026-09-30T10:05:00.000Z'));
    listAll.mockResolvedValueOnce([activity({ time: '2026-09-30T10:04:00.000Z', qualifier: 'b' })]);
    const first = await poller.poll(context);
    expect(first).toEqual([expect.objectContaining({ unique_qualifier: 'b', user_email: 'b@x.com', group_email: null })]);
    expect(listAll.mock.calls[0][0].queryParams?.startTime).toBe('2026-09-30T10:00:00.000Z');

    vi.setSystemTime(new Date('2026-09-30T10:10:00.000Z'));
    listAll.mockResolvedValueOnce([
      activity({ time: '2026-09-30T10:04:00.000Z', qualifier: 'b' }),
      activity({ time: '2026-09-30T10:02:00.000Z', qualifier: 'late' }),
    ]);
    const second = await poller.poll(context);
    expect(second.map((e) => (typeof e === 'object' && e !== null ? Reflect.get(e, 'unique_qualifier') : e))).toEqual(['late']);
  });

  it('never re-emits events beyond the seen-key cap', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-30T10:00:00.000Z'));
    const context = createContext();
    const poller = reportsHelpers.createActivityPoller<Record<string, unknown>>({
      getQuery: () => ({ application: 'admin', filter: (e) => e.event_name === 'CREATE_USER' }),
    });
    const listAll = vi.spyOn(googleAdminClient, 'listAll');
    await poller.onEnable(context);

    const burst = Array.from({ length: 4001 }, (_, i) =>
      activity({ time: new Date(Date.parse('2026-09-30T10:04:00.000Z') - i * 10).toISOString(), qualifier: `e${i}` }),
    );
    vi.setSystemTime(new Date('2026-09-30T10:05:00.000Z'));
    listAll.mockResolvedValueOnce(burst);
    expect(await poller.poll(context)).toHaveLength(4001);

    vi.setSystemTime(new Date('2026-09-30T10:10:00.000Z'));
    listAll.mockResolvedValueOnce(burst);
    expect(await poller.poll(context)).toEqual([]);
  });
});

function createContext() {
  const data = new Map<string, string>();
  const auth: GoogleWorkspaceAdminAuthValue = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { serviceAccount: '{}', adminEmail: 'admin@x.com' },
  };
  return {
    auth,
    propsValue: {},
    store: {
      get: async <T>(key: string): Promise<T | null> => {
        const value = data.get(key);
        return value === undefined ? null : JSON.parse(value);
      },
      put: async <T>(key: string, value: T) => {
        data.set(key, JSON.stringify(value));
        return value;
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

function activity({ time, qualifier }: { time: string; qualifier: string }) {
  return {
    id: { time, uniqueQualifier: qualifier, applicationName: 'admin' },
    actor: { email: 'admin@x.com' },
    events: [
      { type: 'USER_SETTINGS', name: 'CREATE_USER', parameters: [{ name: 'USER_EMAIL', value: `${qualifier}@x.com` }] },
      { type: 'GROUP_SETTINGS', name: 'CREATE_GROUP', parameters: [{ name: 'GROUP_EMAIL', value: 'g@x.com' }] },
    ],
  };
}
