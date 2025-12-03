import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { instabaseAuth } from '../../index';
import { makeInstabaseApiCall } from '../common';

type Conversation = {
  id: string;
  name: string;
  description?: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof instabaseAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await makeInstabaseApiCall<{ conversations: Conversation[] }>(
      auth,
      '/v2/conversations',
      HttpMethod.GET
    );

    const conversations = response.conversations || [];

    const items = conversations.map((conversation) => ({
      epochMilliSeconds: Date.now(),
      data: conversation,
    }));

    return items;
  },
};

export const newConversationTrigger = createTrigger({
  auth: instabaseAuth,
  name: 'new_conversation',
  displayName: 'New Conversation',
  description: 'Triggers when a new conversation is created',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'conv_123',
    name: 'Sample Conversation',
    description: 'A sample conversation for testing',
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
