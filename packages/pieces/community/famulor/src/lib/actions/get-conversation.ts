import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getConversation = createAction({
  auth: famulorAuth,
  name: 'getConversation',
  displayName: 'Get Conversation',
  description: 'Retrieve the complete message history of an existing conversation. Use this to display previous messages when resuming a conversation or to review conversation content.',
  props: famulorCommon.getConversationProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getConversationSchema);

    return await famulorCommon.getConversation({
      auth: auth as string,
      uuid: propsValue.uuid as string,
    });
  },
});
