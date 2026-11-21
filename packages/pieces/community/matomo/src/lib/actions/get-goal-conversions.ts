import { createAction } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';
import { matomoProps, matomoUtils } from '../common/props';

export const getGoalConversionsAction = createAction({
  name: 'get_goal_conversions',
  classification: 'READ',
  auth: matomoAuth,
  displayName: 'Get Goal Conversions',
  description: 'Get conversions, conversion rate and revenue for one goal or all goals in a period.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets goal conversion metrics of a Matomo site for one period: nb_conversions, nb_visits_converted, conversion_rate (e.g. "3.5%") and revenue. Give goalId (the idgoal number from List Goals) for one goal, or leave it empty for all goals combined. period is day, week, month, year or range; date is today, yesterday or YYYY-MM-DD, and for range YYYY-MM-DD,YYYY-MM-DD or lastN. siteId is optional (connection site otherwise). Values are 0 when nothing converted. Read-only.',
    idempotent: true,
  },
  props: {
    period: matomoProps.periodDropdown({ required: true }),
    date: matomoProps.dateText({ required: true }),
    siteId: matomoProps.siteIdDropdown(),
    goalId: matomoProps.goalDropdown(),
  },
  outputSchema: {
    fields: [
      { key: 'goalId', label: 'Goal ID', format: 'number' },
      { key: 'period', label: 'Period' },
      { key: 'date', label: 'Date' },
      { key: 'nb_conversions', label: 'Conversions', format: 'number' },
      { key: 'nb_visits_converted', label: 'Visits Converted', format: 'number' },
      { key: 'conversion_rate', label: 'Conversion Rate' },
      { key: 'revenue', label: 'Revenue', format: 'number' },
    ],
  },
  async run(context) {
    const { siteId, goalId, period, date } = context.propsValue;
    const resolved = matomoUtils.resolvePeriod({ period, date });
    const response = await matomoApi.call({
      auth: context.auth.props,
      method: 'Goals.get',
      idSite: siteId,
      params: { ...resolved, idGoal: goalId },
    });
    const row = matomoApi.isRecord(response) ? response : {};
    return {
      goalId: goalId ?? null,
      period: resolved.period,
      date: resolved.date,
      nb_conversions: matomoUtils.toNumber(row['nb_conversions']) ?? 0,
      nb_visits_converted: matomoUtils.toNumber(row['nb_visits_converted']) ?? 0,
      conversion_rate: row['conversion_rate'] ?? '0%',
      revenue: matomoUtils.toNumber(row['revenue']) ?? 0,
    };
  },
});
