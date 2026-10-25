import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateCustomerPaymentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_customer_payment',
  displayName: 'Update Customer Payment',
  description: 'Updates a payment received from a customer in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a customer payment; only the fields given are sent. Invoices, when given, replace the invoices the payment is applied to. Use Get Customer Payment to read the current values.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerPaymentId: zohoBooksAiProps.customerPaymentId({ required: true }),
    customerId: zohoBooksAiProps.contactId({
      required: false,
      displayName: 'Customer ID',
      description: 'Contact ID of the paying customer, from List Contacts.',
    }),
    paymentMode: Property.ShortText({
      displayName: 'Payment Mode',
      description:
        'How the payment was made: check, cash, creditcard, banktransfer, bankremittance, autotransaction or others, or a payment mode set up in the organization.',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Amount received, e.g. 450.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Payment date, yyyy-mm-dd, e.g. "2026-06-05".',
      required: false,
    }),
    invoices: Property.Array({
      displayName: 'Invoices',
      description:
        'Invoices the payment is applied to, e.g. [{"invoice_id": "90300000079426", "amount_applied": 450}]. Invoice IDs come from List Invoices. Leave empty to keep the current ones.',
      required: false,
      properties: {
        invoice_id: Property.ShortText({ displayName: 'Invoice ID', required: true }),
        amount_applied: Property.Number({ displayName: 'Amount Applied', required: true }),
        tax_amount_withheld: Property.Number({
          displayName: 'Tax Amount Withheld',
          required: false,
        }),
      },
    }),
    referenceNumber: Property.ShortText({
      displayName: 'Reference Number',
      description: 'e.g. "INV-384".',
      required: false,
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    accountId: Property.ShortText({
      displayName: 'Deposit Account ID',
      description: 'ID of the cash or bank account the payment is deposited to.',
      required: false,
    }),
    bankCharges: Property.Number({ displayName: 'Bank Charges', required: false }),
    exchangeRate: Property.Number({
      displayName: 'Exchange Rate',
      description: 'Exchange rate from the invoice currency to the base currency, e.g. 1.',
      required: false,
    }),
    additionalFields: zohoBooksAiProps.additionalFields({
      description:
        'Other payment fields, e.g. {"location_id": "...", "retainerinvoice_id": "...", "custom_fields": [{"label": "...", "value": "..."}], "tags": [{"tag_id": "...", "tag_option_id": "..."}]}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      customerPaymentId,
      customerId,
      paymentMode,
      amount,
      date,
      invoices,
      referenceNumber,
      description,
      accountId,
      bankCharges,
      exchangeRate,
      additionalFields,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/customerpayments/${encodeURIComponent(customerPaymentId)}`,
      query: { organization_id: organizationId },
      body: {
        ...additionalFields,
        ...spreadIfDefined('customer_id', customerId),
        ...spreadIfDefined('payment_mode', paymentMode),
        ...spreadIfDefined('amount', amount),
        ...spreadIfDefined('date', date),
        ...(invoices && invoices.length > 0 ? { invoices } : {}),
        ...spreadIfDefined('reference_number', referenceNumber),
        ...spreadIfDefined('description', description),
        ...spreadIfDefined('account_id', accountId),
        ...spreadIfDefined('bank_charges', bankCharges),
        ...spreadIfDefined('exchange_rate', exchangeRate),
      },
    });
  },
});
