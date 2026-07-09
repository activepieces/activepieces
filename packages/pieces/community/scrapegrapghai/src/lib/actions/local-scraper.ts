import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { scrapegraphaiAuth } from '../auth';

export const localScraper = createAction({
  name: 'local_scraper',
  displayName: 'Local Scraper',
  description: 'Extract content from HTML content using AI by providing a natural language prompt.',
  audience: 'both',
  aiMetadata: { description: 'Uses AI to extract information described in a natural-language prompt from raw HTML you supply directly (max 2MB); optionally pass an output schema to shape the result into structured fields. Choose this when you already have the page HTML in hand and do not want the service to fetch a URL — for a live URL use Smart Scraper instead. Read-only and safe to retry.', idempotent: true },
  auth: scrapegraphaiAuth,
  props: {
    website_html: Property.LongText({
      displayName: 'HTML Content',
      description: 'The HTML content to process (max 2MB).',
      required: true,
    }),
    user_prompt: Property.LongText({
      displayName: 'Extraction Prompt',
      description: 'Describe what information you want to extract in natural language.',
      required: true,
    }),
    output_schema: Property.Json({
      displayName: 'Output Schema',
      description: 'Optional schema to structure the output data.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.scrapegraphai.com/v1/localscraper',
      headers: {
        'Content-Type': 'application/json',
        'SGAI-APIKEY': auth.secret_text,
      },
      body: {
        website_html: propsValue.website_html,
        user_prompt: propsValue.user_prompt,
        output_schema: propsValue.output_schema,
      },
    });

    return response.body;
  },
}); 