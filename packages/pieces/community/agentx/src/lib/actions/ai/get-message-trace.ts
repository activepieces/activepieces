import { createAction, Property } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxApi } from '../../common/api';

export const getMessageTraceAction = createAction({
  auth: agentxAuth,
  name: 'agentx_get_message_trace',
  displayName: 'Get Message Trace',
  description: 'Gets the trace ID of an AgentX message.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the prompt trace ID of one AgentX message (message ID from Get Conversation). Send Message already returns the trace ID of its reply, so use this for older messages; pass the result to Get Trace.',
    idempotent: true,
  },
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'AgentX message ID, from the messages in Get Conversation.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await agentxApi.getMessageTrace({
      auth,
      messageId: propsValue.messageId,
    });
  },
});
