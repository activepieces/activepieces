import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const sendMessageAction = createAction({
  auth: synkraChatAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send an outgoing message to a Synkra Chat conversation.',
  props: {
    conversation_id: Property.Number({
      displayName: 'Conversation ID',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
    private_note: Property.Checkbox({
      displayName: 'Send as internal note',
      description: 'When on, the message is visible only to your team.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.POST,
      path: `/conversations/${propsValue.conversation_id}/messages`,
      body: {
        content: propsValue.content,
        message_type: 'outgoing',
        private: propsValue.private_note ?? false,
      },
    });
  },
});
