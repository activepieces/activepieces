import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayAuth } from '../auth';

export const findAds = createAction({
  auth: foreplayAuth,
  name: 'find_ads',
  displayName: 'Find Ads',
  description: 'Find ads based on filters',
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      required: false,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();
    if (context.propsValue.keyword) params.append('keyword', context.propsValue.keyword);
    if (context.propsValue.domain) params.append('domain', context.propsValue.domain);
    
    const response = await fetch(`https://public.api.foreplay.co/v1/ads/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Accept': 'application/json',
      },
    });
    return await response.json();
  },
});
