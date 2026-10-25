import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const addInvoiceAttachmentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_add_invoice_attachment',
  displayName: 'Add Invoice Attachment',
  description: 'Attaches a file to an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Attaches a gif, png, jpeg, jpg, bmp or pdf file to an invoice. Each call adds another file. Update Invoice Attachment Preference sets whether it goes out with invoice emails.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'File to attach: gif, png, jpeg, jpg, bmp or pdf.',
      required: true,
    }),
    canSendInMail: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Send With Invoice Email',
      description: 'Yes to include the file when the invoice is emailed.',
    }),
  },
  async run(context) {
    const { invoiceId, file, canSendInMail } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const form = new FormData();
    form.append('attachment', new Blob([file.data]), file.filename);
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/attachment`,
      query: { organization_id: organizationId, can_send_in_mail: canSendInMail },
      body: form,
    });
  },
});
