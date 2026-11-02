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
import { freshserviceListPages } from '../common/client';
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
            queryParams: {},
          })
        : await freshserviceListPages<FreshserviceChange>({
            auth,
            endpoint: 'changes',
            key: 'changes',
            queryParams: { updated_since: new Date(lastFetchEpochMS).toISOString() },
          });
    return records.map((record) => ({
      epochMilliSeconds: new Date(record.updated_at).getTime(),
      data: record,
    }));
  },
};

export const updatedChange = createTrigger({
  auth: freshserviceAuth,
  name: 'updated_change',
  classification: 'READ',
  outputSchema: freshserviceSchemas.change,
  displayName: 'Updated Change',
  description: 'Triggers when an existing change request is updated in Freshservice. Note: newly created changes may also fire this trigger because their updated_at matches created_at.',
  aiMetadata: {
    description: 'Fires when an existing change request is modified in Freshservice (e.g. status, risk, or schedule change), representing the latest state of that change. Polls every page of records since the last check, by last-updated time across all changes; note that newly created changes can also fire this because their updated time initially equals their creation time.',
  },
  props: {},
  sampleData: {
    id: 1,
    subject: 'Upgrade server RAM',
    description: '<div>Upgrade RAM on production server from 16GB to 32GB.</div>',
    status: 2,
    priority: 3,
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
    updated_at: '2025-01-15T11:45:00Z',
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
