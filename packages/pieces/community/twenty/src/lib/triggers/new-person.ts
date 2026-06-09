import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { twentyAuth } from '../auth';
import { twentyRequest, parseRecords } from '../common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof twentyAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const body = await twentyRequest(
      auth,
      HttpMethod.GET,
      '/rest/people',
      undefined,
      { 'sort[createdAt]': 'desc', 'limit': '100' },
    );

    const records = parseRecords(body);

    return records.map((item) => ({
      epochMilliSeconds: dayjs(item['createdAt'] as string).valueOf(),
      data: item,
    }));
  },
};

export const newPerson = createTrigger({
  auth: twentyAuth,
  name: 'new_person',
  displayName: 'New Person',
  description: 'Triggers when a new person is created in Twenty CRM.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: '303030-3030-3030',
    name: {
      firstName: 'John',
      lastName: 'Doe',
    },
    emails: {
      primaryEmail: 'john@example.com',
    },
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
