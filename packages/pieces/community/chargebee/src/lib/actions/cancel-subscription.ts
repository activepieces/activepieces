import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import { chargebeeRequest } from '../common/client';

type CancelSubscriptionProps = {
  subscription_id: string;
  end_of_term?: boolean;
};

export const cancelSubscription = createAction({
  name: 'cancel_subscription',
  auth: chargebeeAuth,
  displayName: 'Cancel Subscription',
  description:
    'Cancel a Chargebee subscription immediately or at the end of the current term.',
  props: {
    subscription_id: Property.ShortText({
      displayName: 'Subscription ID',
      required: true,
    }),
    end_of_term: Property.Checkbox({
      displayName: 'Cancel At End Of Term',
      description:
        'If checked, the subscription remains active until the current term ends.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { subscription_id, end_of_term } =
      context.propsValue as CancelSubscriptionProps;

    return await chargebeeRequest({
      site: context.auth.props.site,
      apiKey: context.auth.props.api_key,
      method: HttpMethod.POST,
      path: `/subscriptions/${encodeURIComponent(subscription_id)}/cancel`,
      contentType: 'application/x-www-form-urlencoded',
      body: {
        end_of_term: end_of_term ? 'true' : 'false',
      },
    });
  },
});
