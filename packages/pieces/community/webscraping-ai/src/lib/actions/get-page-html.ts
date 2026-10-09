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
  description: 'Retrieves the raw HTML markup of a web page.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript) and returns its raw HTML markup. Choose this when you need the full document to parse yourself or feed into other tools, rather than an LLM-derived answer or extracted text. Requires the target URL; optional proxy/country/device/header controls tune the fetch, and flags can error on 404 or redirect or return JS execution results. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  props: {
    ...webscrapingAiProps.pageRequest(),
    returnScriptResult: Property.Checkbox({
      displayName: 'Return JavaScript Result',
      description:
        'Return result of the custom JavaScript code (js_script parameter) \
 execution on the target page (false by default, page HTML will be returned).',
      required: false,
    }),
    ...webscrapingAiProps.pageOptions(),
    format: webscrapingAiProps.format(),
  },
  async run({ auth, propsValue }) {
    return await webscrapingAiApi.getPageHtml({ auth, ...propsValue });
  },
});
