import { createTrigger, TriggerStrategy, PiecePropValueSchema, Polling, DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import { systemeioAuth } from '../../';
import { SystemeioApiClient } from '../auth';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof systemeioAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const client = new SystemeioApiClient(auth as string);
    const result = await client.request({
      method: 'GET',
      path: '/contacts',
      queryParams: {
        startingAfter: lastFetchEpochMS ? dayjs(lastFetchEpochMS).toISOString() : undefined,
        limit: '100',
        order: 'desc',
      },
    });
    return result.items.map((contact: any) => ({
      epochMilliSeconds: dayjs(contact.createdAt).valueOf(),
      data: contact,
    }));
  },
};

export const systemeioNewContactTrigger = createTrigger({
  auth: systemeioAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created in Systeme.io',
  props: {},
  sampleData: {
    id: '123',
    email: 'example@domain.com',
    name: 'John Doe',
    createdAt: '2025-07-23T10:00:00Z',
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