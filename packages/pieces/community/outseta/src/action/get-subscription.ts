import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

// Every key of the success payload, emptied out. Returned instead of throwing
// when "Fail if not found" is unchecked, so a flow can branch on `found`
// rather than on a failed step.
const NOT_FOUND_RESULT = {
  found: false,
  uid: null,
  account_uid: null,
  account_name: null,
  subscription_status: null,
  plan_uid: null,
  plan_name: null,
  plan_family_name: null,
  billing_renewal_term: null,
  quantity: null,
  rate: null,
  discount_code: null,
  start_date: null,
  end_date: null,
  expiration_date: null,
  renewal_date: null,
  validity_date: null,
  created: null,
  updated: null,
  add_ons: [],
  add_ons_names: null,
};

export const getSubscriptionAction = createAction({
  name: 'get_subscription',
  auth: outsetaAuth,
  displayName: 'Retrieve Subscription',
  description:
    "Retrieve a subscription by its UID, or fetch the current subscription of an account by Account UID. Returns plan, billing terms, quantity, renewal/expiration dates, discount, and add-on details. Can return found=false instead of failing when there is no such subscription.",
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a subscription by its UID, or an account\'s current subscription by account UID, returning plan, billing term, quantity, renewal/expiration dates, discount, and add-ons. Use to read subscription/billing state; for account-level fields use Retrieve Account. Disable "Fail if not found" to get found=false when the account has no current subscription instead of a failed step. Read-only and idempotent.',
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
    failIfNotFound: Property.Checkbox({
      displayName: 'Fail if not found',
      description:
        'Enabled by default: the step fails when the subscription does not exist, or when the account has no current subscription. Disable it to return found=false instead, so the flow can branch on an expired or cancelled account without failing.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    // Undefined for flows saved before this prop existed: keep failing, which
    // is the behaviour those flows were built against.
    const failIfNotFound = context.propsValue.failIfNotFound ?? true;

    let subscriptionUid = context.propsValue.subscriptionUid;

    if (context.propsValue.lookupBy === 'accountUid') {
      const accountUid = context.propsValue.accountUid;
      if (!accountUid) {
        throw new Error('Account UID is required when looking up by Account UID.');
      }

      let account: any;
      try {
        account = await client.get<any>(
          `/api/v1/crm/accounts/${accountUid}?fields=Uid,CurrentSubscription.Uid`
        );
      } catch (e: any) {
        // Outseta answers 404 for a UID it no longer knows, e.g. an account
        // that has been deleted.
        if (e?.response?.status === 404 && !failIfNotFound) {
          return NOT_FOUND_RESULT;
        }
        throw e;
      }

      // Outseta detaches CurrentSubscription once an account expires, so this
      // is empty for every lapsed account, not only for unknown UIDs.
      subscriptionUid = account?.CurrentSubscription?.Uid ?? null;
      if (!subscriptionUid) {
        if (failIfNotFound) {
          throw new Error(`Account ${accountUid} does not have an active subscription.`);
        }
        return NOT_FOUND_RESULT;
      }
    }

    // A missing UID is a misconfigured step, not a missing record, so this
    // always throws regardless of "Fail if not found".
    if (!subscriptionUid) {
      throw new Error('Subscription UID is required.');
    }

    let sub: any;
    try {
      sub = await client.get<any>(
        `/api/v1/billing/subscriptions/${subscriptionUid}?fields=*,Plan.*,Plan.PlanFamily.*,Account.*,SubscriptionAddOns.*,SubscriptionAddOns.AddOn.*`
      );
    } catch (e: any) {
      if (e?.response?.status === 404 && !failIfNotFound) {
        return NOT_FOUND_RESULT;
      }
      throw e;
    }

    const rawAddOns = sub?.SubscriptionAddOns;
    const addOns: any[] = Array.isArray(rawAddOns)
      ? rawAddOns
      : (rawAddOns?.items ?? rawAddOns?.Items ?? []);
    const addOnNames = addOns
      .map((a: any) => a.AddOn?.Name)
      .filter(Boolean)
      .join(', ');

    return {
      found: true,
      uid: sub.Uid ?? null,
      account_uid: sub.Account?.Uid ?? null,
      account_name: sub.Account?.Name ?? null,
      subscription_status: sub.SubscriptionStatus ?? null,
      plan_uid: sub.Plan?.Uid ?? null,
      plan_name: sub.Plan?.Name ?? null,
      plan_family_name: sub.Plan?.PlanFamily?.Name ?? null,
      billing_renewal_term: sub.BillingRenewalTerm ?? null,
      // Seat/unit count billed on the subscription. Distinct from the per-add-on
      // quantity nested in add_ons below.
      quantity: sub.Quantity ?? null,
      rate: sub.Rate ?? null,
      discount_code: sub.DiscountCode ?? null,
      start_date: sub.StartDate ?? null,
      end_date: sub.EndDate ?? null,
      // When an expiring subscription lapses. Outseta keeps this separate from
      // both end_date and renewal_date, and they can differ.
      expiration_date: sub.ExpirationDate ?? null,
      renewal_date: sub.RenewalDate ?? null,
      // Convenience field, unchanged for backwards compatibility: renewal_date
      // when the subscription renews, end_date otherwise. It does NOT consider
      // expiration_date — read expiration_date directly for that.
      validity_date: sub.RenewalDate ?? sub.EndDate ?? null,
      created: sub.Created ?? null,
      updated: sub.Updated ?? null,
      add_ons: addOns.map((a: any) => ({
        uid: a.AddOn?.Uid ?? a.Uid ?? null,
        name: a.AddOn?.Name ?? null,
        quantity: a.Quantity ?? null,
      })),
      // Same names joined, so they can be written straight to a text field.
      add_ons_names: addOnNames || null,
    };
  },
});
