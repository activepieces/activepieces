import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const extractStructuredData = createAction({
  auth: webscrapingAiAuth,
  name: 'extractStructuredData',
  displayName: 'Extract structured data',
  description:
    'Returns structured data fields extracted from the webpage using an LLM model.',
  props: webscrapingAiCommon.getPageStructuredDataProperties,
  async run({ auth: apiKey, propsValue }) {
    // Convert fields to Record<string, string> if present
    const { fields, headers, ...rest } = propsValue;
    const stringFields =
      fields && typeof fields === 'object'
        ? Object.fromEntries(
            Object.entries(fields).map(([k, v]) => [k, String(v)])
          )
        : undefined;

    // Convert headers to Record<string, string> if present
    const stringHeaders =
      headers && typeof headers === 'object'
        ? Object.fromEntries(
            Object.entries(headers).map(([k, v]) => [k, String(v)])
          )
        : undefined;

    // Ensure device is either "desktop", "mobile", "tablet", or undefined
    const validDevice =
      rest.device === 'desktop' ||
      rest.device === 'mobile' ||
      rest.device === 'tablet'
        ? (rest.device as 'desktop' | 'mobile' | 'tablet')
        : undefined;

    // Ensure proxy is either "datacenter", "residential", or undefined
    const validProxy =
      rest.proxy === 'datacenter' || rest.proxy === 'residential'
        ? (rest.proxy as 'datacenter' | 'residential')
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

    return await webscrapingAiCommon.getPageStructuredData({
      apiKey,
      ...rest,
      country: validCountry,
      device: validDevice,
      proxy: validProxy,
      fields: stringFields ?? {},
      headers: stringHeaders,
    });
  },
});
