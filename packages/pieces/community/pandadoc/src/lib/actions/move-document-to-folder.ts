import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocAiProps } from '../common/ai-props';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const moveDocumentToFolder = createAction({
  auth: pandadocAuth,
  name: 'move_document_to_folder',
  classification: 'WRITE',
  displayName: 'Move Document to Folder',
  description: 'Moves a document into a folder.',
  audience: 'both',
  aiMetadata: {
    description: 'Move a PandaDoc document into a documents folder by folder ID (from List Document Folders or Create Document Folder). Idempotent: moving again to the same folder changes nothing.',
    idempotent: true,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
    folder_id: Property.ShortText({ displayName: 'Folder ID', required: true }),
  },
  outputSchema: pandadocSchemas['moved'],
  async run({ auth, propsValue }) {
    return pandadocApi.moveDocumentToFolder({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' }),
      folderId: pandadocInputs.requiredString({ value: propsValue.folder_id, label: 'Folder ID' }),
    });
  },
});
