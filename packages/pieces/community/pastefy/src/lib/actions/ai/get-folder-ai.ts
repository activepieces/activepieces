import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAiProps } from '../../common/ai-props';
import { pastefyAuth } from '../../common/auth';
import { pastefyOutputSchemas } from '../../common/output-schemas';
import { pastefyRequests } from '../../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'get_folder_ai',
  classification: 'READ',
  displayName: 'Get Folder (by ID)',
  description: 'Gets a folder by ID with its subfolders and pastes.',
  audience: 'ai',
  aiMetadata: {
    description: 'Gets one folder by folder_id (from List Folders): name, owner, created date its pastes and subfolders with their contents. With include_contents false, pastes is empty and subfolders carry only ID and name. Read-only and idempotent. Needs an API key in the Pastefy connection.',
    idempotent: true,
  },
  props: {
    folder_id: pastefyAiProps.folderId({ required: true, displayName: 'Folder ID', description: 'Folder ID from List Folders.' }),
    include_contents: Property.Checkbox({ displayName: 'Include Contents', description: 'Add pastes and subfolder contents.', required: false, defaultValue: true }),
  },
  outputSchema: pastefyOutputSchemas.folder,
  async run({ auth, propsValue }) {
    return pastefyRequests.getFolder({ auth, folderId: propsValue.folder_id, includeContents: propsValue.include_contents !== false });
  },
});
