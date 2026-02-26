import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const generateAiReply = createAction({
  auth: famulorAuth,
  name: 'generateAiReply',
  displayName: 'Generate AI Reply',
  description: 'Generate an AI response using an assistant, identified by an external customer identifier. Rate limited to 5 requests per minute per API token.',
  props: famulorCommon.generateAiReplyProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.generateAiReplySchema);

    return await famulorCommon.generateAiReply({
      auth: auth as string,
      assistant_id: propsValue.assistant_id as number,
      customer_identifier: propsValue.customer_identifier as string,
      message: propsValue.message as string,
      variables: propsValue.variables as Record<string, any> | undefined,
    });
  },
});
