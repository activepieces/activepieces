import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth, UmamiAuthValue } from '../auth';
import { umamiApiCall, umamiCommon } from '../common';

export const getPageviews = createAction({
  auth: umamiAuth,
  name: 'get_pageviews',
  displayName: 'Get Pageviews',
  description:
    'Returns pageview and session counts over time, broken down by hour, day, week, month, or year.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a time series of pageview and session counts for one Umami-tracked website across a date range, bucketed by a configurable unit (hour, day, week, month, or year). Use for trend or charting questions rather than a single aggregate total. Requires a website ID and a start/end date; the grouping unit and timezone are optional. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    websiteId: umamiCommon.websiteDropdown,
    startDate: umamiCommon.dateRange.startDate,
    endDate: umamiCommon.dateRange.endDate,
    unit: Property.StaticDropdown({
      displayName: 'Group By',
      description: 'How to bucket the results over time.',
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
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description:
        'Timezone for date grouping, e.g. Europe/Paris or America/New_York. Defaults to UTC.',
      required: false,
      defaultValue: 'UTC',
    }),
  },
  async run(context) {
    const { websiteId, startDate, endDate, unit, timezone } =
      context.propsValue;

    const response = await umamiApiCall<{
      pageviews: { x: string; y: number }[];
      sessions: { x: string; y: number }[];
    }>({
      auth: context.auth as UmamiAuthValue,
      method: HttpMethod.GET,
      path: `/websites/${websiteId}/pageviews`,
      queryParams: {
        startAt: String(new Date(startDate).getTime()),
        endAt: String(new Date(endDate).getTime()),
        unit: unit ?? 'day',
        timezone: timezone ?? 'UTC',
      },
    });

    return response.body.pageviews.map((pv, i) => ({
      date: pv.x,
      pageviews: pv.y,
      sessions: response.body.sessions[i]?.y ?? 0,
    }));
  },
});
