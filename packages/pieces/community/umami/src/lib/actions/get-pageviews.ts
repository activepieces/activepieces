import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth } from '../..';
import { umamiApiCall, umamiCommon } from '../common';

export const getPageviews = createAction({
  auth: umamiAuth,
  name: 'get_pageviews',
  displayName: 'Get Pageviews',
  description: 'Get pageview and session count time series for a website over a date range.',
  props: {
    websiteId: umamiCommon.websiteDropdown,
    startDate: umamiCommon.dateRange.startDate,
    endDate: umamiCommon.dateRange.endDate,
    unit: Property.StaticDropdown({
      displayName: 'Time Unit',
      description: 'The time grouping for the data.',
      required: false,
      defaultValue: 'day',
      options: {
        options: [
          { label: 'Hour', value: 'hour' },
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
          { label: 'Year', value: 'year' },
        ],
      },
    }),
  },
  async run(context) {
    const { base_url, api_key } = context.auth.props;
    const { websiteId, startDate, endDate, unit } = context.propsValue;

    const response = await umamiApiCall<{
      pageviews: { x: string; y: number }[];
      sessions: { x: string; y: number }[];
    }>({
      serverUrl: base_url,
      apiKey: api_key,
      method: HttpMethod.GET,
      path: `/websites/${websiteId}/pageviews`,
      queryParams: {
        startAt: String(new Date(startDate).getTime()),
        endAt: String(new Date(endDate).getTime()),
        unit: unit ?? 'day',
      },
    });

    return response.body.pageviews.map((pv, i) => ({
      date: pv.x,
      pageviews: pv.y,
      sessions: response.body.sessions[i]?.y ?? 0,
    }));
  },
});
