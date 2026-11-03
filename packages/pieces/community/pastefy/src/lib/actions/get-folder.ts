import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyProps } from '../common/props';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'get_folder',
  classification: 'READ',
  displayName: 'Get Folder',
  description: 'Retrieves a folder with its subfolders and pastes.',
  audience: 'human',
  aiMetadata: {
    description: 'Gets one folder picked from a dropdown, with its pastes and subfolders (each with their own pastes and subfolders) unless Include Contents is off; then only the direct subfolders (ID, name) are listed and pastes is empty. Read-only and idempotent. Needs an API key in the Pastefy connection.',
    idempotent: true,
  },
  props: {
    folder_id: pastefyProps.folderDropdown({ required: true, displayName: 'Folder', description: 'The folder to get.' }),
    include_contents: Property.Checkbox({ displayName: 'Include Contents', description: 'Add pastes and subfolder contents.', required: false, defaultValue: true }),
  },
  outputSchema: pastefyOutputSchemas.folder,
  async run({ auth, propsValue }) {
    return pastefyRequests.getFolder({ auth, folderId: propsValue.folder_id, includeContents: propsValue.include_contents !== false });
  },
});
