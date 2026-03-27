import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth } from '../..';
import { umamiApiCall, umamiCommon } from '../common';

export const getActiveVisitors = createAction({
  auth: umamiAuth,
  name: 'get_active_visitors',
  displayName: 'Get Active Visitors',
  description: 'Get the number of currently active visitors on a website.',
  props: {
    websiteId: umamiCommon.websiteDropdown,
  },
  async run(context) {
    const { base_url, api_key } = context.auth.props;
    const { websiteId } = context.propsValue;

    const response = await umamiApiCall<{ visitors: number }>({
      serverUrl: base_url,
      apiKey: api_key,
      method: HttpMethod.GET,
      path: `/websites/${websiteId}/active`,
    });

    return {
      active_visitors: response.body.visitors,
    };
  },
});
