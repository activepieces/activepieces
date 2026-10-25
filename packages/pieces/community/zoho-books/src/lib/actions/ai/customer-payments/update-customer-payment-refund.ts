import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateCustomerPaymentRefundAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_customer_payment_refund',
  displayName: 'Update Customer Payment Refund',
  description: 'Updates a refund of a customer payment in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a refund of a customer payment; only the fields given are sent. Use Get Customer Payment Refund to read the current values.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerPaymentId: zohoBooksAiProps.customerPaymentId({ required: true }),
    refundId: Property.ShortText({
      displayName: 'Refund ID',
      description:
        'Refund ID (payment_refund_id), from List Customer Payment Refunds or Create Customer Payment Refund.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Refunded amount, e.g. 50.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Refund date, yyyy-mm-dd, e.g. "2026-06-05".',
      required: false,
    }),
    fromAccountId: Property.ShortText({
      displayName: 'From Account ID',
      description: 'ID of the cash or bank account the refund is paid from.',
      required: false,
    }),
    refundMode: Property.ShortText({
      displayName: 'Refund Mode',
      description: 'How the refund is paid, e.g. "cash" or "banktransfer".',
      required: false,
    }),
    referenceNumber: Property.ShortText({ displayName: 'Reference Number', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    exchangeRate: Property.Number({
      displayName: 'Exchange Rate',
      description: 'Exchange rate from the payment currency to the base currency, e.g. 1.',
      required: false,
    }),
    additionalFields: zohoBooksAiProps.additionalFields({
      description:
        'Other refund fields, e.g. {"payment_form": "cash"}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      customerPaymentId,
      refundId,
      amount,
      date,
      fromAccountId,
      refundMode,
      referenceNumber,
      description,
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
      path: `/customerpayments/${encodeURIComponent(
        customerPaymentId,
      )}/refunds/${encodeURIComponent(refundId)}`,
      query: { organization_id: organizationId },
      body: {
        ...additionalFields,
        ...spreadIfDefined('amount', amount),
        ...spreadIfDefined('date', date),
        ...spreadIfDefined('from_account_id', fromAccountId),
        ...spreadIfDefined('refund_mode', refundMode),
        ...spreadIfDefined('reference_number', referenceNumber),
        ...spreadIfDefined('description', description),
        ...spreadIfDefined('exchange_rate', exchangeRate),
      },
    });
  },
});
