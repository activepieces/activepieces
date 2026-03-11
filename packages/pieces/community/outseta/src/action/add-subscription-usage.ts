import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const addSubscriptionUsageAction = createAction({
  name: 'add_subscription_usage',
  auth: outsetaAuth,
  displayName: 'Add subscription usage',
  description:
    'Record usage for a metered (usage-based) subscription add-on',
  props: {
    subscriptionAddOnUid: Property.ShortText({
      displayName: 'Subscription Add-On UID',
      required: true,
      description:
        'The UID of the subscription add-on (not the add-on itself)',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
      description: 'The usage amount to record (can be negative to decrease)',
    }),
    usageDate: Property.DateTime({
      displayName: 'Usage Date',
      required: false,
      description: 'The date of usage. Defaults to now if not provided.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const result = await client.post<any>(`/api/v1/billing/usage`, {
      UsageDate:
        context.propsValue.usageDate ?? new Date().toISOString(),
      Amount: context.propsValue.amount,
      SubscriptionAddOn: {
        Uid: context.propsValue.subscriptionAddOnUid,
      },
    });

    return result;
  },
});
