import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const scrapeWebsiteText = createAction({
  auth: webscrapingAiAuth,
  name: 'scrapeWebsiteText',
  displayName: 'Scrape Website Text',
  description:
    'Returns the visible text content of a webpage specified by the URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript) and returns its visible text with HTML stripped out, in plain, JSON, or XML form. Choose this when you want clean readable content for summarizing or feeding to an LLM, rather than the raw HTML or a single extracted answer. Requires the target URL; optional proxy/country/device/header controls tune the fetch, and JSON output can additionally return extracted links. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  props: webscrapingAiCommon.getPageTextProperties,
  async run({ auth: apiKey, propsValue }) {
    const { textFormat, headers, returnLinks, ...rest } = propsValue;

    const allowedCountries = [
      'us', 'gb', 'de', 'it', 'fr', 'ca', 'es', 'ru', 'jp', 'kr', 'in'
    ];

    const params: any = {
      apiKey:apiKey.secret_text,
      ...rest,
      textFormat: (textFormat === 'json' || textFormat === 'plain' || textFormat === 'xml')
        ? textFormat
        : undefined,
      returnLinks: (textFormat === 'json') ? returnLinks : undefined,
      proxy: (rest.proxy === 'datacenter' || rest.proxy === 'residential') ? rest.proxy : undefined,
      country: (rest.country && allowedCountries.includes(rest.country))
        ? rest.country as typeof allowedCountries[number]
        : undefined,
      headers: headers && Array.isArray(headers)
        ? Object.fromEntries(headers.map((h: any) => [(h as any).name, (h as any).value]))
        : undefined,
      device: rest.device as 'desktop' | 'mobile' | 'tablet' | undefined,
    };

    return await webscrapingAiCommon.getPageText(params);
  },
});
