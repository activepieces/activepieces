import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getConversation = createAction({
  auth: famulorAuth,
  name: 'getConversation',
  displayName: 'Get Conversation',
  description: 'Retrieve the full message history for a conversation.',
  props: famulorCommon.getConversationProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getConversationSchema);

    return await famulorCommon.getConversation({
      auth: auth.secret_text,
      uuid: propsValue.uuid as string,
    });
  },
});
