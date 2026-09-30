import { AppConnectionType } from '@activepieces/pieces-framework';
import { DedupeStrategy } from '@activepieces/pieces-common';
import { describe, expect, it, vi } from 'vitest';
import { googleAdminClient } from './client';
import { reportsHelpers } from './reports';

describe('reportsHelpers.createActivityPolling', () => {
  it('emits one item per matching event with flattened fields', async () => {
    vi.spyOn(googleAdminClient, 'listAll').mockResolvedValue([
      {
        id: { time: '2026-09-30T10:00:00.000Z', uniqueQualifier: 'q1', applicationName: 'admin' },
        actor: { email: 'admin@x.com' },
        events: [
          { type: 'USER_SETTINGS', name: 'CREATE_USER', parameters: [{ name: 'USER_EMAIL', value: 'jane@x.com' }] },
          { type: 'GROUP_SETTINGS', name: 'CREATE_GROUP', parameters: [{ name: 'GROUP_EMAIL', value: 'g@x.com' }] },
        ],
      },
    ]);
    const polling = reportsHelpers.createActivityPolling<Record<string, unknown>>({
      getQuery: () => ({ application: 'admin', filter: (e) => e.event_name === 'CREATE_USER' }),
    });
    if (polling.strategy !== DedupeStrategy.TIMEBASED) throw new Error('expected timebased');
    const items = await polling.items({
      auth: { type: AppConnectionType.CUSTOM_AUTH, props: { serviceAccount: '{}', adminEmail: 'admin@x.com' } },
      store: { get: async () => null, put: async (_key, value) => value, delete: async () => undefined },
      propsValue: {},
      lastFetchEpochMS: 1,
    });
    expect(items).toEqual([
      {
        epochMilliSeconds: Date.parse('2026-09-30T10:00:00.000Z'),
        data: expect.objectContaining({
          event_name: 'CREATE_USER',
          actor_email: 'admin@x.com',
          user_email: 'jane@x.com',
          group_email: null,
          parameters: { USER_EMAIL: 'jane@x.com' },
        }),
      },
    ]);
  });
});
