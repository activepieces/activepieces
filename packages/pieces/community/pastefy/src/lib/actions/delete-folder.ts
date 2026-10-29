import { createAction } from '@activepieces/pieces-framework';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyProps } from '../common/props';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'delete_folder',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Folder',
  description: 'Deletes a folder.',
  audience: 'human',
  aiMetadata: {
    description: 'Permanently deletes a folder picked from a dropdown. Fails when the folder no longer exists, so a repeat call is not silent; not idempotent. Needs an API key in the Pastefy connection.',
    idempotent: false,
  },
  props: {
    folder_id: pastefyProps.folderDropdown({ required: true, displayName: 'Folder', description: 'The folder to delete.' }),
  },
  outputSchema: pastefyOutputSchemas.deleted,
  async run({ auth, propsValue }) {
    return pastefyRequests.deleteItem({ auth, kind: 'folder', id: propsValue.folder_id, missingIsOk: false });
  },
});
