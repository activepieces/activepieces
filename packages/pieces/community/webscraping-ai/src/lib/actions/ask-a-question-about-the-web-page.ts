import { createAction, Property } from '@activepieces/pieces-framework';
import { WebScrapingAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const askAQuestionAboutTheWebPage = createAction({
  auth: WebScrapingAuth,
  name: 'askAQuestionAboutTheWebPage',
  displayName: 'Ask a Question About the Web Page',
  description: 'Ask a natural language question about the content of a web page using WebScraping.AI',
  props: {
    url: Property.ShortText({
      displayName: "Page URL",
      required: true,
    }),
    question: Property.LongText({
      displayName: "Your Question",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        "/ai/question",
        {
          url: propsValue.url,
          question: propsValue.question,
        }
      );

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Unexpected error: ${error.message ?? error}`,
        details: error.response ?? error,
      };
    }
  },
});