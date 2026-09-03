import { isNil } from '@activepieces/pieces-framework';
import { outsetaEnums } from './enums';
import {
  OutsetaAccount,
  OutsetaAddOn,
  OutsetaAddress,
  OutsetaCase,
  OutsetaCollection,
  OutsetaDeal,
  OutsetaDiscountCoupon,
  OutsetaPerson,
  OutsetaPersonAccount,
  OutsetaPlan,
  OutsetaSubscription,
  OutsetaSubscriptionAddOn,
  OutsetaTransaction,
} from './outseta-types';

const ACCOUNT_NATIVE_KEYS = new Set([
  '_objectType', 'ActivityEventData', 'Uid', 'Created', 'Updated',
  'SchemaLessData', 'SchemaLessDataLoaded', 'LastEventCreated', 'ProcessedStripeEventIds',
  'Name', 'ClientIdentifier', 'Currency', 'InvoiceNotes', 'IsDemo',
  'BillingAddress', 'MailingAddress', 'AccountStage', 'AccountStageLabel',
  'PaymentInformation', 'PersonAccount', 'Subscriptions', 'Deals',
  'CurrentSubscription', 'LatestSubscription', 'PrimarySubscription',
  'PrimaryContact', 'DomainName', 'HasLoggedIn', 'LifetimeRevenue',
  'LastLoginDateTime', 'Nonce', 'RecaptchaToken', 'WebflowSlug',
  'RewardFulReferralId', 'ToltReferralId', 'TaxIds', 'TaxStatus',
  'TaxId', 'TaxIdIsInvalid', 'TaxIdType',
  'StripeId', 'IsLivemode', 'StripeDefaultPaymentMethodId', 'StripeInvoices',
  'StripePaymentMethods', 'StripeSubscriptions', 'PrimaryStripeSubscription',
  'CurrentStripeProducts', 'NextStripeInvoiceDate', 'StripeNextInvoiceSequence',
  'StripePrice', 'StripePriceIds', 'StripePromotionCode',
  'AccountSpecificPageUrl1', 'AccountSpecificPageUrl2', 'AccountSpecificPageUrl3',
  'AccountSpecificPageUrl4', 'AccountSpecificPageUrl5', 'AccountSpecificPageUrl6',
  'AccountSpecificPageUrl7', 'AccountSpecificPageUrl8', 'AccountSpecificPageUrl9',
  'AccountSpecificPageUrl10',
]);

const PERSON_NATIVE_KEYS = new Set([
  '_objectType', 'ActivityEventData', 'Uid', 'Created', 'Updated',
  'SchemaLessData', 'SchemaLessDataLoaded',
  'Email', 'FirstName', 'LastName', 'FullName', 'Title',
  'PhoneMobile', 'PhoneWork', 'MailingAddress', 'ProfileImageS3Url',
  'Timezone', 'Language', 'IPAddress', 'Referer', 'UserAgent',
  'UserAgentPlatformBrowser', 'LastLoginDateTime', 'HasLoggedIn',
  'Password', 'PasswordLastUpdated', 'PasswordMustChange',
  'PersonAccount', 'Account', 'AccountUids', 'DealPeople',
  'LeadFormSubmissions', 'EmailListPerson', 'OptInToEmailList', 'HasUnsubscribed',
  'OAuthGoogleProfileId', 'OAuthIntegrationStatus',
  'DiscordUser', 'IsConnectedToDiscord', 'RecaptchaToken',
]);

const DEAL_NATIVE_KEYS = new Set([
  '_objectType', 'ActivityEventData', 'Uid', 'Created', 'Updated',
  'SchemaLessData', 'SchemaLessDataLoaded',
  'Name', 'Amount', 'DueDate', 'Weight', 'AssignedToPersonClientIdentifier',
  'DealPipelineStage', 'PipelineUid', 'DealPeople', 'Contacts',
  'Account', 'AccountId', 'Owner',
]);

function toArray<T>(collection: OutsetaCollection<T>): T[] {
  if (Array.isArray(collection)) {
    return collection;
  }
  return collection?.items ?? collection?.Items ?? [];
}

function customPropertiesOf(
  entity: Record<string, unknown>,
  nativeKeys: Set<string>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entity).filter(([key]) => !nativeKeys.has(key))
  );
}

function address(prefix: string, value: OutsetaAddress | null | undefined) {
  return {
    [`${prefix}_line1`]: value?.AddressLine1 ?? null,
    [`${prefix}_line2`]: value?.AddressLine2 ?? null,
    [`${prefix}_city`]: value?.City ?? null,
    [`${prefix}_state`]: value?.State ?? null,
    [`${prefix}_postal_code`]: value?.PostalCode ?? null,
    [`${prefix}_country`]: value?.Country ?? null,
  };
}

function firstMembership(
  person: OutsetaPerson | null | undefined
): OutsetaPersonAccount | undefined {
  return toArray(person?.PersonAccount)[0];
}

function subscriptionAddOns(subscription: OutsetaSubscription | null | undefined) {
  return toArray(subscription?.SubscriptionAddOns).map(
    (item: OutsetaSubscriptionAddOn) => ({
      uid: item.AddOn?.Uid ?? item.Uid ?? null,
      name: item.AddOn?.Name ?? null,
      quantity: item.Quantity ?? null,
      rate: item.Rate ?? null,
    })
  );
}

function account(raw: OutsetaAccount) {
  return {
    uid: raw.Uid ?? null,
    name: raw.Name ?? null,
    account_stage: raw.AccountStage ?? null,
    account_stage_label:
      raw.AccountStageLabel ?? outsetaEnums.accountStage.label(raw.AccountStage),
    client_identifier: raw.ClientIdentifier ?? null,
    currency: raw.Currency ?? null,
    invoice_notes: raw.InvoiceNotes ?? null,
    domain_name: raw.DomainName ?? null,
    is_demo: raw.IsDemo ?? null,
    has_logged_in: raw.HasLoggedIn ?? null,
    lifetime_revenue: raw.LifetimeRevenue ?? null,
    last_login: raw.LastLoginDateTime ?? null,
    created: raw.Created ?? null,
    updated: raw.Updated ?? null,
    ...address('billing_address', raw.BillingAddress),
    ...address('mailing_address', raw.MailingAddress),
    primary_contact_uid: raw.PrimaryContact?.Uid ?? null,
    primary_contact_email: raw.PrimaryContact?.Email ?? null,
    primary_contact_first_name: raw.PrimaryContact?.FirstName ?? null,
    primary_contact_last_name: raw.PrimaryContact?.LastName ?? null,
    current_subscription_uid: raw.CurrentSubscription?.Uid ?? null,
    plan_uid: raw.CurrentSubscription?.Plan?.Uid ?? null,
    plan_name: raw.CurrentSubscription?.Plan?.Name ?? null,
    custom_properties: customPropertiesOf(raw, ACCOUNT_NATIVE_KEYS),
  };
}

function person(raw: OutsetaPerson) {
  const membership = firstMembership(raw);
  return {
    uid: raw.Uid ?? null,
    email: raw.Email ?? null,
    first_name: raw.FirstName ?? null,
    last_name: raw.LastName ?? null,
    full_name: raw.FullName ?? null,
    phone_mobile: raw.PhoneMobile ?? null,
    phone_work: raw.PhoneWork ?? null,
    title: raw.Title ?? null,
    timezone: raw.Timezone ?? null,
    language: raw.Language ?? null,
    has_logged_in: raw.HasLoggedIn ?? null,
    has_unsubscribed: raw.HasUnsubscribed ?? null,
    last_login: raw.LastLoginDateTime ?? null,
    created: raw.Created ?? null,
    updated: raw.Updated ?? null,
    ...address('mailing_address', raw.MailingAddress),
    account_uid: membership?.Account?.Uid ?? raw.Account?.Uid ?? null,
    account_name: membership?.Account?.Name ?? raw.Account?.Name ?? null,
    account_stage:
      membership?.Account?.AccountStage ?? raw.Account?.AccountStage ?? null,
    account_role: outsetaEnums.accountRole.label(membership?.Role),
    is_primary_contact: membership?.IsPrimary ?? null,
    custom_properties: customPropertiesOf(raw, PERSON_NATIVE_KEYS),
  };
}

function deal(raw: OutsetaDeal) {
  return {
    uid: raw.Uid ?? null,
    name: raw.Name ?? null,
    amount: raw.Amount ?? null,
    due_date: raw.DueDate ?? null,
    pipeline_uid: raw.DealPipelineStage?.DealPipeline?.Uid ?? null,
    pipeline_name: raw.DealPipelineStage?.DealPipeline?.Name ?? null,
    pipeline_stage_uid: raw.DealPipelineStage?.Uid ?? null,
    pipeline_stage_name: raw.DealPipelineStage?.Name ?? null,
    account_uid: raw.Account?.Uid ?? null,
    account_name: raw.Account?.Name ?? null,
    assigned_to_client_identifier: raw.AssignedToPersonClientIdentifier ?? null,
    contacts: toArray(raw.DealPeople)
      .map((item) => item.Person?.Email)
      .filter((email): email is string => !isNil(email)),
    created: raw.Created ?? null,
    updated: raw.Updated ?? null,
    custom_properties: customPropertiesOf(raw, DEAL_NATIVE_KEYS),
  };
}

function subscription(raw: OutsetaSubscription) {
  const addOns = subscriptionAddOns(raw);
  return {
    uid: raw.Uid ?? null,
    account_uid: raw.Account?.Uid ?? null,
    account_name: raw.Account?.Name ?? null,
    plan_uid: raw.Plan?.Uid ?? null,
    plan_name: raw.Plan?.Name ?? null,
    plan_family_name: raw.Plan?.PlanFamily?.Name ?? null,
    billing_renewal_term: raw.BillingRenewalTerm ?? null,
    billing_renewal_term_label: outsetaEnums.billingRenewalTerm.label(
      raw.BillingRenewalTerm
    ),
    quantity: raw.Quantity ?? null,
    rate: raw.Rate ?? null,
    discount_code: raw.DiscountCode ?? null,
    discount_expiration_date: raw.DiscountCouponExpirationDate ?? null,
    start_date: raw.StartDate ?? null,
    end_date: raw.EndDate ?? null,
    expiration_date: raw.ExpirationDate ?? null,
    renewal_date: raw.RenewalDate ?? null,
    is_plan_upgrade_required: raw.IsPlanUpgradeRequired ?? null,
    new_required_quantity: raw.NewRequiredQuantity ?? null,
    latest_invoice_uid: raw.LatestInvoice?.Uid ?? null,
    latest_invoice_number: raw.LatestInvoice?.Number ?? null,
    created: raw.Created ?? null,
    updated: raw.Updated ?? null,
    add_ons: addOns,
    add_ons_names: addOns
      .map((item) => item.name)
      .filter((name): name is string => !isNil(name))
      .join(', '),
  };
}

function plan(raw: OutsetaPlan) {
  return {
    uid: raw.Uid ?? null,
    name: raw.Name ?? null,
    description: raw.Description ?? null,
    plan_family_uid: raw.PlanFamily?.Uid ?? null,
    plan_family_name: raw.PlanFamily?.Name ?? null,
    monthly_rate: raw.MonthlyRate ?? null,
    annual_rate: raw.AnnualRate ?? null,
    quarterly_rate: raw.QuarterlyRate ?? null,
    one_time_rate: raw.OneTimeRate ?? null,
    setup_fee: raw.SetupFee ?? null,
    unit_of_measure: raw.UnitOfMeasure ?? null,
    is_active: raw.IsActive ?? null,
    is_taxable: raw.IsTaxable ?? null,
    is_per_user: raw.IsPerUser ?? null,
    is_quantity_editable: raw.IsQuantityEditable ?? null,
    minimum_quantity: raw.MinimumQuantity ?? null,
    maximum_people: raw.MaximumPeople ?? null,
    trial_period_days: raw.TrialPeriodDays ?? null,
    expires_after_months: raw.ExpiresAfterMonths ?? null,
    expiration_date: raw.ExpirationDate ?? null,
    created: raw.Created ?? null,
    updated: raw.Updated ?? null,
  };
}

function addOn(raw: OutsetaAddOn) {
  return {
    uid: raw.Uid ?? null,
    name: raw.Name ?? null,
    billing_add_on_type: raw.BillingAddOnType ?? null,
    billing_add_on_type_label: outsetaEnums.billingAddOnType.label(
      raw.BillingAddOnType
    ),
    monthly_rate: raw.MonthlyRate ?? null,
    annual_rate: raw.AnnualRate ?? null,
    quarterly_rate: raw.QuarterlyRate ?? null,
    one_time_rate: raw.OneTimeRate ?? null,
    setup_fee: raw.SetupFee ?? null,
    unit_of_measure: raw.UnitOfMeasure ?? null,
    is_quantity_editable: raw.IsQuantityEditable ?? null,
    minimum_quantity: raw.MinimumQuantity ?? null,
    is_taxable: raw.IsTaxable ?? null,
    is_billed_during_trial: raw.IsBilledDuringTrial ?? null,
    expires_after_months: raw.ExpiresAfterMonths ?? null,
    expiration_date: raw.ExpirationDate ?? null,
    created: raw.Created ?? null,
    updated: raw.Updated ?? null,
  };
}

function discount(raw: OutsetaDiscountCoupon) {
  return {
    uid: raw.Uid ?? null,
    name: raw.Name ?? null,
    coupon_code: raw.UniqueIdentifier ?? null,
    is_active: raw.IsActive ?? null,
    amount_off: raw.AmountOff ?? null,
    percent_off: raw.PercentOff ?? null,
    redeem_by: raw.RedeemBy ?? null,
    duration: raw.Duration ?? null,
    duration_label: outsetaEnums.discountDuration.label(raw.Duration),
    duration_in_months: raw.DurationInMonths ?? null,
    times_redeemed: raw.TimesRedeemed ?? null,
    max_redemptions: raw.MaxRedemptions ?? null,
    apply_to_add_ons: raw.ApplyToAddOns ?? null,
    created: raw.Created ?? null,
    updated: raw.Updated ?? null,
  };
}

function supportCase(raw: OutsetaCase) {
  return {
    uid: raw.Uid ?? null,
    subject: raw.Subject ?? null,
    body: raw.Body ?? null,
    status: raw.Status ?? null,
    source: raw.Source ?? null,
    source_label: outsetaEnums.supportCaseSource.label(raw.Source),
    submitted_date: raw.SubmittedDateTime ?? null,
    last_activity: raw.LastActivity ?? null,
    assigned_to_client_identifier: raw.AssignedToPersonClientIdentifier ?? null,
    from_person_uid: raw.FromPerson?.Uid ?? null,
    from_person_email: raw.FromPerson?.Email ?? null,
    from_person_full_name: raw.FromPerson?.FullName ?? null,
    created: raw.Created ?? null,
    updated: raw.Updated ?? null,
  };
}

function transaction(raw: OutsetaTransaction) {
  return {
    uid: raw.Uid ?? null,
    amount: raw.Amount ?? null,
    date: raw.TransactionDate ?? raw.Created ?? null,
    transaction_type: raw.BillingTransactionType ?? null,
    transaction_type_label: outsetaEnums.billingTransactionType.label(
      raw.BillingTransactionType
    ),
    is_captured: raw.IsCaptured ?? null,
    is_electronic: raw.IsElectronicTransaction ?? null,
    account_uid: raw.Account?.Uid ?? null,
    invoice_uid: raw.Invoice?.Uid ?? null,
    invoice_number: raw.Invoice?.Number ?? null,
    invoice_status_label: outsetaEnums.billingInvoiceStatus.label(
      raw.Invoice?.BillingInvoiceStatus
    ),
    created: raw.Created ?? null,
    updated: raw.Updated ?? null,
  };
}

export const outsetaMappers = {
  account,
  person,
  deal,
  subscription,
  plan,
  addOn,
  discount,
  supportCase,
  transaction,
  toArray,
};
