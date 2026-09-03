import { isNil } from '@activepieces/pieces-framework';

const ACCOUNT_STAGE: EnumLabels = {
  2: 'Trialing',
  3: 'Subscribing',
  4: 'Cancelling',
  5: 'Expired',
  6: 'Trial Expired',
  7: 'Past Due',
  8: 'Cancelling Trial',
  9: 'Paused',
  10: 'Created',
};

const BILLING_RENEWAL_TERM: EnumLabels = {
  1: 'Monthly',
  2: 'Annual',
  3: 'Quarterly',
  4: 'One-time',
};

const BILLING_ADD_ON_TYPE: EnumLabels = {
  1: 'Recurring',
  2: 'Usage',
  3: 'One-time',
};

const DISCOUNT_DURATION: EnumLabels = {
  1: 'Forever',
  2: 'Once',
  3: 'Repeating',
};

const SUPPORT_CASE_STATUS: EnumLabels = {
  1: 'Open',
  2: 'Closed',
  3: 'Spam',
};

const SUPPORT_CASE_SOURCE: EnumLabels = {
  1: 'Website',
  2: 'Email',
  3: 'Facebook',
  4: 'Twitter',
  5: 'Chat',
};

const BILLING_TRANSACTION_TYPE: EnumLabels = {
  1: 'Invoice',
  2: 'Payment',
  3: 'Credit',
  4: 'Refund',
  5: 'Chargeback',
  6: 'Tax Refund',
};

const BILLING_INVOICE_STATUS: EnumLabels = {
  1: 'Unpaid',
  2: 'Paid',
  3: 'Partial',
  4: 'Uncollected',
  5: 'Refunded',
  6: 'Uncollectible',
  7: 'Processing',
};

const ACCOUNT_ROLE: EnumLabels = {
  1: 'Admin',
  2: 'Member',
  3: 'Operator',
};

function describe(labels: EnumLabels): OutsetaEnum {
  return {
    options: Object.entries(labels).map(([value, label]) => ({
      label,
      value: Number(value),
    })),
    label: (value) => (isNil(value) ? null : (labels[value] ?? null)),
  };
}

export const outsetaEnums = {
  accountStage: describe(ACCOUNT_STAGE),
  billingRenewalTerm: describe(BILLING_RENEWAL_TERM),
  billingAddOnType: describe(BILLING_ADD_ON_TYPE),
  discountDuration: describe(DISCOUNT_DURATION),
  supportCaseStatus: describe(SUPPORT_CASE_STATUS),
  supportCaseSource: describe(SUPPORT_CASE_SOURCE),
  billingTransactionType: describe(BILLING_TRANSACTION_TYPE),
  billingInvoiceStatus: describe(BILLING_INVOICE_STATUS),
  accountRole: describe(ACCOUNT_ROLE),
};

type EnumLabels = Record<number, string>;

type OutsetaEnum = {
  options: { label: string; value: number }[];
  label: (value: number | null | undefined) => string | null;
};
