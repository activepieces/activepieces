import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const finalizeInvoiceApprovalAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_finalize_invoice_approval',
  displayName: 'Finalize Invoice Approval',
  description: 'Gives the final approval for a Zoho Books invoice in a multi-level approval flow.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Gives the final approval for an invoice that needs a final step in a multi-level approval flow; use Approve Invoice for the regular approval. Needs the invoice approval workflow enabled in Zoho Books.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/approve/final`,
      query: { organization_id: organizationId },
    });
  },
});
