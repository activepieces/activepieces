import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const markInvoiceDraftAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_mark_invoice_draft',
  displayName: 'Mark Invoice Draft',
  description: 'Marks a voided invoice as draft in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Turns a voided invoice back into a draft, reversing Void Invoice.',
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
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/status/draft`,
      query: { organization_id: organizationId },
    });
  },
});
