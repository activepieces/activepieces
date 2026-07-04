import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const getPageHtml = createAction({
  auth: webscrapingAiAuth,
  name: 'getPageHtml',
  displayName: 'Get Page HTML',
  description: 'Retrieves the raw HTML markup of a web page.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a web page (rendering JavaScript) and returns its raw HTML markup. Choose this when you need the full document to parse yourself or feed into other tools, rather than an LLM-derived answer or extracted text. Requires the target URL; optional proxy/country/device/header controls tune the fetch, and flags can error on 404 or redirect or return JS execution results. Read-only and idempotent (a GET-style request that does not alter the target site).',
    idempotent: true,
  },
  props: webscrapingAiCommon.getPageHtmlProperties,
  async run({ auth: apiKey, propsValue }) {
    const { format, headers, proxy, device, errorOn404, errorOnRedirect, returnScriptResult, ...rest } = propsValue;

    const allowedCountries = [
      'us', 'gb', 'de', 'it', 'fr', 'ca', 'es', 'ru', 'jp', 'kr', 'in'
    ];

    const params: any = {
      apiKey:apiKey.secret_text,
      ...rest,
      format: (format === 'json' || format === 'text') ? format : undefined,
      proxy: (proxy === 'datacenter' || proxy === 'residential') ? proxy : undefined,
      country: (rest.country && allowedCountries.includes(rest.country))
        ? rest.country as typeof allowedCountries[number]
        : undefined,
      headers: headers && Array.isArray(headers)
        ? Object.fromEntries(headers.map((h: any) => [(h as any).name, (h as any).value]))
        : undefined,
      device: device as 'desktop' | 'mobile' | 'tablet' | undefined,
      errorOn404,
      errorOnRedirect,
      returnScriptResult,
    };

    return await webscrapingAiCommon.getPageHtml(params);
  },
});
