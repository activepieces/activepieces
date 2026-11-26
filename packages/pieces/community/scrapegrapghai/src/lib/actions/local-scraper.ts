import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { scrapegraphaiAuth } from '../auth';
import { scrapegraphaiApi } from '../common/api';
import { scrapegrapghaiExtractOutputSchema } from '../output-schemas';

export const localScraperAction = createAction({
  name: 'local_scraper',
  outputSchema: scrapegrapghaiExtractOutputSchema,
  classification: 'READ',
  displayName: 'Extract Data from HTML',
  description: 'Use AI to pull the information you describe from HTML you already have.',
  audience: 'human',
  aiMetadata: { description: 'Uses AI to extract information described in a natural-language prompt from raw HTML you supply directly (max 2MB); optionally pass an output schema to shape the result into structured fields. Choose this when you already have the page HTML in hand and do not want the service to fetch a URL — for a live URL use Extract Data from Webpage instead. Read-only and safe to retry.', idempotent: true },
  auth: scrapegraphaiAuth,
  props: {
    info: Property.MarkDown({
      value: 'To read a live webpage, use Extract Data from Webpage.',
      variant: MarkdownVariant.INFO,
    }),
    website_html: Property.LongText({
      displayName: 'HTML',
      description: 'Raw HTML of the page, usually from an earlier step. Up to 2 MB.',
      placeholder: '<html><body>…</body></html>',
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
      html: propsValue.website_html,
      prompt: propsValue.user_prompt,
      schema: propsValue.output_schema,
    });
  },
}); 