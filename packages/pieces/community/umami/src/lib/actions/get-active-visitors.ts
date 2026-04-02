import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth, UmamiAuthValue } from '../auth';
import { umamiApiCall, umamiCommon } from '../common';

export const getActiveVisitors = createAction({
  auth: umamiAuth,
  name: 'get_active_visitors',
  displayName: 'Get Active Visitors',
  description:
    'Returns the number of people currently browsing a website in real time.',
  props: {
    websiteId: umamiCommon.websiteDropdown,
  },
  async run(context) {
    const { websiteId } = context.propsValue;

    const response = await umamiApiCall<{ visitors: number }>({
      auth: context.auth as UmamiAuthValue,
      method: HttpMethod.GET,
      path: `/websites/${websiteId}/active`,
    });

    return response.body;
  },
});
