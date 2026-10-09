import { createAction, Property } from '@activepieces/pieces-framework';
import { scrapegraphaiAuth } from '../auth';
import { scrapegraphaiApi } from '../common/api';

export const localScraperAction = createAction({
  name: 'local_scraper',
  classification: 'READ',
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
    return await scrapegraphaiApi.localScraper({
      auth,
      websiteHtml: propsValue.website_html,
      userPrompt: propsValue.user_prompt,
      outputSchema: propsValue.output_schema,
    });
  },
}); 