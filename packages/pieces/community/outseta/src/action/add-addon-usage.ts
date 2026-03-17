import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const addAddonUsageAction = createAction({
  name: 'add_addon_usage',
  auth: outsetaAuth,
  displayName: 'Track Add-on Usage',
  description:
    'Track usage for a metered (usage-based) add-on on an account',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: true,
    }),
    addOnUid: Property.ShortText({
      displayName: 'Add-On UID',
      required: true,
      description:
        'The UID of the add-on product. Find it in Outseta → Billing → Add-ons.',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
      description: 'The usage amount to record',
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

    // Get the account with subscription add-ons to find the SubscriptionAddOn UID
    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=Uid,CurrentSubscription.*,CurrentSubscription.SubscriptionAddOns.*,CurrentSubscription.SubscriptionAddOns.AddOn.*`
    );

    if (!account.CurrentSubscription) {
      throw new Error('This account does not have an active subscription.');
    }

    // Normalize SubscriptionAddOns — may be a plain array or a paginated object
    const rawAddOns = account.CurrentSubscription.SubscriptionAddOns;
    const subscriptionAddOns: any[] = Array.isArray(rawAddOns)
      ? rawAddOns
      : (rawAddOns?.items ?? rawAddOns?.Items ?? []);
    const matchingAddOn = subscriptionAddOns.find(
      (sa: any) => sa.AddOn?.Uid === context.propsValue.addOnUid
    );

    if (!matchingAddOn) {
      throw new Error(
        `Add-on with UID "${context.propsValue.addOnUid}" not found on this account's current subscription. Available add-ons: ${subscriptionAddOns.map((sa: any) => `${sa.AddOn?.Name} (${sa.AddOn?.Uid})`).join(', ') || 'none'}`
      );
    }

    const result = await client.post<any>(`/api/v1/billing/usage`, {
      UsageDate:
        context.propsValue.usageDate ?? new Date().toISOString(),
      Amount: context.propsValue.amount,
      SubscriptionAddOn: {
        Uid: matchingAddOn.Uid,
      },
    });

    return result;
  },
});
