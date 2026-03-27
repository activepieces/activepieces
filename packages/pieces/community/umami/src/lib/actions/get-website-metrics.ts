import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { umamiAuth } from '../..';
import { umamiApiCall, umamiCommon } from '../common';

export const getWebsiteMetrics = createAction({
  auth: umamiAuth,
  name: 'get_website_metrics',
  displayName: 'Get Website Metrics',
  description: 'Get metrics (URLs, referrers, browsers, OS, countries, etc.) for a website over a date range.',
  props: {
    websiteId: umamiCommon.websiteDropdown,
    startDate: umamiCommon.dateRange.startDate,
    endDate: umamiCommon.dateRange.endDate,
    type: Property.StaticDropdown({
      displayName: 'Metric Type',
      description: 'The type of metric to retrieve.',
      required: true,
      defaultValue: 'url',
      options: {
        options: [
          { label: 'URLs', value: 'url' },
          { label: 'Referrers', value: 'referrer' },
          { label: 'Browsers', value: 'browser' },
          { label: 'Operating Systems', value: 'os' },
          { label: 'Devices', value: 'device' },
          { label: 'Countries', value: 'country' },
          { label: 'Regions', value: 'region' },
          { label: 'Cities', value: 'city' },
          { label: 'Languages', value: 'language' },
          { label: 'Screens', value: 'screen' },
          { label: 'Events', value: 'event' },
          { label: 'Titles', value: 'title' },
          { label: 'Tags', value: 'tag' },
          { label: 'Hosts', value: 'host' },
          { label: 'Query Parameters', value: 'query' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return.',
      required: false,
      defaultValue: 500,
    }),
  },
  async run(context) {
    const { base_url, api_key } = context.auth.props;
    const { websiteId, startDate, endDate, type, limit } = context.propsValue;

    const response = await umamiApiCall<{ x: string; y: number }[]>({
      serverUrl: base_url,
      apiKey: api_key,
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
