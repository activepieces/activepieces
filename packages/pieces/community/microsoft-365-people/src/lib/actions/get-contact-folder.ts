import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const getContactFolder = createAction({
  auth: microsoft365PeopleAuth,
  name: 'getContactFolder',
  displayName: 'Get a Contact Folder',
  description: 'Retrieve metadata (name, ID) of a specified contact folder.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves metadata for a single contact folder in the authenticated user\'s Microsoft 365 People (Outlook) account, identified by its folder ID. Use to look up a folder\'s details (such as its name) by ID. Read-only and idempotent.', idempotent: true },
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
