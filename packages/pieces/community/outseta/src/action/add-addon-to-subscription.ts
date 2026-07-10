import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { addOnUidDropdown } from '../common/dropdowns';

export const addAddonToSubscriptionAction = createAction({
  name: 'add_addon_to_subscription',
  auth: outsetaAuth,
  displayName: 'Add Add-on to Subscription',
  description:
    "Attach a recurring add-on to an account's current subscription. Different from Add Usage for Add-on, which only records consumption on a metered add-on already attached.",
  audience: 'both',
  aiMetadata: {
    description:
      'Attaches a recurring add-on to an account\'s current subscription, by account UID and add-on UID. Use to add an ongoing add-on charge; to report metered consumption on an add-on that is already attached use Add Usage for Add-on instead. Requires an active subscription. Not idempotent: each call adds another add-on instance.',
    idempotent: false,
  },
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The UID of the account whose subscription will receive the add-on.',
      required: true,
    }),
    addOnUid: addOnUidDropdown({ refreshers: [] }),
    quantity: Property.Number({
      displayName: 'Quantity',
      required: false,
      defaultValue: 1,
      description: 'Number of add-on units to attach. Defaults to 1.',
    }),
    billingRenewalTerm: Property.StaticDropdown({
      displayName: 'Billing Renewal Term',
      required: false,
      defaultValue: 1,
      description: 'How often the add-on is billed. Defaults to Monthly.',
      options: {
        disabled: false,
        options: [
          { label: 'Monthly', value: 1 },
          { label: 'Annual', value: 2 },
          { label: 'Quarterly', value: 3 },
          { label: 'One-time', value: 4 },
        ],
      },
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=CurrentSubscription.Uid`
    );
    const subscriptionUid = account?.CurrentSubscription?.Uid;
    if (!subscriptionUid) {
      throw new Error(
        `Account ${context.propsValue.accountUid} does not have an active subscription.`
      );
    }

    const result = await client.post<any>('/api/v1/billing/subscriptionaddons', {
      AddOn: { Uid: context.propsValue.addOnUid },
      Subscription: { Uid: subscriptionUid },
      Quantity: context.propsValue.quantity ?? 1,
      BillingRenewalTerm: context.propsValue.billingRenewalTerm ?? 1,
    });

    return {
      subscription_uid: subscriptionUid,
      addon_uid: context.propsValue.addOnUid,
      quantity: result?.Quantity ?? context.propsValue.quantity ?? 1,
      subscription_addon_uid: result?.Uid ?? null,
    };
  },
});
