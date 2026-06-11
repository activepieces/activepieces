import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const getBreakdown = createAction({
  name: 'get_breakdown',
  auth: plausibleAuth,
  displayName: 'Get Traffic Breakdown',
  description: 'Break down traffic by page, source, country, or other dimensions',
  audience: 'both',
  aiMetadata: { description: 'Breaks down a site\'s visitor stats by a single chosen dimension (page, source, country, browser, OS, or device) over a preset time period, returning the top entries up to an optional limit. Use to see which pages, sources, or segments drive traffic rather than overall totals. Read-only and safe to repeat.', idempotent: true },
  props: {
    site_id: siteIdDropdown,
    period: Property.StaticDropdown({
      displayName: 'Period',
      required: true,
      options: {
        options: [
          { label: 'Today', value: 'day' },
          { label: 'Last 7 days', value: '7d' },
          { label: 'Last 30 days', value: '30d' },
          { label: 'This month', value: 'month' },
          { label: 'Last 6 months', value: '6mo' },
          { label: 'Last 12 months', value: '12mo' },
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
    const response = await plausibleApiCall<{ results: Record<string, unknown>[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      endpoint: '/stats/breakdown',
      queryParams: {
        site_id: propsValue.site_id,
        period: propsValue.period,
        property: propsValue.property,
        limit: String(propsValue.limit ?? 10),
      },
    });
    return response.results;
  },
});
