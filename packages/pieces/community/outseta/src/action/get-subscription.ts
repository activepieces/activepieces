import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getSubscriptionAction = createAction({
  name: 'get_subscription',
  auth: outsetaAuth,
  displayName: 'Get subscription',
  description: 'Retrieve an Outseta subscription by its UID',
  props: {
    subscriptionUid: Property.ShortText({
      displayName: 'Subscription UID',
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const subscription = await client.get<any>(
      `/api/v1/billing/subscriptions/${context.propsValue.subscriptionUid}`
    );

    return {
      subscriptionUid: context.propsValue.subscriptionUid,
      subscription,
      rawResponse: subscription,
    };
  },
});
