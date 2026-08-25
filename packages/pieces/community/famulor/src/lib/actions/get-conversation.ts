import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getConversation = createAction({
  auth: famulorAuth,
  name: 'getConversation',
  displayName: 'Get Conversation',
  description: 'Retrieve the full message history for a conversation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the complete message history of one conversation by its UUID. Use to read prior turns before deciding how to reply or to inspect a thread\'s contents. Read-only and idempotent.',
    idempotent: true,
  },
  props: famulorCommon.getConversationProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getConversationSchema);

    return await famulorCommon.getConversation({
      auth: auth.secret_text,
      uuid: propsValue.uuid as string,
    });
  },
});
