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
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the current real-time count of active visitors on one Umami-tracked website. Use for "how many people are on the site right now"; for historical totals use Get Website Stats instead. Requires only a website ID. Read-only and idempotent, though the live count naturally changes between calls.',
    idempotent: true,
  },
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
