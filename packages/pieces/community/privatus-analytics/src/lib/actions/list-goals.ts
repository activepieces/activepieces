import { createAction } from '@activepieces/pieces-framework';
import { privatusAnalyticsAuth } from '../auth';
import { goalToRow, listGoals } from '../common/client';
import { periodProps, periodQuery, siteDropdown } from '../common/props';

export const listGoalsAction = createAction({
  auth: privatusAnalyticsAuth,
  name: 'list_goals',
  classification: 'SEARCH',
  displayName: 'List Goal Conversions',
  description:
    'Lists the goals of a site with their conversions, conversion rate and change for a period.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the active goals of one website with completions, conversions, conversion rate (percent), value in cents and percent change against the previous period, for a date range. Use to report on sign-ups, purchases or any other goal. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    site_id: siteDropdown,
    ...periodProps,
  },
  async run({ auth, propsValue }) {
    const goals = await listGoals(
      auth.secret_text,
      propsValue.site_id,
      periodQuery(propsValue)
    );
    return goals
      .map(goalToRow)
      .sort((a, b) => b.conversions - a.conversions);
  },
});
