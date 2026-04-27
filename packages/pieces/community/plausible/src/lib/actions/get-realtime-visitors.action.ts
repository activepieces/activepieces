import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';

export const getRealtimeVisitors = createAction({
  name: 'get_realtime_visitors',
  auth: plausibleAuth,
  displayName: 'Get Realtime Visitors',
  description: 'Get the number of current visitors on your site',
  props: {
    site_id: Property.ShortText({
      displayName: 'Site Domain',
      description: 'Your site domain as configured in Plausible (e.g. yourdomain.com)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://plausible.io/api/v1/stats/realtime/visitors?site_id=${encodeURIComponent(propsValue.site_id)}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    return { visitors: response.body };
  },
});
