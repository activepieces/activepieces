import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';

export const getBreakdown = createAction({
  name: 'get_breakdown',
  auth: plausibleAuth,
  displayName: 'Get Traffic Breakdown',
  description: 'Break down traffic by page, source, country, or other dimensions',
  props: {
    site_id: Property.ShortText({ displayName: 'Site Domain', required: true }),
    period: Property.StaticDropdown({
      displayName: 'Period',
      required: true,
      options: {
        options: [
          { label: 'Today', value: 'day' },
          { label: 'Last 7 days', value: '7d' },
          { label: 'Last 30 days', value: '30d' },
          { label: 'This month', value: 'month' },
        ],
      },
    }),
    property: Property.StaticDropdown({
      displayName: 'Breakdown By',
      required: true,
      options: {
        options: [
          { label: 'Page', value: 'event:page' },
          { label: 'Source', value: 'visit:source' },
          { label: 'Country', value: 'visit:country' },
          { label: 'Browser', value: 'visit:browser' },
          { label: 'OS', value: 'visit:os' },
          { label: 'Device', value: 'visit:device' },
        ],
      },
    }),
    limit: Property.Number({ displayName: 'Limit', required: false, defaultValue: 10 }),
  },
  async run({ auth, propsValue }) {
    const params = new URLSearchParams({
      site_id: propsValue.site_id,
      period: propsValue.period,
      property: propsValue.property,
      limit: String(propsValue.limit || 10),
    });
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://plausible.io/api/v1/stats/breakdown?${params}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    return response.body;
  },
});
