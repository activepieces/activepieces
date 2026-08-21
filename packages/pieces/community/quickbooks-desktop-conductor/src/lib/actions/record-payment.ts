import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { spreadIfDefined } from '@activepieces/pieces-framework';
import { quickbooksDesktopConductorAuth } from '../auth';
import { conductorClient, withRecordLockRetry, ConductorAuth } from '../common/client';
import { customerIdDropdown, vendorIdDropdown } from '../common/dropdowns';
import { ConductorPaymentResult, isPaymentType, flattenPayment } from '../common/payments';
import { recordPaymentActionOutputSchema } from '../output-schemas';

const CUSTOMER_PAYMENT_MAX_REF_LENGTH = 20;
const BILL_PAYMENT_MAX_REF_LENGTH = 11;

function toDateOnly(isoDateTime: string): string {
  return isoDateTime.split('T')[0];
}

export const recordPaymentAction = createAction({
  auth: quickbooksDesktopConductorAuth,
  name: 'record_payment',
  classification: 'WRITE',
  displayName: 'Record Payment',
  description: 'Records a customer payment against open invoices, or a vendor bill payment by check or credit card, in QuickBooks Desktop.',
  audience: 'both',
  aiMetadata: {
    description:
      'Record a payment in QuickBooks Desktop — either a customer payment against open invoices (Accounts Receivable) or a vendor bill payment by check or credit card (Accounts Payable), chosen via Payment Type. Not idempotent — each call records a new payment, so retries duplicate it.',
    idempotent: false,
  },
  outputSchema: recordPaymentActionOutputSchema,
  props: {
    paymentType: Property.StaticDropdown({
      displayName: 'Payment Type',
      required: true,
      options: {
        options: [
          { label: 'Customer Payment (Accounts Receivable)', value: 'customer_payment' },
          { label: 'Vendor Bill Payment — Check (Accounts Payable)', value: 'bill_payment_check' },
          { label: 'Vendor Bill Payment — Credit Card (Accounts Payable)', value: 'bill_payment_credit_card' },
        ],
      },
    }),
    transactionDate: Property.DateTime({
      displayName: 'Payment Date',
      required: true,
    }),
    amount: Property.ShortText({
      displayName: 'Amount',
      description: 'Total payment amount, e.g. "500.00".',
      required: true,
    }),
    refNumber: Property.ShortText({
      displayName: 'Reference / Check Number',
      description: `Optional. Max ${CUSTOMER_PAYMENT_MAX_REF_LENGTH} characters for a customer payment, max ${BILL_PAYMENT_MAX_REF_LENGTH} for a bill payment (it's the check number for a check payment).`,
      required: false,
    }),
    memo: Property.LongText({
      displayName: 'Memo',
      required: false,
    }),
    customerId: customerIdDropdown({
      required: false,
      description: 'Required for Customer Payment only. The customer who made this payment.',
    }),
    applyToSpecificInvoice: Property.Checkbox({
      displayName: 'Apply to a specific invoice',
      description: 'Customer Payment only. When off, QuickBooks Desktop automatically applies the payment to an exact-amount match or the oldest open invoice.',
      required: false,
      defaultValue: false,
      reveals: ['invoiceId'],
    }),
    invoiceId: Property.Dropdown({
      displayName: 'Invoice',
      description: 'The specific open invoice this payment applies to.',
      auth: quickbooksDesktopConductorAuth,
      required: false,
      refreshers: ['customerId'],
      options: async ({ auth, customerId }) => {
        if (!auth || typeof customerId !== 'string' || customerId.length === 0) {
          return { disabled: true, placeholder: 'Select a customer first', options: [] };
        }
        const conductorAuth: ConductorAuth = { secretKey: auth.props.secretKey, endUserId: auth.props.endUserId };
        const response = await conductorClient.request<{
          data: { id: string; refNumber: string | null; transactionDate: string; balanceRemaining: string }[];
        }>({
          auth: conductorAuth,
          method: HttpMethod.GET,
          resourceUri: '/quickbooks-desktop/invoices',
          queryParams: { customerIds: customerId, paymentStatus: 'not_paid' },
        });
        return {
          disabled: false,
          options: response.data.map((inv) => ({
            label: `${inv.refNumber ?? inv.id} — $${inv.balanceRemaining} due (${inv.transactionDate})`,
            value: inv.id,
          })),
        };
      },
    }),
    vendorId: vendorIdDropdown({
      required: false,
      description: 'Required for both Bill Payment types. The vendor being paid.',
    }),
    billId: Property.Dropdown({
      displayName: 'Bill',
      description: 'Required for both Bill Payment types. QuickBooks Desktop has no auto-apply for bill payments, so the specific open bill must be picked.',
      auth: quickbooksDesktopConductorAuth,
      required: false,
      refreshers: ['vendorId'],
      options: async ({ auth, vendorId }) => {
        if (!auth || typeof vendorId !== 'string' || vendorId.length === 0) {
          return { disabled: true, placeholder: 'Select a vendor first', options: [] };
        }
        const conductorAuth: ConductorAuth = { secretKey: auth.props.secretKey, endUserId: auth.props.endUserId };
        const response = await conductorClient.request<{
          data: { id: string; refNumber: string | null; transactionDate: string; amountDue: string }[];
        }>({
          auth: conductorAuth,
          method: HttpMethod.GET,
          resourceUri: '/quickbooks-desktop/bills',
          queryParams: { vendorIds: vendorId, paymentStatus: 'not_paid' },
        });
        return {
          disabled: false,
          options: response.data.map((bill) => ({
            label: `${bill.refNumber ?? bill.id} — $${bill.amountDue} due (${bill.transactionDate})`,
            value: bill.id,
          })),
        };
      },
    }),
    bankAccountId: Property.Dropdown({
      displayName: 'Bank Account',
      description: 'Required for Bill Payment — Check only. The account funds are drawn from.',
      auth: quickbooksDesktopConductorAuth,
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const conductorAuth: ConductorAuth = { secretKey: auth.props.secretKey, endUserId: auth.props.endUserId };
        const response = await conductorClient.request<{ data: { id: string; fullName: string }[] }>({
          auth: conductorAuth,
          method: HttpMethod.GET,
          resourceUri: '/quickbooks-desktop/accounts',
          queryParams: { accountType: 'bank' },
        });
        return { disabled: false, options: response.data.map((a) => ({ label: a.fullName, value: a.id })) };
      },
    }),
    creditCardAccountId: Property.Dropdown({
      displayName: 'Credit Card Account',
      description: 'Required for Bill Payment — Credit Card only. The account charged.',
      auth: quickbooksDesktopConductorAuth,
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const conductorAuth: ConductorAuth = { secretKey: auth.props.secretKey, endUserId: auth.props.endUserId };
        const response = await conductorClient.request<{ data: { id: string; fullName: string }[] }>({
          auth: conductorAuth,
          method: HttpMethod.GET,
          resourceUri: '/quickbooks-desktop/accounts',
          queryParams: { accountType: 'credit_card' },
        });
        return { disabled: false, options: response.data.map((a) => ({ label: a.fullName, value: a.id })) };
      },
    }),
  },
  propertyGroups: [
    // Declared first on purpose: ungrouped props render after every declared section, so
    // paymentType — the field that decides which sections below actually matter — would
    // otherwise land dead last in the form.
    { key: 'type', display: 'section', label: 'Payment Type', props: ['paymentType'] },
    { key: 'details', display: 'section', label: 'Payment Details', props: ['transactionDate', 'amount', 'refNumber', 'memo'] },
    { key: 'ar', display: 'section', label: 'Customer Payment (Accounts Receivable)', props: ['customerId', 'applyToSpecificInvoice', 'invoiceId'] },
    { key: 'ap', display: 'section', label: 'Vendor Bill Payment (Accounts Payable)', props: ['vendorId', 'billId', 'bankAccountId', 'creditCardAccountId'] },
  ],
  async run(context) {
    const { propsValue } = context;
    if (!isPaymentType(propsValue.paymentType)) {
      throw new Error(`Unexpected Payment Type: "${propsValue.paymentType}".`);
    }
    const paymentType = propsValue.paymentType;
    const auth: ConductorAuth = {
      secretKey: context.auth.props.secretKey,
      endUserId: context.auth.props.endUserId,
    };

    const maxRefLength = paymentType === 'customer_payment' ? CUSTOMER_PAYMENT_MAX_REF_LENGTH : BILL_PAYMENT_MAX_REF_LENGTH;
    if (propsValue.refNumber && propsValue.refNumber.length > maxRefLength) {
      throw new Error(
        `Reference/Check Number must be ${maxRefLength} characters or fewer for this payment type — "${propsValue.refNumber}" is ${propsValue.refNumber.length}.`
      );
    }

    // `totalAmount` only belongs on receive-payments — the two bill-payment endpoints reject it
    // and derive their total from applyToTransactions[].paymentAmount instead, so it's added
    // per-branch below rather than in this shared body.
    const commonBody = {
      transactionDate: toDateOnly(propsValue.transactionDate),
      ...spreadIfDefined('refNumber', propsValue.refNumber),
      ...spreadIfDefined('memo', propsValue.memo),
    };

    if (paymentType === 'customer_payment') {
      if (!propsValue.customerId) {
        throw new Error('Customer is required for a Customer Payment.');
      }
      if (propsValue.applyToSpecificInvoice && !propsValue.invoiceId) {
        throw new Error('Invoice is required when "Apply to a specific invoice" is on.');
      }
      const body = {
        customerId: propsValue.customerId,
        totalAmount: propsValue.amount,
        ...commonBody,
        ...(propsValue.applyToSpecificInvoice
          ? { applyToTransactions: [{ transactionId: propsValue.invoiceId, paymentAmount: propsValue.amount }] }
          : { isAutoApply: true }),
      };
      const result = await withRecordLockRetry(() =>
        conductorClient.request<ConductorPaymentResult>({
          auth,
          method: HttpMethod.POST,
          resourceUri: '/quickbooks-desktop/receive-payments',
          body,
          // This creates a new payment — see client.ts's `request` doc on why creates opt out of retry.
          safeToRetry: false,
        })
      );
      return flattenPayment({ payment: result, paymentType });
    }

    if (!propsValue.vendorId) {
      throw new Error('Vendor is required for a Bill Payment.');
    }
    if (!propsValue.billId) {
      throw new Error('Bill is required for a Bill Payment — QuickBooks Desktop has no auto-apply for bill payments.');
    }

    const applyToTransactions = [{ transactionId: propsValue.billId, paymentAmount: propsValue.amount }];

    if (paymentType === 'bill_payment_check') {
      if (!propsValue.bankAccountId) {
        throw new Error('Bank Account is required for a Bill Payment — Check.');
      }
      const body = {
        vendorId: propsValue.vendorId,
        bankAccountId: propsValue.bankAccountId,
        ...commonBody,
        applyToTransactions,
      };
      const result = await withRecordLockRetry(() =>
        conductorClient.request<ConductorPaymentResult>({
          auth,
          method: HttpMethod.POST,
          resourceUri: '/quickbooks-desktop/bill-check-payments',
          body,
          safeToRetry: false,
        })
      );
      return flattenPayment({ payment: result, paymentType });
    }

    if (!propsValue.creditCardAccountId) {
      throw new Error('Credit Card Account is required for a Bill Payment — Credit Card.');
    }
    const body = {
      vendorId: propsValue.vendorId,
      creditCardAccountId: propsValue.creditCardAccountId,
      ...commonBody,
      applyToTransactions,
    };
    const result = await withRecordLockRetry(() =>
      conductorClient.request<ConductorPaymentResult>({
        auth,
        method: HttpMethod.POST,
        resourceUri: '/quickbooks-desktop/bill-credit-card-payments',
        body,
        safeToRetry: false,
      })
    );
    return flattenPayment({ payment: result, paymentType });
  },
});
