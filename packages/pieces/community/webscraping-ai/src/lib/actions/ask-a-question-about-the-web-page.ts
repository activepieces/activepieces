import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const askAQuestionAboutTheWebPage = createAction({
  auth: webscrapingAiAuth,
  name: 'askAQuestionAboutTheWebPage',
  displayName: 'Ask a Question About the Web Page',
  description: 'Gets an answer to a question about a given webpage.',
  props: webscrapingAiCommon.askQuestionProperties,
  async run({ auth: apiKey, propsValue }) {
    return await webscrapingAiCommon.askQuestion({
      apiKey,
      ...propsValue,
    });
  },
});
