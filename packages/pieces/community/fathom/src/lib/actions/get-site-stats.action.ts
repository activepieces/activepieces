import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { fathomAuth } from '../..';

export const getSiteStats = createAction({
  name: 'get_site_stats',
  auth: fathomAuth,
  displayName: 'Get Site Stats',
  description: 'Get aggregated statistics for a Fathom Analytics site',
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The ID of the Fathom site (found in your site settings)',
      required: true,
    }),
    entity: Property.StaticDropdown({
      displayName: 'Metric',
      description: 'The type of metric to retrieve',
      required: true,
      options: {
        options: [
          { label: 'Pageviews', value: 'pageview' },
          { label: 'Sessions', value: 'session' },
          { label: 'Unique Visitors', value: 'unique_visits' },
          { label: 'Avg Time on Site', value: 'avg_duration' },
          { label: 'Bounce Rate', value: 'bounce_rate' },
        ],
      },
    }),
    date_grouping: Property.StaticDropdown({
      displayName: 'Date Grouping',
      description: 'How to group the returned data',
      required: false,
      options: {
        options: [
          { label: 'Day', value: 'day' },
          { label: 'Month', value: 'month' },
          { label: 'Year', value: 'year' },
        ],
      },
    }),
    date_from: Property.ShortText({
      displayName: 'Date From',
      description: 'Start date in YYYY-MM-DD format (optional)',
      required: false,
    }),
    date_to: Property.ShortText({
      displayName: 'Date To',
      description: 'End date in YYYY-MM-DD format (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, string> = {
      entity: propsValue.entity,
      entity_id: propsValue.site_id,
      date_grouping: propsValue.date_grouping || 'day',
    };
    if (propsValue.date_from) params['date_from'] = propsValue.date_from;
    if (propsValue.date_to) params['date_to'] = propsValue.date_to;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.usefathom.com/v1/aggregations?${new URLSearchParams(params).toString()}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    return response.body;
  },
});
