import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getSubscriptionAction = createAction({
  name: 'get_subscription',
  auth: outsetaAuth,
  displayName: 'Retrieve Subscription',
  description:
    "Retrieve a subscription by its UID, or fetch the current subscription of an account by Account UID. Returns plan, billing terms, renewal dates, discount, and add-on details.",
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a subscription by its UID, or an account\'s current subscription by account UID, returning plan, billing term, renewal dates, discount, and add-ons. Use to read subscription/billing state; for account-level fields use Retrieve Account. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    lookupBy: Property.StaticDropdown({
      displayName: 'Lookup by',
      description: 'How to find the subscription to retrieve.',
      required: true,
      defaultValue: 'subscriptionUid',
      options: {
        disabled: false,
        options: [
          { label: 'Subscription UID', value: 'subscriptionUid' },
          { label: "Account UID (current subscription)", value: 'accountUid' },
        ],
      },
    }),
    subscriptionUid: Property.ShortText({
      displayName: 'Subscription UID',
      required: false,
      description: 'Used when "Lookup by" is set to Subscription UID.',
    }),
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: false,
      description: 'Used when "Lookup by" is set to Account UID. Resolves to the account\'s current subscription.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    let subscriptionUid = context.propsValue.subscriptionUid;

    if (context.propsValue.lookupBy === 'accountUid') {
      const accountUid = context.propsValue.accountUid;
      if (!accountUid) {
        throw new Error('Account UID is required when looking up by Account UID.');
      }
      const account = await client.get<any>(
        `/api/v1/crm/accounts/${accountUid}?fields=Uid,CurrentSubscription.Uid`
      );
      subscriptionUid = account?.CurrentSubscription?.Uid ?? null;
      if (!subscriptionUid) {
        throw new Error(`Account ${accountUid} does not have an active subscription.`);
      }
    }

    if (!subscriptionUid) {
      throw new Error('Subscription UID is required.');
    }

    const sub = await client.get<any>(
      `/api/v1/billing/subscriptions/${subscriptionUid}?fields=*,Plan.*,Plan.PlanFamily.*,Account.*,SubscriptionAddOns.*,SubscriptionAddOns.AddOn.*`
    );

    const rawAddOns = sub?.SubscriptionAddOns;
    const addOns: any[] = Array.isArray(rawAddOns)
      ? rawAddOns
      : (rawAddOns?.items ?? rawAddOns?.Items ?? []);

    return {
      uid: sub.Uid ?? null,
      account_uid: sub.Account?.Uid ?? null,
      account_name: sub.Account?.Name ?? null,
      subscription_status: sub.SubscriptionStatus ?? null,
      plan_uid: sub.Plan?.Uid ?? null,
      plan_name: sub.Plan?.Name ?? null,
      plan_family_name: sub.Plan?.PlanFamily?.Name ?? null,
      billing_renewal_term: sub.BillingRenewalTerm ?? null,
      rate: sub.Rate ?? null,
      discount_code: sub.DiscountCode ?? null,
      start_date: sub.StartDate ?? null,
      end_date: sub.EndDate ?? null,
      renewal_date: sub.RenewalDate ?? null,
      validity_date: sub.RenewalDate ?? sub.EndDate ?? null,
      created: sub.Created ?? null,
      updated: sub.Updated ?? null,
      add_ons: addOns.map((a: any) => ({
        uid: a.AddOn?.Uid ?? a.Uid ?? null,
        name: a.AddOn?.Name ?? null,
        quantity: a.Quantity ?? null,
      })),
    };
  },
});
