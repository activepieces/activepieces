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
import dayjs from 'dayjs';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { newCompanyOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof twentyAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const records = await twentyApi.listRecentCompanies({ auth });

    return records.map((item) => ({
      epochMilliSeconds: dayjs(item.createdAt).valueOf(),
      data: item,
    }));
  },
};

export const newCompanyTrigger = createTrigger({
  auth: twentyAuth,
  name: 'new_company',
  outputSchema: newCompanyOutputSchema,
  classification: 'READ',
  displayName: 'New Company',
  description: 'Triggers when a new company is created in Twenty CRM.',
  aiMetadata: {
    description: 'Fires when a new company is created in the connected Twenty CRM workspace. Polls for recently created companies, emitting one event per newly added company.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: '404040-4040-4040',
    name: 'Acme Corp',
    domainName: 'acme.com',
    address: '123 Main St',
    employees: 50,
    createdAt: '2026-02-27T10:00:00Z',
  },
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
