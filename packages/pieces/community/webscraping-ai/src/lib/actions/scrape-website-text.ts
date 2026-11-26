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
  description: 'Gets the visible text of a web page.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript) and returns its visible text with HTML stripped out, in plain, JSON, or XML form. Choose this when you want clean readable content for summarizing or feeding to an LLM, rather than the raw HTML or a single extracted answer. Requires the target URL; optional proxy/country/device/header controls tune the fetch, and JSON output can additionally return extracted links. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'page', display: 'section', label: 'Page', icon: 'file', props: ['url', 'headers'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'text', props: ['textFormat', 'returnLinks'] },
  ],
  props: {
    ...webscrapingAiProps.pageRequest(),
    textFormat: Property.StaticDropdown({
      displayName: 'Text Format',
      description: 'Plain text is the easiest to pass to another step.',
      display: 'cards',
      required: false,
      defaultValue: 'plain',
      options: {
        options: [
          { label: 'Plain Text', value: 'plain', description: 'Just the text', icon: 'text' },
          { label: 'JSON', value: 'json', description: 'With the title', icon: 'code' },
          { label: 'XML', value: 'xml', description: 'The text as XML', icon: 'file' },
        ],
      },
    }),
    returnLinks: Property.Checkbox({
      displayName: 'Return Links',
      description: "Also return the page's links. Only works with JSON.",
      required: false,
    }),
    ...webscrapingAiProps.pageOptions(),
  },
  async run({ auth, propsValue }) {
    return await webscrapingAiApi.getPageText({ auth, ...propsValue });
  },
});
