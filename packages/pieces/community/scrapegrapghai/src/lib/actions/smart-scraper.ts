import { createAction, Property } from '@activepieces/pieces-framework';
import { scrapegraphaiAuth } from '../auth';
import { scrapegraphaiApi } from '../common/api';
import { scrapegrapghaiExtractOutputSchema } from '../output-schemas';

export const smartScraperAction = createAction({
  name: 'smart_scraper',
  outputSchema: scrapegrapghaiExtractOutputSchema,
  classification: 'READ',
  displayName: 'Extract Data from Webpage',
  description: 'Use AI to pull the information you describe from a live webpage.',
  audience: 'human',
  aiMetadata: { description: 'Fetches a live webpage by URL and uses AI to extract the information described in a natural-language prompt; optionally pass an output schema to shape the result into structured fields. Choose this when you have a public URL and want targeted data from it rather than the full raw page. The page is fetched server-side from the given URL; for HTML you already hold, use Extract Data from HTML instead. Read-only and safe to retry.', idempotent: true },
  auth: scrapegraphaiAuth,
  props: {
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description: 'Public webpage to read.',
      placeholder: 'https://example.com/pricing',
      required: true,
    }),
    user_prompt: Property.LongText({
      displayName: 'Extraction Prompt',
      description: 'Describe the information you want, in plain words.',
      placeholder: 'The product name, price and whether it is in stock',
      required: true,
    }),
    output_schema: Property.Json({
      displayName: 'Output Schema',
      description: 'JSON Schema for the fields of the result.',
      required: false,
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapegraphaiApi.extract({
      auth,
      url: propsValue.website_url,
      prompt: propsValue.user_prompt,
      schema: propsValue.output_schema,
    });
  },
}); 