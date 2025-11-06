import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const getPageHtml = createAction({
  auth: webscrapingAiAuth,
  name: 'getPageHtml',
  displayName: 'Get Page HTML',
  description: 'Retrieves the raw HTML markup of a web page.',
  props: webscrapingAiCommon.getPageHtmlProperties,
  async run({ auth: apiKey, propsValue }) {
    const { format, headers, proxy, device, errorOn404, errorOnRedirect, returnScriptResult, ...rest } = propsValue;

    const allowedCountries = [
      'us', 'gb', 'de', 'it', 'fr', 'ca', 'es', 'ru', 'jp', 'kr', 'in'
    ];

    const params: any = {
      apiKey,
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
