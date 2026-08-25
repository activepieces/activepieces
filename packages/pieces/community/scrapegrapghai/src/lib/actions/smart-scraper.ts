import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { scrapegraphaiAuth } from '../auth';

export const smartScraper = createAction({
  name: 'smart_scraper',
  displayName: 'Smart Scraper',
  description: 'Extract content from a webpage using AI by providing a natural language prompt.',
  audience: 'both',
  aiMetadata: { description: 'Fetches a live webpage by URL and uses AI to extract the information described in a natural-language prompt; optionally pass an output schema to shape the result into structured fields. Choose this when you have a public URL and want targeted data from it rather than the full raw page. The page is fetched server-side from the given URL; for HTML you already hold, use Local Scraper instead. Read-only and safe to retry.', idempotent: true },
  auth: scrapegraphaiAuth,
  props: {
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description: 'The webpage URL to scrape.',
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
      url: 'https://api.scrapegraphai.com/v1/smartscraper',
      headers: {
        'Content-Type': 'application/json',
        'SGAI-APIKEY': auth.secret_text,
      },
      body: {
        website_url: propsValue.website_url,
        user_prompt: propsValue.user_prompt,
        output_schema: propsValue.output_schema,
      },
    });

    return response.body;
  },
}); 