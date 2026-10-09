import { createAction, Property } from '@activepieces/pieces-framework';
import { webscrapingAiAuth } from '../auth';
import { webscrapingAiApi } from '../common/api';
import { webscrapingAiProps } from '../common/props';

export const askAQuestionAboutTheWebPageAction = createAction({
  auth: webscrapingAiAuth,
  name: 'askAQuestionAboutTheWebPage',
  classification: 'READ',
  displayName: 'Ask a Question About the Web Page',
  description: 'Gets an answer to a question about a given webpage.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript), then uses an LLM to answer a natural-language question about its content. Choose this to extract a specific fact or summary from a single URL without parsing HTML yourself, when you have a concrete question rather than needing the full page text or a structured record. Requires the target URL and the question; optional proxy/country/device/header controls tune how the page is fetched. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  props: {
    question: Property.ShortText({
      displayName: 'Question',
      description: 'Question or instructions to ask the LLM model about the target page.',
      required: true,
    }),
    ...webscrapingAiProps.pageRequest(),
    ...webscrapingAiProps.pageOptions(),
    format: webscrapingAiProps.format(),
  },
  async run({ auth, propsValue }) {
    return await webscrapingAiApi.askQuestion({ auth, ...propsValue });
  },
});
