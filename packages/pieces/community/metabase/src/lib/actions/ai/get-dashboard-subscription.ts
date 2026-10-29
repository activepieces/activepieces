import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetDashboardSubscriptionOutputSchema } from '../../output-schemas';

export const getDashboardSubscriptionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_dashboard_subscription',
  outputSchema: metabaseGetDashboardSubscriptionOutputSchema,
  displayName: 'Get Dashboard Subscription',
  description: 'Get a dashboard subscription by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one dashboard subscription with its cards, channels, schedule and recipients.',
    idempotent: true,
  },
  props: {
    subscriptionId: metabaseAiProps.subscriptionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getDashboardSubscription({
      auth,
      subscriptionId: propsValue.subscriptionId,
    });
  },
});
