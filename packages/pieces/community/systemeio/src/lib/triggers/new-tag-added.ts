import { createTrigger, TriggerStrategy, PiecePropValueSchema, Polling, DedupeStrategy, pollingHelper, Property } from '@activepieces/pieces-common';
import { systemeioAuth } from '../../';
import { SystemeioApiClient } from '../auth';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof systemeioAuth>, { tag: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const client = new SystemeioApiClient(auth as string);
    const result = await client.request({
      method: 'GET',
      path: '/contacts',
      queryParams: {
        tag: propsValue.tag,
        startingAfter: lastFetchEpochMS ? dayjs(lastFetchEpochMS).toISOString() : undefined,
        limit: '100',
        order: 'desc',
      },
    });
    return result.items.map((contact: any) => ({
      epochMilliSeconds: dayjs(contact.updatedAt).valueOf(),
      data: contact,
    }));
  },
};

export const systemeioNewTagAddedTrigger = createTrigger({
  auth: systemeioAuth,
  name: 'new_tag_added',
  displayName: 'New Tag Added to Contact',
  description: 'Triggers when a specific tag is assigned to a contact',
  props: {
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'The tag to monitor (e.g., "VIP")',
      required: true,
    }),
  },
  sampleData: {
    id: '123',
    email: 'example@domain.com',
    tags: ['VIP'],
    updatedAt: '2025-07-23T10:00:00Z',
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