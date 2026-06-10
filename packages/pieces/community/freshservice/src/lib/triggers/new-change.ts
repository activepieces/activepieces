import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { FreshserviceChange } from '../common/props';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freshserviceAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const response = await freshserviceApiCall<{
      changes: FreshserviceChange[];
    }>({
      method: HttpMethod.GET,
      endpoint: 'changes',
      auth,
      queryParams: {
        order_by: 'created_at',
        order_type: 'desc',
        per_page: lastFetchEpochMS === 0 ? '10' : '100',
      },
    });

    return response.body.changes.map((change) => ({
      epochMilliSeconds: new Date(change.created_at).getTime(),
      data: change,
    }));
  },
};

export const newChange = createTrigger({
  auth: freshserviceAuth,
  name: 'new_change',
  displayName: 'New Change',
  description: 'Triggers when a new change request is created in Freshservice.',
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
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
