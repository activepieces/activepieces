import { createAction } from '@activepieces/pieces-framework';
import { pastefyAuth } from '../../common/auth';
import { pastefyOutputSchemas } from '../../common/output-schemas';
import { pastefyRequests } from '../../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'list_folders',
  classification: 'READ',
  displayName: 'List Folders',
  description: 'Lists all your folders as a flat list with paths.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every folder of the connected account in one call as a flat list of {id, name, path, parent_id}, where path joins names from the top folder down with " / ". Use it to find a folder_id by name before creating, moving or listing pastes. Read-only and idempotent. Needs an API key in the Pastefy connection.',
    idempotent: true,
  },
  props: {},
  outputSchema: pastefyOutputSchemas.folderList,
  async run({ auth }) {
    const tree = await pastefyRequests.folderTree({ auth });
    const folders = pastefyRequests.flattenTree({ tree, parentPath: '', parentId: null });
    return { folders, count: folders.length };
  },
});
