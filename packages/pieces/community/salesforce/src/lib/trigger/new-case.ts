import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { querySalesforceApi } from '../common';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';

export const newCaseCreatedTrigger = createTrigger({
  auth: salesforceAuth,
  name: 'new_case',
  displayName: 'New Case',
  description: 'Triggers when a new Case record is created.',
  props: {},
  sampleData: undefined,
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, ctx);
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, ctx);
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, ctx);
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
});

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof salesforceAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const isoDate = dayjs(lastFetchEpochMS).toISOString();

    const isTest = lastFetchEpochMS === 0;

    const query = `
            SELECT FIELDS(ALL)
            FROM Case
            ${isTest ? '' : `WHERE CreatedDate > ${isoDate}`}
            ORDER BY CreatedDate DESC
            LIMIT ${isTest ? 10 : 200}
        `;

    const response = await querySalesforceApi<{
      records: { CreatedDate: string }[];
    }>(HttpMethod.GET, auth, query);

    const records = response.body?.['records'] || [];

    return records.map((record: { CreatedDate: string }) => ({
      epochMilliSeconds: dayjs(record.CreatedDate).valueOf(),
      data: record,
    }));
  },
};
