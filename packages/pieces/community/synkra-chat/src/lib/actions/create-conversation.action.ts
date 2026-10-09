import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const createConversationAction = createAction({
  auth: synkraChatAuth,
  name: 'create_conversation',
  displayName: 'Create Conversation',
  description: 'Start a new conversation with a contact.',
  props: {
    contact_id: Property.Number({ displayName: 'Contact ID', required: true }),
    inbox_id: Property.Number({ displayName: 'Inbox ID', required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'open',
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Snoozed', value: 'snoozed' },
        ],
      },
    }),
    first_message: Property.LongText({
      displayName: 'Opening Message',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      contact_id: propsValue.contact_id,
      inbox_id: propsValue.inbox_id,
      status: propsValue.status ?? 'open',
    };
    if (propsValue.first_message) {
      body.message = { content: propsValue.first_message };
    }
    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/conversations',
      body,
    });
  },
});
