import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getAccountAction = createAction({
  name: 'get_account',
  auth: outsetaAuth,
  displayName: 'Retrieve Account',
  description:
    'Retrieve an account by its UID, or by the email of its primary contact. Returns plan, subscription, billing address, primary contact and add-on details. Can return found=false instead of failing when the account does not exist.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Outseta CRM account by its UID or by its primary contact email, returning core fields plus billing address, primary contact, and current subscription/plan/add-on details. Use to read an account by either identifier. Disable "Fail if not found" to get found=false for a missing or deleted account instead of a failed step. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    lookupBy: Property.StaticDropdown({
      displayName: 'Lookup by',
      description: 'How to find the account to retrieve.',
      required: true,
      defaultValue: 'uid',
      options: {
        disabled: false,
        options: [
          { label: 'Account UID', value: 'uid' },
          { label: 'Primary contact email', value: 'email' },
        ],
      },
    }),
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: 'Used when "Lookup by" is set to Account UID.',
      required: false,
    }),
    primaryContactEmail: Property.ShortText({
      displayName: 'Primary contact email',
      description:
        'Used when "Lookup by" is set to Primary contact email. The action will resolve the email to the linked account.',
      required: false,
    }),
    failIfNotFound: Property.Checkbox({
      displayName: 'Fail if not found',
      description:
        'Enabled by default: the step fails when the account does not exist. Disable it to return found=false instead, so the flow can branch on a deleted or unknown account without failing.',
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

    let accountUid = context.propsValue.accountUid;

    if (context.propsValue.lookupBy === 'email') {
      const email = context.propsValue.primaryContactEmail;
      if (!email) {
        throw new Error('Primary contact email is required when looking up by email.');
      }
      const people = await client.getAllPages<any>(
        `/api/v1/crm/people?Email=${encodeURIComponent(email)}&fields=*,PersonAccount.Account.Uid`
      );
      const person = people.find(
        (p: any) => p.Email?.toLowerCase() === email.toLowerCase()
      );
      if (!person) {
        if (failIfNotFound) {
          throw new Error(`No person found with email "${email}".`);
        }
        return NOT_FOUND_RESULT;
      }
      const memberships: any[] = Array.isArray(person.PersonAccount)
        ? person.PersonAccount
        : (person.PersonAccount?.items ?? person.PersonAccount?.Items ?? []);
      accountUid = memberships[0]?.Account?.Uid ?? null;
      if (!accountUid) {
        if (failIfNotFound) {
          throw new Error(`Person "${email}" is not linked to any account.`);
        }
        return NOT_FOUND_RESULT;
      }
    }

    // A missing UID is a misconfigured step, not a missing record, so this
    // always throws regardless of "Fail if not found".
    if (!accountUid) {
      throw new Error('Account UID is required.');
    }

    // The leading `*` is required: when ?fields= is provided, Outseta returns
    // ONLY the listed fields. Without `*`, top-level scalar fields like Name,
    // AccountStage, BillingAddress, etc. would all come back null.
    const path = `/api/v1/crm/accounts/${accountUid}?fields=*,BillingAddress.*,MailingAddress.*,PrimaryContact.*,CurrentSubscription.*,CurrentSubscription.Plan.*,CurrentSubscription.Plan.PlanFamily.*,CurrentSubscription.SubscriptionAddOns.*,CurrentSubscription.SubscriptionAddOns.AddOn.*`;

    let account: any;
    try {
      account = await client.get<any>(path);
    } catch (e: any) {
      // Outseta answers 404 for a UID it no longer knows, e.g. an account that
      // has been deleted. That is a missing record, not a transport failure.
      if (e?.response?.status === 404 && !failIfNotFound) {
        return NOT_FOUND_RESULT;
      }
      throw e;
    }

    const sub = account.CurrentSubscription;
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
      // Seat/unit count billed on the subscription. Distinct from the per-add-on
      // quantity nested in add_ons below.
      quantity: sub?.Quantity ?? null,
      renewal_date: sub?.RenewalDate ?? null,
      start_date: sub?.StartDate ?? null,
      end_date: sub?.EndDate ?? null,
      // When an expiring subscription lapses. Outseta keeps this separate from
      // both end_date and renewal_date, and they can differ.
      expiration_date: sub?.ExpirationDate ?? null,
      // Convenience field, unchanged for backwards compatibility: renewal_date
      // when the subscription renews, end_date otherwise. It does NOT consider
      // expiration_date — read expiration_date directly for that.
      validity_date: sub?.RenewalDate ?? sub?.EndDate ?? null,
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

// Every key of the success payload, emptied out. Returned instead of throwing
// when "Fail if not found" is unchecked, so a flow can branch on `found`
// rather than on a failed step.
const NOT_FOUND_RESULT = {
  found: false,
  uid: null,
  name: null,
  account_stage: null,
  account_stage_label: null,
  client_identifier: null,
  invoice_notes: null,
  has_logged_in: null,
  is_demo: null,
  lifetime_revenue: null,
  created: null,
  updated: null,
  billing_address_line1: null,
  billing_address_line2: null,
  billing_address_city: null,
  billing_address_state: null,
  billing_address_postal_code: null,
  billing_address_country: null,
  primary_contact_uid: null,
  primary_contact_email: null,
  primary_contact_first_name: null,
  primary_contact_last_name: null,
  current_subscription_uid: null,
  subscription_status: null,
  plan_uid: null,
  plan_name: null,
  plan_family_name: null,
  billing_renewal_term: null,
  quantity: null,
  renewal_date: null,
  start_date: null,
  end_date: null,
  expiration_date: null,
  validity_date: null,
  add_ons: [],
  add_ons_names: null,
};
