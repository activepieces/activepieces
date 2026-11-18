import { createAction } from '@activepieces/pieces-framework';
import { pastefyAiProps } from '../../common/ai-props';
import { pastefyAuth } from '../../common/auth';
import { pastefyOutputSchemas } from '../../common/output-schemas';
import { pastefyRequests } from '../../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'delete_folder_ai',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Folder (by ID)',
  description: 'Deletes a folder by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes a folder you own by folder_id (from List Folders). Returns {deleted: true, id}; if the folder does not exist it returns {deleted: false, id} instead of failing, so repeat calls are safe and idempotent. Needs an API key in the Pastefy connection.',
    idempotent: true,
  },
  props: {
    folder_id: pastefyAiProps.folderId({ required: true, displayName: 'Folder ID', description: 'Folder ID from List Folders.' }),
  },
  outputSchema: pastefyOutputSchemas.deleted,
  async run({ auth, propsValue }) {
    return pastefyRequests.deleteItem({ auth, kind: 'folder', id: propsValue.folder_id, missingIsOk: true });
  },
});
