import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const toggleConversationStatusAction = createAction({
  auth: synkraChatAuth,
  name: 'toggle_conversation_status',
  displayName: 'Change Conversation Status',
  description: 'Open, resolve, snooze, or set a conversation to pending.',
  props: {
    conversation_id: Property.Number({ displayName: 'Conversation ID', required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Snoozed', value: 'snoozed' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.POST,
      path: `/conversations/${propsValue.conversation_id}/toggle_status`,
      body: { status: propsValue.status },
    });
  },
});
