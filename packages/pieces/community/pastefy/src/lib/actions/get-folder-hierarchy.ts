import { createAction } from '@activepieces/pieces-framework';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyProps } from '../common/props';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'get_folder_hierarchy',
  classification: 'READ',
  displayName: 'Get Folder Hierarchy',
  description: 'Retrieves the tree of all your folders.',
  audience: 'human',
  aiMetadata: {
    description: 'Returns the full nested folder tree of the account in one request, or the subtree under a start folder picked from a dropdown. Read-only and idempotent. Needs an API key in the Pastefy connection.',
    idempotent: true,
  },
  props: {
    parent_id: pastefyProps.folderDropdown({ required: false, displayName: 'Start Folder', description: 'Only return the folders inside this folder.' }),
  },
  outputSchema: pastefyOutputSchemas.folderTree,
  async run({ auth, propsValue }) {
    const tree = await pastefyRequests.folderTree({ auth });
    if (!propsValue.parent_id) {
      return tree;
    }
    const children = pastefyRequests.subtree({ tree, folderId: propsValue.parent_id });
    if (children === null) {
      throw new Error(`Folder ${propsValue.parent_id} was not found in your folders.`);
    }
    return children;
  },
});
