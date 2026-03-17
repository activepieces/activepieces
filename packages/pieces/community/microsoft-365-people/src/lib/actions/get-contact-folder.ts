import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const getContactFolder = createAction({
  auth: microsoft365PeopleAuth,
  name: 'getContactFolder',
  displayName: 'Get a Contact Folder',
  description: 'Retrieve metadata (name, ID) of a specified contact folder.',
  props: { contactFolder: microsoft365PeopleCommon.contactFolderDropdown("Contact Folder", "Select a contact folder", true) },
  async run({ auth, propsValue }) {
    if (!propsValue.contactFolder) {
      throw new Error('Contact folder is required.');
    }
    return await microsoft365PeopleCommon.getContactFolder({
      auth,
      contactFolderId: propsValue.contactFolder,
    });
  },
});
