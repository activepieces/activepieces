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
import { newPersonOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof twentyAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const records = await twentyApi.listRecentPeople({ auth });

    return records.map((item) => ({
      epochMilliSeconds: dayjs(item.createdAt).valueOf(),
      data: item,
    }));
  },
};

export const newPersonTrigger = createTrigger({
  auth: twentyAuth,
  name: 'new_person',
  outputSchema: newPersonOutputSchema,
  classification: 'READ',
  displayName: 'New Person',
  description: 'Triggers when a new person is created in Twenty CRM.',
  aiMetadata: {
    description: 'Fires when a new person (contact) is created in the connected Twenty CRM workspace. Polls for recently created people, emitting one event per newly added person.',
  },
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
