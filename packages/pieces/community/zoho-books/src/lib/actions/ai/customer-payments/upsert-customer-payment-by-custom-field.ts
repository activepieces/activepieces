import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const upsertCustomerPaymentByCustomFieldAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_upsert_customer_payment_by_custom_field',
  displayName: 'Upsert Customer Payment by Custom Field',
  description:
    'Updates the customer payment matching a unique custom field value, or creates it when none matches.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Finds the customer payment whose unique custom field (one that rejects duplicate values) has the given value and updates it; with Create If Missing set to Yes, records a new payment when none matches. Repeating the call with the same key does not create duplicates.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    uniqueFieldApiName: Property.ShortText({
      displayName: 'Unique Custom Field API Name',
      description:
        'API name of a customer payment custom field set to reject duplicates, e.g. "cf_external_id".',
      required: true,
    }),
    uniqueFieldValue: Property.ShortText({
      displayName: 'Unique Custom Field Value',
      description: 'Value of that custom field that identifies the payment.',
      required: true,
    }),
    createIfMissing: zohoBooksAiProps.flag({
      displayName: 'Create If Missing',
      description: 'Yes records a new payment when no payment has the value. Defaults to No.',
      required: false,
    }),
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
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Payment date, yyyy-mm-dd, e.g. "2026-06-05".',
      required: false,
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
      uniqueFieldApiName,
      uniqueFieldValue,
      createIfMissing,
      customerId,
      paymentMode,
      amount,
      invoices,
      date,
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
      path: '/customerpayments',
      query: { organization_id: organizationId },
      headers: {
        'X-Unique-Identifier-Key': uniqueFieldApiName,
        'X-Unique-Identifier-Value': uniqueFieldValue,
        ...spreadIfDefined('X-Upsert', createIfMissing),
      },
      body: {
        ...additionalFields,
        customer_id: customerId,
        payment_mode: paymentMode,
        amount,
        invoices,
        ...spreadIfDefined('date', date),
        ...spreadIfDefined('reference_number', referenceNumber),
        ...spreadIfDefined('description', description),
        ...spreadIfDefined('account_id', accountId),
        ...spreadIfDefined('bank_charges', bankCharges),
        ...spreadIfDefined('exchange_rate', exchangeRate),
      },
    });
  },
});
