import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceListPages, reachedCreatedBefore } from '../common/client';
import { freshserviceSchemas } from '../common/schemas';
import { FreshserviceChange } from '../common/props';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freshserviceAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const records =
      lastFetchEpochMS === 0
        ? await freshserviceListPages<FreshserviceChange>({
            auth,
            endpoint: 'changes',
            key: 'changes',
            perPage: 10,
            maxPages: 1,
            allowTruncation: true,
            queryParams: {},
          })
        : await freshserviceListPages<FreshserviceChange>({
            auth,
            endpoint: 'changes',
            key: 'changes',
            queryParams: {
              updated_since: new Date(lastFetchEpochMS).toISOString(),
              order_by: 'created_at',
              order_type: 'desc',
            },
            stopWhen: (pageItems) => reachedCreatedBefore({ pageItems, epochMs: lastFetchEpochMS }),
          });
    return records.map((record) => ({
      epochMilliSeconds: new Date(record.created_at).getTime(),
      data: record,
    }));
  },
};

export const newChange = createTrigger({
  auth: freshserviceAuth,
  name: 'new_change',
  classification: 'READ',
  outputSchema: freshserviceSchemas.change,
  displayName: 'New Change',
  description: 'Triggers when a new change request is created in Freshservice.',
  aiMetadata: {
    description: 'Fires when a new change request is created in Freshservice, representing a freshly proposed IT change entering change management. Polls every page of records since the last check, by creation time across all changes in the account.',
  },
  props: {},
  sampleData: {
    id: 1,
    subject: 'Upgrade server RAM',
    description: '<div>Upgrade RAM on production server from 16GB to 32GB.</div>',
    status: 1,
    priority: 2,
    impact: 2,
    risk: 2,
    change_type: 2,
    requester_id: 1,
    agent_id: 5,
    department_id: 2,
    group_id: 1,
    planned_start_date: '2025-01-20T08:00:00Z',
    planned_end_date: '2025-01-20T12:00:00Z',
    created_at: '2025-01-15T09:30:00Z',
    updated_at: '2025-01-15T09:30:00Z',
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.test(polling, context);
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
