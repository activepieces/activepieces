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
    const { fields, headers, ...rest } = propsValue;

    const allowedCountries = [
      'us', 'gb', 'de', 'it', 'fr', 'ca', 'es', 'ru', 'jp', 'kr', 'in'
    ];

    const params: any = {
      apiKey,
      ...rest,
      proxy: (rest.proxy === 'datacenter' || rest.proxy === 'residential') ? rest.proxy : undefined,
      country: (rest.country && allowedCountries.includes(rest.country))
        ? rest.country as typeof allowedCountries[number]
        : undefined,
      headers: headers && Array.isArray(headers)
        ? Object.fromEntries(headers.map((h: any) => [(h as any).name, (h as any).value]))
        : undefined,
      fields: fields && typeof fields === 'object'
        ? Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, String(v)]))
        : {},
      device: rest.device as 'desktop' | 'mobile' | 'tablet' | undefined,
    };

    return await webscrapingAiCommon.getPageStructuredData(params);
  },
});
