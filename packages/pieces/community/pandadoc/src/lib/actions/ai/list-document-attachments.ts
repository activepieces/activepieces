import { createAction } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../../common/auth';
import { pandadocApi } from '../../common/api';
import { pandadocAiProps } from '../../common/ai-props';
import { pandadocInputs } from '../../common/inputs';
import { pandadocSchemas } from '../../common/schemas';

export const listDocumentAttachmentsAi = createAction({
  auth: pandadocAuth,
  name: 'list_document_attachments',
  classification: 'READ',
  displayName: 'List Document Attachments (AI)',
  description: 'Lists the attachments of a document.',
  audience: 'ai',
  aiMetadata: {
    description: 'List every attachment on one PandaDoc document with its ID, name, type, creator and creation date. Read-only.',
    idempotent: true,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
  },
  outputSchema: pandadocSchemas['attachmentList'],
  async run({ auth, propsValue }) {
    return pandadocApi.listAttachments({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' }),
    });
  },
});
