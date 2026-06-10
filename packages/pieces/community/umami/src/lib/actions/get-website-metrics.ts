import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth, UmamiAuthValue } from '../auth';
import { umamiApiCall, umamiCommon } from '../common';

export const getWebsiteMetrics = createAction({
  auth: umamiAuth,
  name: 'get_website_metrics',
  displayName: 'Get Website Metrics',
  description:
    'Returns a ranked list for a chosen metric category (e.g. top pages, browsers, or countries) over a date range.',
  props: {
    websiteId: umamiCommon.websiteDropdown,
    startDate: umamiCommon.dateRange.startDate,
    endDate: umamiCommon.dateRange.endDate,
    type: Property.StaticDropdown({
      displayName: 'Metric',
      description: 'Which metric to rank results by.',
      required: true,
      defaultValue: 'url',
      options: {
        options: [
          { label: 'Pages', value: 'url' },
          { label: 'Referrers', value: 'referrer' },
          { label: 'Browsers', value: 'browser' },
          { label: 'Operating Systems', value: 'os' },
          { label: 'Devices', value: 'device' },
          { label: 'Countries', value: 'country' },
          { label: 'Regions', value: 'region' },
          { label: 'Cities', value: 'city' },
          { label: 'Languages', value: 'language' },
          { label: 'Screen Sizes', value: 'screen' },
          { label: 'Events', value: 'event' },
          { label: 'Page Titles', value: 'title' },
          { label: 'Tags', value: 'tag' },
          { label: 'Hosts', value: 'host' },
          { label: 'Query Parameters', value: 'query' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return.',
      required: false,
      defaultValue: 500,
    }),
  },
  async run(context) {
    const { websiteId, startDate, endDate, type, limit } = context.propsValue;

    const response = await umamiApiCall<{ x: string; y: number }[]>({
      auth: context.auth as UmamiAuthValue,
      method: HttpMethod.GET,
      path: `/websites/${websiteId}/metrics`,
      queryParams: {
        startAt: String(new Date(startDate).getTime()),
        endAt: String(new Date(endDate).getTime()),
        type,
        limit: String(limit ?? 500),
      },
    });

    return response.body.map((item) => ({
      name: item.x,
      count: item.y,
    }));
  },
});
