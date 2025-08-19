import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const deleteContactFolder = createAction({
  auth: microsoft365PeopleAuth,
  name: 'deleteContactFolder',
  displayName: 'Delete a Contact Folder',
  description: 'Remove a specified contact folder.',
  props: {
    contactFolder: microsoft365PeopleCommon.contactFolderDropdown("Contact Folder"),
  },
  async run({ auth, propsValue }) {
    if (!propsValue.contactFolder) {
      throw new Error('Contact folder is required.');
    }
    return await microsoft365PeopleCommon.deleteContactFolder({
      auth,
      contactFolderId: propsValue.contactFolder,
    });
  },
});
