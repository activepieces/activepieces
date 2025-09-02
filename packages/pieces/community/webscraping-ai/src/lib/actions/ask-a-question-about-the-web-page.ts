import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const askAQuestionAboutTheWebPage = createAction({
  auth: webscrapingAiAuth,
  name: 'askAQuestionAboutTheWebPage',
  displayName: 'Ask a Question About the Web Page',
  description: 'Gets an answer to a question about a given webpage.',
  props: webscrapingAiCommon.askQuestionProperties,
  async run({ auth: apiKey, propsValue }) {
    const { device, format, ...rest } = propsValue;
    // Ensure format is either "json", "text", or undefined
    const validFormat =
      format === 'json' || format === 'text' ? format : undefined;
    // Convert headers to Record<string, string> if present
    const headers =
      rest.headers && typeof rest.headers === 'object'
        ? Object.fromEntries(
            Object.entries(rest.headers).map(([k, v]) => [k, String(v)])
          )
        : undefined;

    // Ensure proxy is either "datacenter", "residential", or undefined
    const validProxy =
      rest.proxy === 'datacenter' || rest.proxy === 'residential'
        ? rest.proxy
        : undefined;

    // Validate country to match allowed values
    const allowedCountries = [
      'us',
      'gb',
      'de',
      'it',
      'fr',
      'ca',
      'es',
      'ru',
      'jp',
      'kr',
      'in',
    ];
    const validCountry =
      rest.country && allowedCountries.includes(rest.country)
        ? (rest.country as
            | 'us'
            | 'gb'
            | 'de'
            | 'it'
            | 'fr'
            | 'ca'
            | 'es'
            | 'ru'
            | 'jp'
            | 'kr'
            | 'in')
        : undefined;

    return await webscrapingAiCommon.askQuestion({
      apiKey,
      ...rest,
      country: validCountry,
      proxy: validProxy,
      headers,
      device: device as 'desktop' | 'mobile' | 'tablet' | undefined,
      format: validFormat,
    });
  },
});
