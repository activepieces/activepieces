import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const listDocumentFolders = createAction({
  auth: pandadocAuth,
  name: 'list_document_folders',
  classification: 'SEARCH',
  displayName: 'List Document Folders',
  description: 'Lists document folders, optionally inside a parent folder.',
  audience: 'both',
  aiMetadata: {
    description: 'List PandaDoc document folders at the top level or inside a parent folder ID. Returns folder IDs for Move Document to Folder and search filters. Up to 100 per page. Read-only.',
    idempotent: true,
  },
  props: {
    parent_folder_id: Property.ShortText({ displayName: 'Parent Folder ID', description: 'Leave empty for top-level folders.', required: false }),
    count: Property.Number({ displayName: 'Results per Page', description: '1 to 100, default 50.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Starts at 1.', required: false }),
  },
  outputSchema: pandadocSchemas['folderList'],
  async run({ auth, propsValue }) {
    return pandadocApi.listFolders({
      apiKey: auth.secret_text,
      query: {
        parent_uuid: pandadocInputs.optionalString(propsValue.parent_folder_id),
        count: pandadocInputs.boundedCount({ value: propsValue.count, label: 'Results per Page' }),
        page: pandadocInputs.positivePage(propsValue.page),
      },
    });
  },
});
