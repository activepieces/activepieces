import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const createDocumentFolder = createAction({
  auth: pandadocAuth,
  name: 'create_document_folder',
  classification: 'WRITE',
  displayName: 'Create Document Folder',
  description: 'Creates a folder for documents.',
  audience: 'both',
  aiMetadata: {
    description: 'Create a PandaDoc documents folder, at the top level or inside a parent folder ID. Check List Document Folders first: PandaDoc allows duplicate names, so this is not idempotent.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Folder Name', required: true }),
    parent_folder_id: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Leave empty to create a top-level folder.', required: false }),
  },
  outputSchema: pandadocSchemas['folder'],
  async run({ auth, propsValue }) {
    return pandadocApi.createFolder({
      apiKey: auth.secret_text,
      name: pandadocInputs.requiredString({ value: propsValue.name, label: 'Folder Name' }),
      parentId: pandadocInputs.optionalString(propsValue.parent_folder_id),
    });
  },
});
