import { createAction, Property } from '@activepieces/pieces-framework';
import { webscrapingAiAuth } from '../auth';
import { webscrapingAiApi } from '../common/api';
import { webscrapingAiProps } from '../common/props';
import { humanResponseOutputSchema } from '../output-schemas';

export const getPageHtmlAction = createAction({
  auth: webscrapingAiAuth,
  name: 'getPageHtml',
  outputSchema: humanResponseOutputSchema,
  classification: 'READ',
  displayName: 'Get Page HTML',
  description: 'Gets the raw HTML of a web page.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript) and returns its raw HTML markup. Choose this when you need the full document to parse yourself or feed into other tools, rather than an LLM-derived answer or extracted text. Requires the target URL; optional proxy/country/device/header controls tune the fetch, and flags can error on 404 or redirect or return JS execution results. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'page', display: 'section', label: 'Page', icon: 'file', props: ['url', 'headers'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'code', props: ['format'] },
  ],
  props: {
    ...webscrapingAiProps.pageRequest(),
    returnScriptResult: Property.Checkbox({
      displayName: 'Return JavaScript Result',
      description: 'Return what the JavaScript code returns instead of the page HTML.',
      required: false,
      advanced: true,
    }),
    ...webscrapingAiProps.pageOptions(),
    format: webscrapingAiProps.format(),
  },
  async run({ auth, propsValue }) {
    return await webscrapingAiApi.getPageHtml({ auth, ...propsValue });
  },
});
