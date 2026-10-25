import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateInvoiceAttachmentPreferenceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_invoice_attachment_preference',
  displayName: 'Update Invoice Attachment Preference',
  description: 'Sets whether the invoice attachment is sent with invoice emails in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets whether the file attached to an invoice (see Add Invoice Attachment) is included when the invoice is emailed.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    canSendInMail: zohoBooksAiProps.flag({
      required: true,
      displayName: 'Send With Invoice Email',
      description: 'Yes to include the attachment when the invoice is emailed, No to leave it out.',
    }),
  },
  async run(context) {
    const { invoiceId, canSendInMail } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/invoices/${encodeURIComponent(invoiceId)}/attachment`,
      query: { organization_id: organizationId, can_send_in_mail: canSendInMail },
    });
  },
});
