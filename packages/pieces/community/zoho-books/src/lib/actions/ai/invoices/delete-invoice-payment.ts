import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteInvoicePaymentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_invoice_payment',
  displayName: 'Delete Invoice Payment',
  description: 'Deletes a payment made to an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one payment from an invoice, raising its balance again; it cannot be undone. The invoice_payment_id comes from List Invoice Payments.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    invoicePaymentId: Property.ShortText({
      displayName: 'Invoice Payment ID',
      description:
        'The invoice_payment_id of the payment, from List Invoice Payments (not the payment_id).',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, invoicePaymentId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/invoices/${encodeURIComponent(invoiceId)}/payments/${encodeURIComponent(
        invoicePaymentId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
