import { createAction, Property } from '@activepieces/pieces-framework';
import { webscrapingAiAuth } from '../auth';
import { webscrapingAiApi } from '../common/api';
import { webscrapingAiProps } from '../common/props';
import { humanResponseOutputSchema } from '../output-schemas';

export const askAQuestionAboutTheWebPageAction = createAction({
  auth: webscrapingAiAuth,
  name: 'askAQuestionAboutTheWebPage',
  outputSchema: humanResponseOutputSchema,
  classification: 'READ',
  displayName: 'Ask a Question About the Web Page',
  description: 'Answers a question about a web page using AI.',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript), then uses an LLM to answer a natural-language question about its content. Choose this to extract a specific fact or summary from a single URL without parsing HTML yourself, when you have a concrete question rather than needing the full page text or a structured record. Requires the target URL and the question; optional proxy/country/device/header controls tune how the page is fetched. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'page', display: 'section', label: 'Page', icon: 'file', props: ['url', 'headers'] },
    { key: 'question', display: 'section', label: 'Question', icon: 'type', props: ['question', 'format'] },
  ],
  props: {
    question: Property.ShortText({
      displayName: 'Question',
      description: 'What you want to know about the page.',
      placeholder: 'What is the price of this product?',
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
