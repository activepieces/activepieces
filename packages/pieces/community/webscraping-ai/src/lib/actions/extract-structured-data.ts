import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { webscrapingAiAuth } from '../auth';
import { webscrapingAiApi } from '../common/api';
import { webscrapingAiProps } from '../common/props';
import { humanExtractedFieldsOutputSchema } from '../output-schemas';

export const extractStructuredDataAction = createAction({
  auth: webscrapingAiAuth,
  name: 'extractStructuredData',
  outputSchema: humanExtractedFieldsOutputSchema,
  classification: 'READ',
  displayName: 'Extract Structured Data',
  description: 'Pulls the fields you describe out of a web page using AI.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript) and uses an LLM to extract a set of caller-defined fields from it, where each field is given as a name plus a natural-language description of what to pull. Choose this when you need specific structured values (e.g. price, title, author) rather than a free-text answer or the raw page. Requires the target URL and the fields map; optional proxy/country/device/header controls tune the fetch. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'page', display: 'section', label: 'Page', icon: 'file', props: ['url', 'headers'] },
    { key: 'fields', display: 'section', label: 'Fields', icon: 'tag', props: ['fieldsHelp', 'fields'] },
  ],
  props: {
    fieldsHelp: Property.MarkDown({
      value: 'Name each field and say what it should hold, for example **price**: The product price.',
      variant: MarkdownVariant.INFO,
    }),
    fields: Property.Object({
      displayName: 'Fields to Extract',
      description: 'Fields the page does not contain come back empty.',
      required: true,
    }),
    ...webscrapingAiProps.pageRequest(),
    ...webscrapingAiProps.pageOptions(),
  },
  async run({ auth, propsValue }) {
    return await webscrapingAiApi.getStructuredData({ auth, ...propsValue });
  },
});
