import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayAuth } from '../auth';

export const getAdsByPage = createAction({
  auth: foreplayAuth,
  name: 'get_ads_by_page',
  displayName: 'Get Ads by Page',
  description: 'Retrieve all ads belonging to a Facebook Page',
  props: {
    page_id: Property.ShortText({
      displayName: 'Facebook Page ID',
      required: true,
    }),
  },
  async run(context) {
    const response = await fetch(`https://public.api.foreplay.co/v1/ads/page/${context.propsValue.page_id}`, {
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Accept': 'application/json',
      },
    });
    return await response.json();
  },
});
