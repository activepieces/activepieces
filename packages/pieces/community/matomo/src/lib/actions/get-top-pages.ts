import { createAction, Property } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps, matomoUtils } from '../common/props';

export const getTopPagesAction = createAction({
  name: 'get_top_pages',
  classification: 'READ',
  auth: matomoAuth,
  displayName: 'Get Top Pages',
  description: 'Get the most viewed page URLs for a period.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the most viewed page URLs of a Matomo site for one period, sorted by Matomo (most visits first). Each page has label (path), url, nb_visits, nb_uniq_visitors, nb_hits (pageviews), sum_time_spent, avg_time_on_page, bounce_rate and exit_rate. limit 1-500 (default 10). period is day, week, month, year or range; date is today, yesterday or YYYY-MM-DD, and for range YYYY-MM-DD,YYYY-MM-DD or lastN. siteId is optional (connection site otherwise). Read-only.',
    idempotent: true,
  },
  props: {
    period: matomoProps.periodDropdown({ required: true }),
    date: matomoProps.dateText({ required: true }),
    limit: Property.Number({ displayName: 'Limit', description: 'How many pages to return (1-500).', required: false, defaultValue: 10, placeholder: '10' }),
    siteId: matomoProps.siteIdDropdown(),
  },
  outputSchema: {
    fields: [
      { key: 'count', label: 'Pages Returned', format: 'number' },
      {
        key: 'pages',
        label: 'Pages',
        labelKey: 'label',
        listItems: [
          { key: 'label', label: 'Page' },
          { key: 'url', label: 'URL', format: 'url' },
          { key: 'nb_visits', label: 'Visits', format: 'number' },
          { key: 'nb_uniq_visitors', label: 'Unique Visitors', format: 'number' },
          { key: 'nb_hits', label: 'Pageviews', format: 'number' },
          { key: 'sum_time_spent', label: 'Total Time Spent (s)', format: 'number' },
          { key: 'avg_time_on_page', label: 'Average Time on Page (s)', format: 'number' },
          { key: 'bounce_rate', label: 'Bounce Rate' },
          { key: 'exit_rate', label: 'Exit Rate' },
        ],
      },
    ],
  },
  async run(context) {
    const { siteId, period, date, limit } = context.propsValue;
    const resolved = matomoUtils.resolvePeriod({ period, date });
    const requested = limit !== undefined && limit !== null && Number.isFinite(limit) ? Math.trunc(limit) : 10;
    const filterLimit = Math.min(Math.max(requested, 1), 500);
    const response = await matomoApi.call({
      auth: context.auth.props,
      method: 'Actions.getPageUrls',
      idSite: siteId,
      params: { ...resolved, flat: 1, filter_limit: filterLimit },
    });
    const pages = matomoApi.toArray(response).filter(matomoApi.isRecord).map((row) => ({
      label: row['label'],
      url: row['url'] ?? null,
      nb_visits: matomoUtils.toNumber(row['nb_visits']),
      nb_uniq_visitors: matomoUtils.toNumber(row['nb_uniq_visitors']),
      nb_hits: matomoUtils.toNumber(row['nb_hits']),
      sum_time_spent: matomoUtils.toNumber(row['sum_time_spent']),
      avg_time_on_page: matomoUtils.toNumber(row['avg_time_on_page']),
      bounce_rate: row['bounce_rate'] ?? null,
      exit_rate: row['exit_rate'] ?? null,
    }));
    return { count: pages.length, pages };
  },
});
