import { Property } from '@activepieces/pieces-framework';
import { privatusAnalyticsAuth } from '../auth';
import { listGoals, listSites } from './client';

export const siteDropdown = Property.Dropdown({
  auth: privatusAnalyticsAuth,
  displayName: 'Site',
  description: 'The website to look at.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Privatus Analytics account first',
        options: [],
      };
    }
    const sites = await listSites(auth.secret_text);
    return {
      disabled: false,
      placeholder: sites.length === 0 ? 'No sites yet. Add one in Privatus Analytics.' : undefined,
      options: sites.map((site) => ({
        label: site.name && site.name !== site.domain ? `${site.name} (${site.domain})` : site.domain,
        value: site.id,
      })),
    };
  },
});

export const goalDropdown = Property.Dropdown({
  auth: privatusAnalyticsAuth,
  displayName: 'Goal',
  description: 'Only this goal. Leave empty to watch every goal of the site.',
  required: false,
  refreshers: ['site_id'],
  options: async ({ auth, site_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Privatus Analytics account first',
        options: [],
      };
    }
    if (!site_id) {
      return {
        disabled: true,
        placeholder: 'Please select a site first',
        options: [],
      };
    }
    const goals = await listGoals(auth.secret_text, site_id as string, {
      period: 'today',
    });
    return {
      disabled: false,
      placeholder: goals.length === 0 ? 'This site has no goals yet' : undefined,
      options: goals.map((goal) => ({ label: goal.name, value: goal.id })),
    };
  },
});

export const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 14 days', value: '14d' },
  { label: 'Last 28 days', value: '28d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Month to date', value: 'mtd' },
  { label: 'Last month', value: 'last_month' },
  { label: 'Quarter to date', value: 'qtd' },
  { label: 'Last quarter', value: 'last_quarter' },
  { label: 'Year to date', value: 'ytd' },
  { label: 'Last 12 months', value: '12mo' },
  { label: 'Last year', value: 'last_year' },
  { label: 'All time', value: 'all' },
  { label: 'Custom dates', value: 'custom' },
];

export const periodProps = {
  period: Property.StaticDropdown({
    displayName: 'Period',
    description: 'Which dates to look at, in the timezone of the site. Pick **Custom dates** to set a start and end date.',
    required: true,
    defaultValue: '30d',
    options: { disabled: false, options: PERIOD_OPTIONS },
  }),
  date_from: Property.DateTime({
    displayName: 'Start Date',
    description: 'First day of the range. Only used with **Custom dates**.',
    required: false,
  }),
  date_to: Property.DateTime({
    displayName: 'End Date',
    description: 'Last day of the range, included. Only used with **Custom dates**.',
    required: false,
  }),
};

export function periodQuery(props: {
  period?: string;
  date_from?: string;
  date_to?: string;
}): Record<string, string | undefined> {
  const period = props.period || '30d';
  if (period !== 'custom') {
    return { period };
  }
  if (!props.date_from || !props.date_to) {
    throw new Error('Custom dates need both a Start Date and an End Date.');
  }
  return {
    period,
    from: props.date_from.slice(0, 10),
    to: props.date_to.slice(0, 10),
  };
}
