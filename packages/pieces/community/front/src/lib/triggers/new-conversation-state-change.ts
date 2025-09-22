import {
  createTrigger,
  TriggerStrategy,
  Property,
  PiecePropValueSchema,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';

import { conversationIdDropdown } from '../common/dropdown';

const props = {
  conversation_id: conversationIdDropdown,
  desired_state: Property.StaticDropdown({
    displayName: 'Desired State',
    description:
      'The state to trigger on (e.g., open, archived, deleted, assigned, etc.).',
    required: true,
    options: {
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Archived', value: 'archived' },
        { label: 'Deleted', value: 'deleted' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Unassigned', value: 'unassigned' },
      ],
    },
  }),
};
const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { conversation_id, desired_state } = propsValue;
    const conv = await makeRequest(
      auth as unknown as string,
      HttpMethod.GET,
      `/conversations/${conversation_id}`
    );
    const stateChangedAt = conv.updated_at
      ? Math.floor(Number(conv.updated_at) * 1000)
      : null;

    // Only emit if the state matches and it's new since last poll
    if (
      conv.status === desired_state &&
      stateChangedAt !== null &&
      (!lastFetchEpochMS || stateChangedAt > lastFetchEpochMS)
    ) {
      return [
        {
          epochMilliSeconds: stateChangedAt,
          data: conv,
        },
      ];
    }
    return [];
  },
};

export const newConversationStateChange = createTrigger({
  auth: frontAuth,
  name: 'newConversationStateChange',
  displayName: 'New Conversation State Change',
  description: 'Triggers when a conversation changes to a specified state.',
  props,
  sampleData: {
    id: 'cnv_yo1kg5q',
    subject: 'How to prank Dwight Schrute',
    status: 'assigned',
    status_id: 'sts_5x',
    status_category: 'resolved',
    created_at: 1701292649.333,
    updated_at: 1701806790.536,
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, {
      store,
      auth,
      propsValue,
      files,
    });
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
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, {
      store,
      auth,
      propsValue,
      files,
    });
  },
});
