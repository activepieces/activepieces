import { createAction, Property } from '@activepieces/pieces-framework';
import { webscrapingAiAuth } from '../auth';
import { webscrapingAiApi } from '../common/api';
import { webscrapingAiProps } from '../common/props';

export const extractStructuredDataAction = createAction({
  auth: webscrapingAiAuth,
  name: 'extractStructuredData',
  classification: 'READ',
  displayName: 'Extract structured data',
  description: 'Returns structured data fields extracted from the webpage using an LLM model.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript) and uses an LLM to extract a set of caller-defined fields from it, where each field is given as a name plus a natural-language description of what to pull. Choose this when you need specific structured values (e.g. price, title, author) rather than a free-text answer or the raw page. Requires the target URL and the fields map; optional proxy/country/device/header controls tune the fetch. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  props: {
    fields: Property.Object({
      displayName: 'Fields to Extract',
      description: 'Define fields to extract (e.g., {"title": "Product title", "price": "Product price"})',
      required: true,
    }),
    ...webscrapingAiProps.pageRequest(),
    ...webscrapingAiProps.pageOptions(),
  },
  async run({ auth, propsValue }) {
    return await webscrapingAiApi.getStructuredData({ auth, ...propsValue });
  },
});
