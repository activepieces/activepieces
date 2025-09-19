import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof frontAuth>, { inbox_id?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    
    const params: string[] = ['q[types]=tag', 'limit=50'];
    if (propsValue.inbox_id) {
      params.push(`q[inboxes]=${encodeURIComponent(propsValue.inbox_id)}`);
    }
    const query = params.join('&');
    const response = await makeRequest(
      auth.access_token,
      HttpMethod.GET,
      `/events?${query}`
    );
    const events = response._results || [];
    const tagEvents: any[] = [];

    for (const event of events) {
      const createdAtMs = Math.floor(Number(event.created_at) * 1000);
      if (!lastFetchEpochMS || createdAtMs > lastFetchEpochMS) {
        tagEvents.push({
          epochMilliSeconds: createdAtMs,
          data: event,
        });
      }
    }
    return tagEvents;
  },
};

export const newTagAddedToMessage = createTrigger({
  auth: frontAuth,
  name: 'newTagAddedToMessage',
  displayName: 'New Tag Added to Message',
  description: 'Fires when a tag is applied to a conversation.',
  props: {
    inbox_id: Property.ShortText({
      displayName: 'Inbox ID',
      description: 'Filter events to a specific inbox (optional).',
      required: false,
    }),
  },
  sampleData: {
    id: 'evt_123',
    type: 'tag_added',
    tag: {
      id: 'tag_abc',
      name: 'VIP',
    },
    conversation_id: 'cnv_456',
    message_id: 'msg_789',
    created_at: 1701806790.536,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
})