import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAiProps } from '../../common/ai-props';
import { pastefyAuth } from '../../common/auth';
import { pastefyOutputSchemas } from '../../common/output-schemas';
import { pastefyRequests } from '../../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'create_folder_ai',
  classification: 'WRITE',
  displayName: 'Create Folder (by Parent ID)',
  description: 'Creates a folder, with the parent given by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a folder and returns it with its ID. Give parent_folder_id (from List Folders) to nest it; the step fails if that parent does not exist. Creates a new folder on every call, even with the same name, so it is not idempotent: call List Folders first to reuse an existing one. Needs an API key in the Pastefy connection.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    parent_folder_id: pastefyAiProps.folderId({ required: false, displayName: 'Parent Folder ID', description: 'Folder ID from List Folders.' }),
  },
  outputSchema: pastefyOutputSchemas.folder,
  async run({ auth, propsValue }) {
    return pastefyRequests.createFolder({ auth, name: propsValue.name, parentId: propsValue.parent_folder_id });
  },
});
