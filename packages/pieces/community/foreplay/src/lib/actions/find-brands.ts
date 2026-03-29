import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayAuth } from '../auth';

export const findBrands = createAction({
  auth: foreplayAuth,
  name: 'find_brands',
  displayName: 'Find Brands',
  description: 'Search brands by name or filter',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();
    if (context.propsValue.query) params.append('query', context.propsValue.query);
    
    const response = await fetch(`https://public.api.foreplay.co/v1/brands?${params}`, {
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Accept': 'application/json',
      },
    });
    return await response.json();
  },
});
