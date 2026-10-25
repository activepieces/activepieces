import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceAttachmentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_attachment',
  displayName: 'Get Invoice Attachment',
  description: 'Downloads the file attached to an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Downloads the file attached to an invoice (the last one added with Add Invoice Attachment) and returns it as a file. Use Get Invoice Document for a specific document by document_id.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    preview: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Thumbnail',
      description: 'Yes to get a thumbnail of the attachment instead of the full file.',
    }),
  },
  async run(context) {
    const { invoiceId, preview } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const file = await zohoBooksClient.download({
      auth: context.auth,
      path: `/invoices/${encodeURIComponent(invoiceId)}/attachment`,
      query: { organization_id: organizationId, preview },
    });
    return {
      file: await context.files.write({
        fileName: file.fileName ?? `invoice-${invoiceId}-attachment`,
        data: file.data,
      }),
      contentType: file.contentType,
    };
  },
});
