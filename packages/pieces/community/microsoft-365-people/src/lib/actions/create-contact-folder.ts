import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const createContactFolder = createAction({
  auth: microsoft365PeopleAuth,
  name: 'createContactFolder',
  displayName: 'Create a Contact Folder',
  description: 'Organize contacts by adding a new contact folder.',
  props: microsoft365PeopleCommon.contactFolderProperties(),
  async run({ auth, propsValue }) {
    const contactFolder = {
      displayName: propsValue.displayName,
      parentFolderId: propsValue.parentFolder,
    };

    return await microsoft365PeopleCommon.createContactFolder({
      auth,
      contactFolder,
    });
  },
});
