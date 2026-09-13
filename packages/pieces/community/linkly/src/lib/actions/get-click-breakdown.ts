import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { linklyApiCall } from '../common/client';
import { workspaceDropdown } from '../common/props';

export const getClickBreakdown = createAction({
  auth: linklyAuth,
  name: 'get_click_breakdown',
  displayName: 'Get Click Breakdown',
  description: 'Click counts grouped by country, city, referrer, platform, ISP, link, UTM value and more.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns click counts grouped by one dimension (country, city, region, platform, destination, referer, bot_name, isp, link_id, remote_ip, top_params, ad_network, utm_source, utm_medium, utm_campaign, utm_content, utm_term) for a Linkly workspace or a single link, within an optional date range. Output is { total, values: [{ value, count }] } ordered by count descending. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: workspaceDropdown,
    counter: Property.StaticDropdown({
      displayName: 'Group by',
      required: true,
      defaultValue: 'country',
      options: {
        disabled: false,
        options: [
          { label: 'Country', value: 'country' },
          { label: 'City', value: 'city' },
          { label: 'Region', value: 'region' },
          { label: 'Platform / device', value: 'platform' },
          { label: 'Referrer', value: 'referer' },
          { label: 'Destination URL', value: 'destination' },
          { label: 'Link', value: 'link_id' },
          { label: 'ISP', value: 'isp' },
          { label: 'Bot name', value: 'bot_name' },
          { label: 'Ad network', value: 'ad_network' },
          { label: 'Query parameters', value: 'top_params' },
          { label: 'UTM source', value: 'utm_source' },
          { label: 'UTM medium', value: 'utm_medium' },
          { label: 'UTM campaign', value: 'utm_campaign' },
          { label: 'UTM content', value: 'utm_content' },
          { label: 'UTM term', value: 'utm_term' },
        ],
      },
    }),
    link_id: Property.Number({
      displayName: 'Link ID',
      description: 'Leave empty for the whole workspace.',
      required: false,
    }),
    start: Property.ShortText({
      displayName: 'Start date',
      description: 'YYYY-MM-DD (inclusive).',
      required: false,
    }),
    end: Property.ShortText({
      displayName: 'End date',
      description: 'YYYY-MM-DD (inclusive).',
      required: false,
    }),
    bots: Property.Checkbox({
      displayName: 'Include bot clicks',
      required: false,
      defaultValue: false,
    }),
    unique: Property.Checkbox({
      displayName: 'Unique visitors only',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { workspace_id, counter, link_id, start, end, bots, unique } = propsValue;
    return linklyApiCall({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/workspace/${workspace_id}/clicks/counters/${counter}`,
      query: { link_id, start, end, bots: bots ? 'true' : 'false', unique: unique ? 'true' : 'false' },
    });
  },
});
