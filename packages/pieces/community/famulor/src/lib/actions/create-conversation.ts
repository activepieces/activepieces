import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const createConversation = createAction({
  auth: famulorAuth,
  name: 'createConversation',
  displayName: 'Create Conversation',
  description: 'Create a new conversation session with an AI assistant. Use this to initiate a text-based chat session through your web widget or application.',
  props: famulorCommon.createConversationProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.createConversationSchema);

    return await famulorCommon.createConversation({
      auth: auth as string,
      assistant_id: propsValue.assistant_id as string,
      type: propsValue.type as 'widget' | 'test' | undefined,
      variables: propsValue.variables as Record<string, any> | undefined,
    });
  },
});
