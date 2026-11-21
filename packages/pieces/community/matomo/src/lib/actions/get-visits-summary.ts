import { createAction } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps, matomoUtils } from '../common/props';

export const getVisitsSummaryAction = createAction({
  name: 'get_visits_summary',
  classification: 'READ',
  auth: matomoAuth,
  displayName: 'Get Visits Summary',
  description: 'Get visits, unique visitors, actions, bounce rate and time on site for a period.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the headline traffic metrics of a Matomo site for one period: nb_visits, nb_uniq_visitors, nb_users, nb_actions, max_actions, bounce_count, bounce_rate (e.g. "45%"), nb_actions_per_visit, sum_visit_length and avg_time_on_site (seconds). period is day, week, month, year or range; date is today, yesterday or YYYY-MM-DD, and for range YYYY-MM-DD,YYYY-MM-DD or lastN. siteId is optional (connection site otherwise). Totals are 0 when there is no traffic. Read-only.',
    idempotent: true,
  },
  props: {
    period: matomoProps.periodDropdown({ required: true }),
    date: matomoProps.dateText({ required: true }),
    siteId: matomoProps.siteIdDropdown(),
  },
  outputSchema: {
    fields: [
      { key: 'period', label: 'Period' },
      { key: 'date', label: 'Date' },
      { key: 'nb_visits', label: 'Visits', format: 'number' },
      { key: 'nb_uniq_visitors', label: 'Unique Visitors', format: 'number' },
      { key: 'nb_users', label: 'Users', format: 'number' },
      { key: 'nb_actions', label: 'Actions', format: 'number' },
      { key: 'max_actions', label: 'Max Actions in One Visit', format: 'number' },
      { key: 'bounce_count', label: 'Bounces', format: 'number' },
      { key: 'bounce_rate', label: 'Bounce Rate' },
      { key: 'nb_actions_per_visit', label: 'Actions per Visit', format: 'number' },
      { key: 'sum_visit_length', label: 'Total Visit Length (s)', format: 'number' },
      { key: 'avg_time_on_site', label: 'Average Time on Site (s)', format: 'number' },
    ],
  },
  async run(context) {
    const { siteId, period, date } = context.propsValue;
    const resolved = matomoUtils.resolvePeriod({ period, date });
    const response = await matomoApi.call({
      auth: context.auth.props,
      method: 'VisitsSummary.get',
      idSite: siteId,
      params: resolved,
    });
    const summary = matomoApi.isRecord(response) ? response : {};
    return {
      period: resolved.period,
      date: resolved.date,
      nb_visits: matomoUtils.toNumber(summary['nb_visits']) ?? 0,
      nb_uniq_visitors: matomoUtils.toNumber(summary['nb_uniq_visitors']),
      nb_users: matomoUtils.toNumber(summary['nb_users']) ?? 0,
      nb_actions: matomoUtils.toNumber(summary['nb_actions']) ?? 0,
      max_actions: matomoUtils.toNumber(summary['max_actions']) ?? 0,
      bounce_count: matomoUtils.toNumber(summary['bounce_count']) ?? 0,
      bounce_rate: summary['bounce_rate'] ?? '0%',
      nb_actions_per_visit: matomoUtils.toNumber(summary['nb_actions_per_visit']) ?? 0,
      sum_visit_length: matomoUtils.toNumber(summary['sum_visit_length']) ?? 0,
      avg_time_on_site: matomoUtils.toNumber(summary['avg_time_on_site']) ?? 0,
    };
  },
});
