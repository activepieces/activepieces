import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { dubAuth } from '../..';

export const getAnalytics = createAction({
  name: 'get_analytics',
  auth: dubAuth,
  displayName: 'Get Link Analytics',
  description: 'Get click analytics for a specific link',
  props: {
    link_id: Property.ShortText({ displayName: 'Link ID', description: 'The ID of the link to get analytics for', required: true }),
    event: Property.StaticDropdown({
      displayName: 'Event Type',
      required: false,
      options: {
        options: [
          { label: 'Clicks', value: 'clicks' },
          { label: 'Leads', value: 'leads' },
          { label: 'Sales', value: 'sales' },
        ],
      },
    }),
    interval: Property.StaticDropdown({
      displayName: 'Time Interval',
      required: false,
      options: {
        options: [
          { label: 'Last 24 hours', value: '24h' },
          { label: 'Last 7 days', value: '7d' },
          { label: 'Last 30 days', value: '30d' },
          { label: 'Last 90 days', value: '90d' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const params = new URLSearchParams({ linkId: propsValue.link_id });
    if (propsValue.event) params.set('event', propsValue.event);
    if (propsValue.interval) params.set('interval', propsValue.interval);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.dub.co/analytics?${params}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    return response.body;
  },
});
