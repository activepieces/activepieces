import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const applyCreditsToInvoiceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_apply_credits_to_invoice',
  displayName: 'Apply Credits to Invoice',
  description: 'Applies customer credits to an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Applies the customer's excess payments and/or credit notes to an invoice, reducing its balance; Get Contact Unused Credits lists what is available. Each call applies the amounts again. List Invoice Credits Applied shows the result.",
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    invoicePayments: Property.Json({
      displayName: 'Excess Payments',
      description:
        'Excess customer payments to apply, e.g. [{"payment_id": "982000000567190", "amount_applied": 12.2}]. payment_id comes from List Customer Payments or Get Contact Unused Credits.',
      required: false,
    }),
    applyCreditnotes: Property.Json({
      displayName: 'Credit Notes',
      description:
        'Credit notes to apply, e.g. [{"creditnote_id": "982000000567134", "amount_applied": 12.2}]. creditnote_id comes from Get Contact Unused Credits.',
      required: false,
    }),
  },
  async run(context) {
    const { invoiceId, invoicePayments, applyCreditnotes } = context.propsValue;
    if (invoicePayments === undefined && applyCreditnotes === undefined) {
      throw new Error('Give Excess Payments, Credit Notes, or both.');
    }
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/credits`,
      query: { organization_id: organizationId },
      body: {
        invoice_payments: invoicePayments ?? [],
        apply_creditnotes: applyCreditnotes ?? [],
      },
    });
  },
});
