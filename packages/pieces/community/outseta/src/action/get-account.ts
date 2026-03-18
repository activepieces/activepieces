import { createAction } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { accountUidDropdown } from '../common/dropdowns';

export const getAccountAction = createAction({
  name: 'get_account',
  auth: outsetaAuth,
  displayName: 'Get Account',
  description: 'Retrieve an Outseta account by selecting it from the dropdown.',
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
      `/api/v1/crm/accounts/${context.propsValue.accountUid}`
    );

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
      current_subscription_uid: account.CurrentSubscription?.Uid ?? null,
      current_subscription_plan_name: account.CurrentSubscription?.Plan?.Name ?? null,
      current_subscription_plan_uid: account.CurrentSubscription?.Plan?.Uid ?? null,
      current_subscription_billing_renewal_term: account.CurrentSubscription?.BillingRenewalTerm ?? null,
      current_subscription_renewal_date: account.CurrentSubscription?.RenewalDate ?? null,
    };
  },
});
