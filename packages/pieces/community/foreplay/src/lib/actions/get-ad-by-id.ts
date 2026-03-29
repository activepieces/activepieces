import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayAuth, adId } from '../auth';

export const getAdById = createAction({
  auth: foreplayAuth,
  name: 'get_ad_by_id',
  displayName: 'Get Ad by ID',
  description: 'Retrieve detailed information about a specific ad',
  props: {
    ad_id: adId,
  },
  async run(context) {
    const response = await fetch(`https://public.api.foreplay.co/v1/ads/${context.propsValue.ad_id}`, {
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Accept': 'application/json',
      },
    });
    return await response.json();
  },
});
