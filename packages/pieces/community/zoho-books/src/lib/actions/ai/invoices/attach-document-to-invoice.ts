import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const attachDocumentToInvoiceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_attach_document_to_invoice',
  displayName: 'Attach Document to Invoice',
  description: 'Attaches an existing document to an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Attaches an existing Zoho Books document, by document_id, to an invoice. To upload a new file use Add Invoice Attachment or Upload Invoice Document.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'Document ID of a file already in Zoho Books Documents.',
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
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/documents/${encodeURIComponent(
        documentId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
