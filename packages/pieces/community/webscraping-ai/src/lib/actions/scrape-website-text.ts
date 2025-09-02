import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const scrapeWebsiteText = createAction({
  auth: webscrapingAiAuth,
  name: 'scrapeWebsiteText',
  displayName: 'Scrape Website Text',
  description:
    'Returns the visible text content of a webpage specified by the URL.',
  props: webscrapingAiCommon.getPageTextProperties,
  async run({ auth: apiKey, propsValue }) {
    const { textFormat, headers, ...rest } = propsValue;
    const validTextFormat =
      textFormat === 'json' || textFormat === 'plain' || textFormat === 'xml'
        ? textFormat
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

    return await webscrapingAiCommon.getPageText({
      apiKey,
      ...rest,
      country: validCountry,
      device: validDevice,
      textFormat: validTextFormat,
      headers: stringHeaders,
      proxy: validProxy,
    });
  },
});
