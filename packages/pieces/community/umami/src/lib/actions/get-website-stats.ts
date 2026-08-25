import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth, UmamiAuthValue } from '../auth';
import { umamiApiCall, umamiCommon } from '../common';

export const getWebsiteStats = createAction({
  auth: umamiAuth,
  name: 'get_website_stats',
  displayName: 'Get Website Stats',
  description:
    'Returns a summary of visitors, pageviews, bounce rate, and average visit duration for a date range.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch aggregate analytics for one Umami-tracked website over a date range: total visitors, pageviews, bounce rate, and average visit duration. Use for a high-level traffic summary rather than per-dimension breakdowns or time series. Requires a website ID and a start/end date. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    websiteId: umamiCommon.websiteDropdown,
    startDate: umamiCommon.dateRange.startDate,
    endDate: umamiCommon.dateRange.endDate,
  },
  async run(context) {
    const { websiteId, startDate, endDate } = context.propsValue;

    const response = await umamiApiCall<Record<string, unknown>>({
      auth: context.auth as UmamiAuthValue,
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
