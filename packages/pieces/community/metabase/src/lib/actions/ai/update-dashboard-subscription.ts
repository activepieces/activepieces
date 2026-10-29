import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateDashboardSubscriptionOutputSchema } from '../../output-schemas';

export const updateDashboardSubscriptionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_dashboard_subscription',
  outputSchema: metabaseUpdateDashboardSubscriptionOutputSchema,
  displayName: 'Update Dashboard Subscription',
  description: 'Rename, change or archive a dashboard subscription.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a dashboard subscription. Channels replaces the whole delivery configuration (schedule and recipients), so start from Get Dashboard Subscription. Archive with Archived = Yes.',
    idempotent: true,
  },
  props: {
    subscriptionId: metabaseAiProps.subscriptionId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name. Empty = unchanged.',
      required: false,
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes stops and archives the subscription, No restores it. Empty = unchanged.',
      required: false,
    }),
    skipIfEmpty: metabaseAiProps.yesNo({
      displayName: 'Skip If Empty',
      description: 'Do not send when every card is empty. Empty = unchanged.',
      required: false,
    }),
    channels: Property.Json({
      displayName: 'Channels',
      description:
        'Replaces ALL channels (schedule + recipients), in the shape of `channels` from Get Dashboard Subscription. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateDashboardSubscription({
      auth,
      subscriptionId: propsValue.subscriptionId,
      body: {
        name: propsValue.name,
        archived: propsValue.archived,
        skip_if_empty: propsValue.skipIfEmpty,
        channels: propsValue.channels,
      },
    });
  },
});
