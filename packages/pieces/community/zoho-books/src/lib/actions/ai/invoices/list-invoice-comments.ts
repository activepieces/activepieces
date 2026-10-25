import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const listInvoiceCommentsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_invoice_comments',
  displayName: 'List Invoice Comments',
  description: 'Lists the comments and history of a Zoho Books invoice.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the comments and activity history of an invoice with their comment_id, which Update Invoice Comment and Delete Invoice Comment take.',
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
      method: HttpMethod.GET,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/comments`,
      query: { organization_id: organizationId },
    });
  },
});
