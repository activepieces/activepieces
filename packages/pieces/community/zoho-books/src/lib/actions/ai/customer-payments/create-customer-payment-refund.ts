import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const createCustomerPaymentRefundAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_create_customer_payment_refund',
  displayName: 'Create Customer Payment Refund',
  description: 'Refunds the excess amount of a customer payment in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Refunds part or all of the unapplied (excess) amount of a customer payment and returns the refund with its payment_refund_id. Each call records a new refund; use List Customer Payment Refunds first to avoid duplicates.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerPaymentId: zohoBooksAiProps.customerPaymentId({ required: true }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Amount to refund, e.g. 50.',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Refund date, yyyy-mm-dd, e.g. "2026-06-05".',
      required: true,
    }),
    fromAccountId: Property.ShortText({
      displayName: 'From Account ID',
      description: 'ID of the cash or bank account the refund is paid from.',
      required: true,
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
      method: HttpMethod.POST,
      path: `/customerpayments/${encodeURIComponent(customerPaymentId)}/refunds`,
      query: { organization_id: organizationId },
      body: {
        ...additionalFields,
        amount,
        date,
        from_account_id: fromAccountId,
        ...spreadIfDefined('refund_mode', refundMode),
        ...spreadIfDefined('reference_number', referenceNumber),
        ...spreadIfDefined('description', description),
        ...spreadIfDefined('exchange_rate', exchangeRate),
      },
    });
  },
});
