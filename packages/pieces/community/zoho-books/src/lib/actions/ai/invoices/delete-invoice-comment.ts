import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteInvoiceCommentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_invoice_comment',
  displayName: 'Delete Invoice Comment',
  description: 'Deletes a comment from a Zoho Books invoice.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an invoice comment. It cannot be undone. The comment_id comes from List Invoice Comments or Add Invoice Comment.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    commentId: Property.ShortText({
      displayName: 'Comment ID',
      description: 'Comment ID, from List Invoice Comments or Add Invoice Comment.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, commentId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/invoices/${encodeURIComponent(invoiceId)}/comments/${encodeURIComponent(commentId)}`,
      query: { organization_id: organizationId },
    });
  },
});
