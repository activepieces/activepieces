import { createAction, Property } from '@activepieces/pieces-framework';
import { privatusAnalyticsAuth } from '../auth';
import { PeriodInfo, privatusApiCall, segment } from '../common/client';
import { periodProps, periodQuery, siteDropdown } from '../common/props';

type BreakdownResponse = {
  period: PeriodInfo;
  dimension: string;
  label: string;
  has_more: boolean;
  rows: Array<Record<string, string | number | null>>;
};

export const REPORT_OPTIONS = [
  { label: 'Pages', value: 'page' },
  { label: 'Entry pages', value: 'entry_page' },
  { label: 'Exit pages', value: 'exit_page' },
  { label: 'Referrers', value: 'referrer' },
  { label: 'Channels', value: 'channel' },
  { label: 'UTM source', value: 'utm_source' },
  { label: 'UTM medium', value: 'utm_medium' },
  { label: 'UTM campaign', value: 'utm_campaign' },
  { label: 'Countries', value: 'country' },
  { label: 'Languages', value: 'language' },
  { label: 'Devices', value: 'device' },
  { label: 'Browsers', value: 'browser' },
  { label: 'Operating systems', value: 'os' },
  { label: 'Hostnames', value: 'hostname' },
  { label: 'Custom events', value: 'event' },
  { label: 'Goals', value: 'goal' },
];

export const getTopValuesAction = createAction({
  auth: privatusAnalyticsAuth,
  name: 'get_top_values',
  classification: 'READ',
  displayName: 'Get Top Pages, Referrers and More',
  description:
    'Gets the top pages, referrers, channels, campaigns, countries, devices, browsers, custom events or goals of a site, one row each.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets a ranked list for one website and date range of a single report: pages, entry or exit pages, referrers, channels, UTM source, medium or campaign, countries, languages, devices, browsers, operating systems, hostnames, custom events or goals. Use to see what is most visited or where visitors come from. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    site_id: siteDropdown,
    dimension: Property.StaticDropdown({
      displayName: 'Report',
      description: 'What to list.',
      required: true,
      defaultValue: 'page',
      options: { disabled: false, options: REPORT_OPTIONS },
    }),
    ...periodProps,
    limit: Property.Number({
      displayName: 'Rows',
      description: 'How many rows to get, from 1 to 100.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = Math.min(100, Math.max(1, Math.round(propsValue.limit ?? 10)));
    const data = await privatusApiCall<BreakdownResponse>({
      token: auth.secret_text,
      path: `/sites/${segment(propsValue.site_id)}/breakdown/${segment(propsValue.dimension)}.json`,
      queryParams: { ...periodQuery(propsValue), limit },
    });
    return (data.rows ?? []).map((row, index) => ({
      rank: index + 1,
      report: data.dimension,
      ...row,
      value: row['value'] === '' || row['value'] === null ? '(none)' : row['value'],
    }));
  },
});
