import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth } from '../..';
import { umamiApiCall, umamiCommon } from '../common';

export const getWebsiteStats = createAction({
  auth: umamiAuth,
  name: 'get_website_stats',
  displayName: 'Get Website Stats',
  description: 'Get summarized website statistics (visitors, pageviews, bounces, visit duration) for a date range.',
  props: {
    websiteId: umamiCommon.websiteDropdown,
    startDate: umamiCommon.dateRange.startDate,
    endDate: umamiCommon.dateRange.endDate,
  },
  async run(context) {
    const { websiteId, startDate, endDate } = context.propsValue;

    const response = await umamiApiCall<Record<string, unknown>>({
      serverUrl: context.auth.props.base_url,
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/websites/${websiteId}/stats`,
      queryParams: {
        startAt: String(new Date(startDate).getTime()),
        endAt: String(new Date(endDate).getTime()),
      },
    });

    return response.body;
  },
});
