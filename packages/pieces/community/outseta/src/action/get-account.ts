import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getAccountAction = createAction({
  name: 'get_account',
  auth: outsetaAuth,
  displayName: 'Retrieve Account',
  description: 'Retrieve an account by its UID, including plan, subscription, and add-on details.',
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'The UID of the account to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const account = await client.get<any>(
      `/api/v1/crm/accounts/${context.propsValue.accountUid}?fields=CurrentSubscription.*,CurrentSubscription.Plan.*,CurrentSubscription.Plan.PlanFamily.*,CurrentSubscription.SubscriptionAddOns.*,CurrentSubscription.SubscriptionAddOns.AddOn.*`
    );

    const sub = account.CurrentSubscription;
    const rawAddOns = sub?.SubscriptionAddOns;
    const addOns: any[] = Array.isArray(rawAddOns)
      ? rawAddOns
      : (rawAddOns?.items ?? rawAddOns?.Items ?? []);

    return {
      uid: account.Uid ?? null,
      name: account.Name ?? null,
      account_stage: account.AccountStage ?? null,
      account_stage_label: account.AccountStageLabel ?? null,
      client_identifier: account.ClientIdentifier ?? null,
      invoice_notes: account.InvoiceNotes ?? null,
      has_logged_in: account.HasLoggedIn ?? null,
      is_demo: account.IsDemo ?? null,
      lifetime_revenue: account.LifetimeRevenue ?? null,
      created: account.Created ?? null,
      updated: account.Updated ?? null,
      billing_address_line1: account.BillingAddress?.AddressLine1 ?? null,
      billing_address_line2: account.BillingAddress?.AddressLine2 ?? null,
      billing_address_city: account.BillingAddress?.City ?? null,
      billing_address_state: account.BillingAddress?.State ?? null,
      billing_address_postal_code: account.BillingAddress?.PostalCode ?? null,
      billing_address_country: account.BillingAddress?.Country ?? null,
      primary_contact_uid: account.PrimaryContact?.Uid ?? null,
      primary_contact_email: account.PrimaryContact?.Email ?? null,
      primary_contact_first_name: account.PrimaryContact?.FirstName ?? null,
      primary_contact_last_name: account.PrimaryContact?.LastName ?? null,
      current_subscription_uid: sub?.Uid ?? null,
      subscription_status: sub?.SubscriptionStatus ?? null,
      plan_uid: sub?.Plan?.Uid ?? null,
      plan_name: sub?.Plan?.Name ?? null,
      plan_family_name: sub?.Plan?.PlanFamily?.Name ?? null,
      billing_renewal_term: sub?.BillingRenewalTerm ?? null,
      renewal_date: sub?.RenewalDate ?? null,
      start_date: sub?.StartDate ?? null,
      end_date: sub?.EndDate ?? null,
      // Unified validity date: renewal_date for recurring plans,
      // end_date for one-time plans (which have no renewal).
      validity_date: sub?.RenewalDate ?? sub?.EndDate ?? null,
      add_ons: addOns.map((a: any) => ({
        uid: a.AddOn?.Uid ?? a.Uid ?? null,
        name: a.AddOn?.Name ?? null,
        quantity: a.Quantity ?? null,
      })),
    };
  },
});
