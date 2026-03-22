import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getConversation = createAction({
  auth: famulorAuth,
  name: 'getConversation',
  displayName: 'Get Conversation',
  description:
    'Retrieve full message history for a conversation (oldest first). Pair with Create Conversation and Send Message for the full chat flow.',
  props: famulorCommon.getConversationProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getConversationSchema);

    return await famulorCommon.getConversation({
      auth: auth.secret_text,
      uuid: propsValue.uuid as string,
    });
  },
});
