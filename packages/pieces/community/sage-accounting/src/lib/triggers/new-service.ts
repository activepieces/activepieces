import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { newServiceTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageAccountingAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items = await sageAccountingClient.listAll<ServicePollRecord>({
      accessToken: auth.access_token,
      path: sageAccountingClient.paths.services,
      query: {
        ...(lastFetchEpochMS > 0
          ? { updated_or_created_since: new Date(lastFetchEpochMS).toISOString() }
          : {}),
      },
    });

    return items.map((record) => ({
      epochMilliSeconds: new Date(record.created_at).getTime(),
      data: record,
    }));
  },
};

export const newServiceTrigger = createTrigger({
  auth: sageAccountingAuth,
  name: 'new_service',
  classification: 'READ',
  displayName: 'New Service',
  description: 'Triggers when a new service is created in Sage Accounting.',
  aiMetadata: {
    description: 'Fires once for each new service created in Sage Accounting.',
  },
  outputSchema: newServiceTriggerOutputSchema,
  props: {},
  sampleData: {
    id: 's1s2s3s4',
    description: 'Website Maintenance',
    item_code: 'WEB-MAINT',
    cost_price: 30,
    active: true,
    created_at: '2026-01-15T10:30:00Z',
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

type ServicePollRecord = {
  id: string;
  description: string;
  item_code: string | null;
  cost_price: number | null;
  active: boolean;
  created_at: string;
};
