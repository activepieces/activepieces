import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const addContactAttachmentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_add_contact_attachment',
  displayName: 'Add Contact Attachment',
  description: 'Attaches a file to a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a file and attaches it to a contact as a document. Each call adds a new document; Get Contact Document, Update Contact Document and Delete Contact Document take its document_id.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'File to attach, e.g. a signed contract PDF.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, file } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const form = new FormData();
    form.append('attachment', new Blob([file.data]), file.filename);
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/attachment`,
      query: { organization_id: organizationId },
      body: form,
    });
  },
});
