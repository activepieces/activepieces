import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const updateInvoiceCommentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_invoice_comment',
  displayName: 'Update Invoice Comment',
  description: 'Updates a comment on a Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates the text or client visibility of an invoice comment; only the fields given are sent. The comment_id comes from List Invoice Comments or Add Invoice Comment.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    commentId: Property.ShortText({
      displayName: 'Comment ID',
      description: 'Comment ID, from List Invoice Comments or Add Invoice Comment.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Comment',
      description: 'New text of the comment.',
      required: false,
    }),
    showCommentToClients: zohoBooksAiProps.flag({
      displayName: 'Show Comment To Clients',
      description: 'Whether the customer sees the comment in the customer portal.',
      required: false,
    }),
  },
  async run(context) {
    const { invoiceId, commentId, description, showCommentToClients } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/invoices/${encodeURIComponent(invoiceId)}/comments/${encodeURIComponent(commentId)}`,
      query: { organization_id: organizationId },
      body: {
        ...spreadIfDefined('description', description),
        ...spreadIfDefined(
          'show_comment_to_clients',
          zohoBooksUtils.toBoolean({ value: showCommentToClients }),
        ),
      },
    });
  },
});
