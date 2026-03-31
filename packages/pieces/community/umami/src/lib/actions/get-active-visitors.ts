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
    const { websiteId } = context.propsValue;

    const response = await umamiApiCall<{ visitors: number }>({
      serverUrl: context.auth.props.base_url,
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/websites/${websiteId}/active`,
    });

    return {
      active_visitors: response.body.visitors,
    };
  },
});
