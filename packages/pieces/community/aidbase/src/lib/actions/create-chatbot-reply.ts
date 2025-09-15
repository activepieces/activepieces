import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { aidbaseAuth, aidbaseCommon } from '../../common';
import { CreateChatbotReplyProperties } from '../../common/properties';
import { CreateChatbotReplySchema } from '../../common/schemas';

export const createChatbotReply = createAction({
  auth: aidbaseAuth,
  name: 'createChatbotReply',
  displayName: 'Create Chatbot Reply',
  description:
    'Generates an AI chatbot reply given a message, session/context.',
  props: CreateChatbotReplyProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, CreateChatbotReplySchema);
    return await aidbaseCommon.createChatbotReply({ apiKey, ...propsValue });
  },
});
