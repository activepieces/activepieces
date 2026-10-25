import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactDocumentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_document',
  displayName: 'Get Contact Document',
  description: 'Downloads a document attached to a Zoho Books contact.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads one document attached to a contact and returns it as a file. Document IDs come from the documents of Get Contact or from Add Contact Attachment.',
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
  },
  async run(context) {
    const { contactId, documentId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const file = await zohoBooksClient.download({
      auth: context.auth,
      path: `/contacts/${encodeURIComponent(contactId)}/documents/${encodeURIComponent(
        documentId,
      )}`,
      query: { organization_id: organizationId },
    });
    return {
      file: await context.files.write({
        fileName: file.fileName ?? `contact-document-${documentId}`,
        data: file.data,
      }),
      contentType: file.contentType,
    };
  },
});
