import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const submitInvoiceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_submit_invoice',
  displayName: 'Submit Invoice',
  description: 'Submits an invoice for approval in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Submits a draft invoice for approval. Needs the invoice approval workflow enabled in Zoho Books; Approve Invoice then approves it.',
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
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/submit`,
      query: { organization_id: organizationId },
    });
  },
});
