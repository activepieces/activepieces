import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocClient, pandadocAuth } from '../common';
import { documentDropdown, documentAttachmentDropdown } from '../common/dynamic-dropdowns';

export const getDocumentAttachments = createAction({
  name: 'getDocumentAttachments',
  displayName: 'Get Document Attachment',
  description: 'Retrieves details of a specific attachment from a document.',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieve details of a single attachment on a PandaDoc document, identified by document ID and attachment ID. Use to inspect a known attachment. Read-only and idempotent.',
    idempotent: true,
  },
  auth: pandadocAuth,
  props: {
    document_id: documentDropdown,
    attachment_id: documentAttachmentDropdown,
  },
  async run({ auth, propsValue }) {
    return await pandadocClient.makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/documents/${propsValue.document_id}/attachments/${propsValue.attachment_id}`
    );
  },
});
