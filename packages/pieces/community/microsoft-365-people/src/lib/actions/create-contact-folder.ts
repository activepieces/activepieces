import { createAction } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const createContactFolder = createAction({
  auth: microsoft365PeopleAuth,
  name: 'createContactFolder',
  displayName: 'Create a Contact Folder',
  description: 'Organize contacts by adding a new contact folder.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new contact folder in the authenticated user\'s Microsoft 365 People (Outlook) account, optionally nested under a chosen parent folder. Use when organizing contacts into a new grouping. Not idempotent: each call creates another folder even if one with the same name already exists.', idempotent: false },
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
