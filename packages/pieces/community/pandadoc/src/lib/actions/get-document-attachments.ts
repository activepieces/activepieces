import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocClient, pandadocAuth, PandaDocAuthType } from '../common';
import { documentDropdown, documentAttachmentDropdown } from '../common/dynamic-dropdowns';

export const getDocumentAttachments = createAction({
  name: 'getDocumentAttachments',
  displayName: 'Get Document Attachment Details',
  description: 'Retrieve details of a specific attachment from a document for review or storage',
  auth: pandadocAuth,
  props: {
    document_id: documentDropdown,
    attachment_id: documentAttachmentDropdown,
  },
  async run({ auth, propsValue }) {
    return await pandadocClient.makeRequest(
      auth as PandaDocAuthType,
      HttpMethod.GET,
      `/documents/${propsValue.document_id}/attachments/${propsValue.attachment_id}`
    );
  },
});
