import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const createCustomerPaymentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_create_customer_payment',
  displayName: 'Create Customer Payment',
  description: 'Records a payment received from a customer in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Records a payment received from a customer and applies it to invoices; returns it with its payment_id. Each call records a new payment; use List Customer Payments first to avoid duplicates, or Upsert Customer Payment by Custom Field.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerId: zohoBooksAiProps.contactId({
      required: true,
      displayName: 'Customer ID',
      description: 'Contact ID of the paying customer, from List Contacts or Create Contact.',
    }),
    paymentMode: Property.ShortText({
      displayName: 'Payment Mode',
      description:
        'How the payment was made: check, cash, creditcard, banktransfer, bankremittance, autotransaction or others, or a payment mode set up in the organization.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Amount received, e.g. 450.',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Payment date, yyyy-mm-dd, e.g. "2026-06-05".',
      required: true,
    }),
    invoices: Property.Array({
      displayName: 'Invoices',
      description:
        'Invoices the payment is applied to, e.g. [{"invoice_id": "90300000079426", "amount_applied": 450}]. Invoice IDs come from List Invoices.',
      required: true,
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
        'Other payment fields, e.g. {"location_id": "...", "retainerinvoice_id": "...", "contact_persons": ["982000000870911"], "custom_fields": [{"label": "...", "value": "..."}], "tags": [{"tag_id": "...", "tag_option_id": "..."}]}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
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
      method: HttpMethod.POST,
      path: '/customerpayments',
      query: { organization_id: organizationId },
      body: {
        ...additionalFields,
        customer_id: customerId,
        payment_mode: paymentMode,
        amount,
        date,
        invoices,
        ...spreadIfDefined('reference_number', referenceNumber),
        ...spreadIfDefined('description', description),
        ...spreadIfDefined('account_id', accountId),
        ...spreadIfDefined('bank_charges', bankCharges),
        ...spreadIfDefined('exchange_rate', exchangeRate),
      },
    });
  },
});
