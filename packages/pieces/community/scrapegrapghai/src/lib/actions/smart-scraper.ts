import { createAction, Property } from '@activepieces/pieces-framework';
import { scrapegraphaiAuth } from '../auth';
import { scrapegraphaiApi } from '../common/api';

export const smartScraperAction = createAction({
  name: 'smart_scraper',
  classification: 'READ',
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
    return await scrapegraphaiApi.smartScraper({
      auth,
      websiteUrl: propsValue.website_url,
      userPrompt: propsValue.user_prompt,
      outputSchema: propsValue.output_schema,
    });
  },
}); 