import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteInvoiceDocumentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_invoice_document',
  displayName: 'Delete Invoice Document',
  description: 'Deletes a document attached to an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes one document from an invoice; it cannot be undone. System-generated documents cannot be deleted.',
    idempotent: false,
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
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/invoices/${encodeURIComponent(invoiceId)}/documents/${encodeURIComponent(
        documentId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
