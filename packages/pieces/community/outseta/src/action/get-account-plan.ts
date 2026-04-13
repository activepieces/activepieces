import { createAction } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { accountUidDropdown } from '../common/dropdowns';

export const getAccountPlanAction = createAction({
  name: 'get_account_plan',
  auth: outsetaAuth,
  displayName: 'Get Account Plan',
  description: 'Retrieve the current plan and subscription details for an account.',
  props: {
    accountUid: accountUidDropdown(),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=Uid,Name,CurrentSubscription.*,CurrentSubscription.Plan.*,CurrentSubscription.Plan.PlanFamily.*,CurrentSubscription.SubscriptionAddOns.*,CurrentSubscription.SubscriptionAddOns.AddOn.*`
    );

    const sub = account.CurrentSubscription;
    const addOns: any[] = Array.isArray(sub?.SubscriptionAddOns)
      ? sub.SubscriptionAddOns
      : (sub?.SubscriptionAddOns?.items ?? sub?.SubscriptionAddOns?.Items ?? []);

    return {
      account_uid: account.Uid ?? null,
      account_name: account.Name ?? null,
      subscription_uid: sub?.Uid ?? null,
      subscription_status: sub?.SubscriptionStatus ?? null,
      plan_uid: sub?.Plan?.Uid ?? null,
      plan_name: sub?.Plan?.Name ?? null,
      plan_family_name: sub?.Plan?.PlanFamily?.Name ?? null,
      billing_renewal_term: sub?.BillingRenewalTerm ?? null,
      renewal_date: sub?.RenewalDate ?? null,
      start_date: sub?.StartDate ?? null,
      end_date: sub?.EndDate ?? null,
      add_ons: addOns.map((a: any) => a.AddOn?.Name ?? a.Uid).join(', ') || null,
    };
  },
});
