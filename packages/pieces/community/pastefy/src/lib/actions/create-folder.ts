import { createAction, Property } from '@activepieces/pieces-framework';
import { pastefyAuth } from '../common/auth';
import { pastefyOutputSchemas } from '../common/output-schemas';
import { pastefyProps } from '../common/props';
import { pastefyRequests } from '../common/requests';

export default createAction({
  auth: pastefyAuth,
  name: 'create_folder',
  classification: 'WRITE',
  displayName: 'Create Folder',
  description: 'Creates a new folder.',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a folder, optionally inside a parent folder picked from a dropdown. Creates a new folder with a new ID on every call, so it is not idempotent. Needs an API key in the Pastefy connection.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    parent_id: pastefyProps.folderDropdown({ required: false, displayName: 'Parent Folder', description: 'Create the folder inside this folder.' }),
  },
  outputSchema: pastefyOutputSchemas.folder,
  async run({ auth, propsValue }) {
    return pastefyRequests.createFolder({ auth, name: propsValue.name, parentId: propsValue.parent_id });
  },
});
