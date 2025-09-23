import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const askAQuestionAboutTheWebPage = createAction({
  auth: webscrapingAiAuth,
  name: 'askAQuestionAboutTheWebPage',
  displayName: 'Ask a Question About the Web Page',
  description: 'Gets an answer to a question about a given webpage.',
  props: webscrapingAiCommon.askQuestionProperties,
  async run({ auth: apiKey, propsValue }) {
    const { device, format, question, ...rest } = propsValue;

    const allowedCountries = [
      'us', 'gb', 'de', 'it', 'fr', 'ca', 'es', 'ru', 'jp', 'kr', 'in'
    ];

    const params: any = {
      apiKey,
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
