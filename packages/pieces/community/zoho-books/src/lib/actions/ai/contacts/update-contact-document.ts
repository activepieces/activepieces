import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateContactDocumentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_contact_document',
  displayName: 'Update Contact Document',
  description: 'Updates the details of a document attached to a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a document attached to a contact; only the fields given are sent. Document IDs come from the documents of Get Contact or from Add Contact Attachment.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'Document ID, from the documents of Get Contact or from Add Contact Attachment.',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Document Fields',
      description: 'Document fields to change, e.g. {"file_name": "signed-contract.pdf"}.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, documentId, fields } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/contacts/${encodeURIComponent(contactId)}/documents/${encodeURIComponent(
        documentId,
      )}`,
      query: { organization_id: organizationId },
      body: fields,
    });
  },
});
