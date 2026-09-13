import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { linklyApiCall } from '../common/client';
import { workspaceDropdown } from '../common/props';

export const getClickAnalytics = createAction({
  auth: linklyAuth,
  name: 'get_click_analytics',
  displayName: 'Get Click Analytics',
  description: 'Clicks over time for a workspace or a single link, by day or by hour.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns a time series of click counts for a Linkly workspace, optionally narrowed to one link, a date range, a country, and human-only or unique-only clicks. Output is { traffic: [{ t: date, y: count }] }. Use for reporting, charts, or to check whether a campaign link is getting traffic. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: workspaceDropdown,
    link_id: Property.Number({
      displayName: 'Link ID',
      description: 'Leave empty for the whole workspace.',
      required: false,
    }),
    start: Property.ShortText({
      displayName: 'Start date',
      description: 'YYYY-MM-DD (inclusive). Defaults to 30 days ago.',
      required: false,
    }),
    end: Property.ShortText({
      displayName: 'End date',
      description: 'YYYY-MM-DD (inclusive). Defaults to today.',
      required: false,
    }),
    frequency: Property.StaticDropdown({
      displayName: 'Granularity',
      required: false,
      defaultValue: 'day',
      options: {
        disabled: false,
        options: [
          { label: 'Per day', value: 'day' },
          { label: 'Per hour', value: 'hour' },
        ],
      },
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter ISO code, e.g. US.',
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
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA name such as Europe/London. Defaults to UTC.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { workspace_id, link_id, start, end, frequency, country, bots, unique, timezone } = propsValue;
    return linklyApiCall({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/workspace/${workspace_id}/clicks`,
      query: { link_id, start, end, frequency, country, bots: bots ? 'true' : 'false', unique: unique ? 'true' : 'false', timezone },
    });
  },
});
