import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteInvoiceAppliedCreditAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_invoice_applied_credit',
  displayName: 'Delete Invoice Applied Credit',
  description: 'Removes a credit applied to an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one applied credit note from an invoice, raising its balance and returning the credit to the customer. The creditnotes_invoice_id comes from List Invoice Credits Applied.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    creditnotesInvoiceId: Property.ShortText({
      displayName: 'Credit Note Invoice ID',
      description:
        'The creditnotes_invoice_id of the applied credit, from List Invoice Credits Applied (not the creditnote_id).',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, creditnotesInvoiceId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/invoices/${encodeURIComponent(invoiceId)}/creditsapplied/${encodeURIComponent(
        creditnotesInvoiceId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
