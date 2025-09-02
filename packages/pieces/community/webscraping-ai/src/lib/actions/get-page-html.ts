import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const getPageHtml = createAction({
  auth: webscrapingAiAuth,
  name: 'getPageHtml',
  displayName: 'Get Page HTML',
  description: 'Retrieves the raw HTML markup of a web page.',
  props: webscrapingAiCommon.getPageHtmlProperties,
  async run({ auth: apiKey, propsValue }) {
    // Ensure format is either "json", "text", or undefined
    const { format, headers, proxy, ...rest } = propsValue;
    const validFormat =
      format === 'json' || format === 'text' ? format : undefined;
    // Convert headers to Record<string, string> if present
    const stringHeaders =
      headers && typeof headers === 'object'
        ? Object.fromEntries(
            Object.entries(headers).map(([k, v]) => [k, String(v)])
          )
        : undefined;
    // Ensure proxy is either "datacenter", "residential", or undefined
    const validProxy =
      proxy === 'datacenter' || proxy === 'residential'
        ? (proxy as 'datacenter' | 'residential')
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

    return await webscrapingAiCommon.getPageHtml({
      apiKey,
      ...rest,
      country: validCountry,
      format: validFormat,
      headers: stringHeaders,
      proxy: validProxy,
    });
  },
});
