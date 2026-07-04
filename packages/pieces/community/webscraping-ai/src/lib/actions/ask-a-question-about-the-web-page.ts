import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const askAQuestionAboutTheWebPage = createAction({
  auth: webscrapingAiAuth,
  name: 'askAQuestionAboutTheWebPage',
  displayName: 'Ask a Question About the Web Page',
  description: 'Gets an answer to a question about a given webpage.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript), then uses an LLM to answer a natural-language question about its content. Choose this to extract a specific fact or summary from a single URL without parsing HTML yourself, when you have a concrete question rather than needing the full page text or a structured record. Requires the target URL and the question; optional proxy/country/device/header controls tune how the page is fetched. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  props: webscrapingAiCommon.askQuestionProperties,
  async run({ auth: apiKey, propsValue }) {
    const { device, format, question, ...rest } = propsValue;

    const allowedCountries = [
      'us', 'gb', 'de', 'it', 'fr', 'ca', 'es', 'ru', 'jp', 'kr', 'in'
    ];

    const params: any = {
      apiKey:apiKey.secret_text,
      question,
      ...rest,
      format: (format === 'json' || format === 'text') ? format : undefined,
      proxy: (rest.proxy === 'datacenter' || rest.proxy === 'residential') ? rest.proxy : undefined,
      country: (rest.country && allowedCountries.includes(rest.country))
        ? rest.country as typeof allowedCountries[number]
        : undefined,
      headers: rest.headers && Array.isArray(rest.headers)
        ? Object.fromEntries(rest.headers.map((h: any) => [(h as any).name, (h as any).value]))
        : undefined,
      device: device as 'desktop' | 'mobile' | 'tablet' | undefined,
    };

    return await webscrapingAiCommon.askQuestion(params);
  },
});
