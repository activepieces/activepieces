import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { docsbotAuth, docsbotCommon } from '../common';

export const askQuestion = createAction({
  auth: docsbotAuth,
  name: 'askQuestion',
  displayName: 'Ask Question',
  description: 'Ask a question to a specific bot in a specific team.',
  props: docsbotCommon.askQuestionProperties(),
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, docsbotCommon.askQuestionSchema);

    const { image_urls, ...restProps } = propsValue;
    const conversationId = crypto.randomUUID();

    return await docsbotCommon.askQuestion({
      apiKey,
      image_urls: Array.isArray(image_urls)
      ? (image_urls as string[] | undefined)
      : undefined,
      conversationId,
      ...restProps,
    });
  },
});
