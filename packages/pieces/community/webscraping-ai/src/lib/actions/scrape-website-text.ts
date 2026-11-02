import { createAction, Property } from '@activepieces/pieces-framework';
import { webscrapingAiAuth } from '../auth';
import { webscrapingAiApi } from '../common/api';
import { webscrapingAiProps } from '../common/props';
import { humanPageTextOutputSchema } from '../output-schemas';

export const scrapeWebsiteTextAction = createAction({
  auth: webscrapingAiAuth,
  name: 'scrapeWebsiteText',
  outputSchema: humanPageTextOutputSchema,
  classification: 'READ',
  displayName: 'Scrape Website Text',
  description: 'Returns the visible text content of a webpage specified by the URL.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript) and returns its visible text with HTML stripped out, in plain, JSON, or XML form. Choose this when you want clean readable content for summarizing or feeding to an LLM, rather than the raw HTML or a single extracted answer. Requires the target URL; optional proxy/country/device/header controls tune the fetch, and JSON output can additionally return extracted links. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  props: {
    ...webscrapingAiProps.pageRequest(),
    textFormat: Property.StaticDropdown({
      displayName: 'Text Format',
      description: 'Response format: Plain text, JSON (with title/description/content), or XML',
      required: false,
      defaultValue: 'plain',
      options: {
        options: [
          { label: 'Plain Text', value: 'plain' },
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
        ],
      },
    }),
    returnLinks: Property.Checkbox({
      displayName: 'Return Links',
      description: 'Include links in response (only works with JSON format)',
      required: false,
    }),
    ...webscrapingAiProps.pageOptions(),
  },
  async run({ auth, propsValue }) {
    return await webscrapingAiApi.getPageText({ auth, ...propsValue });
  },
});
