import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteContactDocumentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_contact_document',
  displayName: 'Delete Contact Document',
  description: 'Deletes a document attached to a Zoho Books contact.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one document attached to a contact; Restore Contact Documents can bring deleted documents back. Document IDs come from the documents of Get Contact or from Add Contact Attachment.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'Document ID, from the documents of Get Contact or from Add Contact Attachment.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, documentId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/contacts/${encodeURIComponent(contactId)}/documents/${encodeURIComponent(
        documentId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
