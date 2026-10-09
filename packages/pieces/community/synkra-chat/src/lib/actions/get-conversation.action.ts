import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const getConversationAction = createAction({
  auth: synkraChatAuth,
  name: 'get_conversation',
  displayName: 'Get Conversation',
  description: 'Fetch a single conversation by its ID.',
  props: {
    conversation_id: Property.Number({ displayName: 'Conversation ID', required: true }),
  },
  async run({ auth, propsValue }) {
    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.GET,
      path: `/conversations/${propsValue.conversation_id}`,
    });
  },
});
