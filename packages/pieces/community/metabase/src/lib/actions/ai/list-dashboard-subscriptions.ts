import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListDashboardSubscriptionsOutputSchema } from '../../output-schemas';

export const listDashboardSubscriptionsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_dashboard_subscriptions',
  outputSchema: metabaseListDashboardSubscriptionsOutputSchema,
  displayName: 'List Dashboard Subscriptions',
  description: 'List dashboard subscriptions.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists scheduled dashboard subscriptions (emails or Slack messages of a dashboard), optionally for one dashboard, with their schedule and recipients.',
    idempotent: true,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({
      required: false,
      description:
        'Only subscriptions of this dashboard, from List Dashboards. Empty = all.',
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description: 'Yes = only archived subscriptions. Empty = active ones.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const subscriptions = await metabaseApi.listDashboardSubscriptions({
      auth,
      dashboardId: propsValue.dashboardId,
      archived: propsValue.archived,
    });
    return { subscriptions, count: subscriptions.length };
  },
});
