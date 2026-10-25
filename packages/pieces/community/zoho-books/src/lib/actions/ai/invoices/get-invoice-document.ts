import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceDocumentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_document',
  displayName: 'Get Invoice Document',
  description: 'Downloads a document attached to an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads one document attached to an invoice by document_id and returns it as a file. The document_id comes from the documents of Get Invoice.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description:
        'Document ID, from the documents of Get Invoice or from Upload Invoice Document.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, documentId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const file = await zohoBooksClient.download({
      auth: context.auth,
      path: `/invoices/${encodeURIComponent(invoiceId)}/documents/${encodeURIComponent(
        documentId,
      )}`,
      query: { organization_id: organizationId },
    });
    return {
      file: await context.files.write({
        fileName: file.fileName ?? `invoice-document-${documentId}`,
        data: file.data,
      }),
      contentType: file.contentType,
    };
  },
});
