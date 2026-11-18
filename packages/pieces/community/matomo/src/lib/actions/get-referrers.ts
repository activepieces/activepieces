import { createAction } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps, matomoUtils } from '../common/props';

export const getReferrersAction = createAction({
  name: 'get_referrers',
  classification: 'READ',
  auth: matomoAuth,
  displayName: 'Get Traffic Sources',
  description: 'Get visits by channel type (direct, search engines, websites, campaigns, social) for a period.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets how visitors reached a Matomo site in one period, grouped by channel type: Direct Entry, Search Engines, Websites, Campaigns and Social Networks. Each source has label, nb_visits, nb_uniq_visitors, nb_actions, bounce_count and sum_visit_length; channels with no traffic are omitted. period is day, week, month, year or range; date is today, yesterday or YYYY-MM-DD, and for range YYYY-MM-DD,YYYY-MM-DD or lastN. siteId is optional (connection site otherwise). Read-only.',
    idempotent: true,
  },
  props: {
    period: matomoProps.periodDropdown({ required: true }),
    date: matomoProps.dateText({ required: true }),
    siteId: matomoProps.siteIdDropdown(),
  },
  outputSchema: {
    fields: [
      { key: 'count', label: 'Sources Returned', format: 'number' },
      {
        key: 'sources',
        label: 'Sources',
        labelKey: 'label',
        listItems: [
          { key: 'label', label: 'Channel' },
          { key: 'nb_visits', label: 'Visits', format: 'number' },
          { key: 'nb_uniq_visitors', label: 'Unique Visitors', format: 'number' },
          { key: 'nb_actions', label: 'Actions', format: 'number' },
          { key: 'bounce_count', label: 'Bounces', format: 'number' },
          { key: 'sum_visit_length', label: 'Total Visit Length (s)', format: 'number' },
        ],
      },
    ],
  },
  async run(context) {
    const { siteId, period, date } = context.propsValue;
    const resolved = matomoUtils.resolvePeriod({ period, date });
    const response = await matomoApi.call({
      auth: context.auth.props,
      method: 'Referrers.getReferrerType',
      idSite: siteId,
      params: resolved,
    });
    const sources = matomoApi.toArray(response).filter(matomoApi.isRecord).map((row) => ({
      label: row['label'],
      nb_visits: matomoUtils.toNumber(row['nb_visits']),
      nb_uniq_visitors: matomoUtils.toNumber(row['nb_uniq_visitors']),
      nb_actions: matomoUtils.toNumber(row['nb_actions']),
      bounce_count: matomoUtils.toNumber(row['bounce_count']),
      sum_visit_length: matomoUtils.toNumber(row['sum_visit_length']),
    }));
    return { count: sources.length, sources };
  },
});
