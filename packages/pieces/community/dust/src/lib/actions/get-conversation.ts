import { createAction, Property } from '@activepieces/pieces-framework';
import { getConversationContent, timeoutProp } from '../common';
import { dustAuth } from '../..';

export const getConversation = createAction({
  name: 'getConversation',
  displayName: 'Get existing conversation',
  description: 'Get an existing conversation',
  audience: 'both',
  aiMetadata: {
    description:
      "Fetch an existing Dust conversation and its content by conversation sID. Use to read the assistant's latest answer or the message history for a known conversation. Read-only and idempotent.",
    idempotent: true,
  },
  auth: dustAuth,
  props: {
    conversationSid: Property.ShortText({
      displayName: 'Conversation sID',
      required: true,
    }),
    timeout: timeoutProp,
  },
  async run({ auth, propsValue }) {
    return await getConversationContent(
      propsValue.conversationSid,
      propsValue.timeout,
      auth.props
    );
  },
});
