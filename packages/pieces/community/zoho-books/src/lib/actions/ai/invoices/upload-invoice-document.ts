import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const uploadInvoiceDocumentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_upload_invoice_document',
  displayName: 'Upload Invoice Document',
  description: 'Uploads the file content of a document attached to a Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads the file content for a document already attached to an invoice, replacing what it held. The document_id comes from the documents of Get Invoice or from Attach Document To Invoice; use Add Invoice Attachment to attach a new file instead.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description:
        'Document ID, from the documents of Get Invoice or from Attach Document To Invoice.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'File to upload.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, documentId, file } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const form = new FormData();
    form.append('attachment', new Blob([file.data]), file.filename);
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/documents/${encodeURIComponent(
        documentId,
      )}/upload`,
      query: { organization_id: organizationId },
      body: form,
    });
  },
});
