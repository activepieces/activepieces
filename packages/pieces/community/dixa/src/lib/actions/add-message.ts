import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';
import {
  agentIdProp,
  conversationIdProp,
  directionProp,
  endUserIdProp,
} from '../common/props';

export const addMessage = createAction({
  auth: dixaAuth,
  name: 'add_message',
  displayName: 'Add Message',
  description:
    'Adds a message to an existing conversation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Post a new inbound or outbound message to an existing Dixa conversation. Use outbound direction with an agent ID when replying as an agent; inbound messages are attributed to the conversation requester.',
    idempotent: false,
  },
  props: {
    endUserId: endUserIdProp(),
    conversationId: conversationIdProp,
    content: Property.LongText({
      displayName: 'Content',
      description: 'Content of the message',
      required: true,
    }),
    direction: directionProp,
    agentId: agentIdProp({
      description: 'Required when direction is Outbound.',
      required: false,
      refreshers: ['direction'],
    }),
  },
  async run({ auth, propsValue }) {
    const { conversationId, content, direction, agentId } = propsValue;

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      `/conversations/${conversationId}/messages`,
      {
        agentId: direction === 'Outbound' ? agentId : undefined,
        content: {
          value: content,
          _type: 'Text',
        },
        _type: direction,
      }
    );
  },
});
