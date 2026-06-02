import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const getRealtimeVisitors = createAction({
  name: 'get_realtime_visitors',
  auth: plausibleAuth,
  displayName: 'Get Realtime Visitors',
  description: 'Get the number of current visitors on your site',
  props: {
    site_id: siteIdDropdown,
  },
  async run({ auth, propsValue }) {
    const visitors = await plausibleApiCall<number>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      endpoint: '/stats/realtime/visitors',
      queryParams: { site_id: propsValue.site_id },
    });
    return { visitors };
  },
});
