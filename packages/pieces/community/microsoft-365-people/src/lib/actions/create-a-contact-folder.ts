import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365Auth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/client';

export const createAContactFolder = createAction({
  auth: microsoft365Auth,
  name: 'createAContactFolder',
  displayName: 'Create a Contact Folder',
  description: 'Organize contacts by adding a new contact folder',
  props: {
    displayName: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name of the contact folder to create',
      required: true,
    }),
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description:
        'ID of the parent folder (optional - leave empty to create at root level)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const folderData: any = {
      displayName: propsValue.displayName,
    };

    if (propsValue.parentFolderId) {
      folderData.parentFolderId = propsValue.parentFolderId;
    }

    try {
      const folder = await microsoft365PeopleCommon.createContactFolder(
        auth,
        folderData
      );

      return {
        success: true,
        folder: folder,
        message: `Contact folder "${folder.displayName}" created successfully`,
        folderId: folder.id,
      };
    } catch (error) {
      throw new Error(`Failed to create contact folder: ${error}`);
    }
  },
});
