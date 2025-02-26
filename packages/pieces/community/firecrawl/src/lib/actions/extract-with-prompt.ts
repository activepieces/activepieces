import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';

export const extractWithPrompt = createAction({
  auth: firecrawlAuth,
  name: 'extractWithPrompt',
  displayName: 'Extract with Prompt',
  description: 'Extract structured data from any URL using a natural language prompt.',
  props: {
    url: Property.ShortText({
      displayName: 'Website URL',
      description: 'The webpage URL to extract data from.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Extraction Prompt',
      description: 'Describe what information you want to extract in natural language.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      url: propsValue.url,
      formats: ['json'],
      jsonOptions: {
        prompt: propsValue.prompt
      }
    };
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.firecrawl.dev/v1/scrape',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: body,
    });

    return response.body;
  },
});