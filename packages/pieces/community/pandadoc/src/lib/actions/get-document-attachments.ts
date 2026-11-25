import { createAction } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';
import { documentDropdown, documentAttachmentDropdown } from '../common/dynamic-dropdowns';

export const getDocumentAttachments = createAction({
  auth: pandadocAuth,
  name: 'getDocumentAttachments',
  classification: 'READ',
  displayName: 'Get Document Attachment',
  description: 'Retrieves details of a specific attachment from a document.',
  audience: 'human',
  aiMetadata: {
    description: 'Get the details of one attachment on a PandaDoc document. Read-only.',
    idempotent: true,
  },
  props: {
    document_id: documentDropdown,
    attachment_id: documentAttachmentDropdown,
  },
  outputSchema: pandadocSchemas['rawAttachment'],
  async run({ auth, propsValue }) {
    return pandadocApi.getAttachmentRaw({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document' }),
      attachmentId: pandadocInputs.requiredString({ value: propsValue.attachment_id, label: 'Attachment' }),
    });
  },
});
