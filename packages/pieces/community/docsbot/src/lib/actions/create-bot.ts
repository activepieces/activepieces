import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { docsbotAuth, docsbotCommon } from '../common';

export const createBot = createAction({
  auth: docsbotAuth,
  name: 'createBot',
  displayName: 'Create Bot',
  description: 'Creates a new bot.',
  props: docsbotCommon.createBotProperties(),
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, docsbotCommon.createBotSchema);

    return await docsbotCommon.createBot({
      apiKey,
      ...propsValue,
      language: propsValue.language as 'en' | 'jp',
      privacy: propsValue.privacy as 'public' | 'private',
      model: propsValue.model as "string" | undefined,
      embeddingModel: propsValue.embeddingModel as
        | "text-embedding-ada-002"
        | "text-embedding-3-large"
        | "text-embedding-3-small"
        | "embed-multilingual-v3.0"
        | "embed-v4.0"
        | undefined,
    });
  },
});
