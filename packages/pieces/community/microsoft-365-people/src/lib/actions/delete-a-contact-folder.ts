import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365Auth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/client';

export const deleteAContactFolder = createAction({
  auth: microsoft365Auth,
  name: 'deleteAContactFolder',
  displayName: 'Delete a Contact Folder',
  description: 'Remove a specified contact folder and all its contents',
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'ID of the contact folder to delete',
      required: true,
    }),
    confirmDelete: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description:
        'Check to confirm that you want to permanently delete this folder and all its contacts',
      required: true,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    // Safety check for confirmation
    if (!propsValue.confirmDelete) {
      throw new Error(
        'Please confirm the deletion by checking the "Confirm Deletion" checkbox. This action will permanently delete the folder and all its contacts.'
      );
    }

    try {
      const folder = await microsoft365PeopleCommon.getContactFolder(
        auth,
        propsValue.folderId
      );

      // Delete the folder
      await microsoft365PeopleCommon.deleteContactFolder(
        auth,
        propsValue.folderId
      );

      return {
        success: true,
        message: `Contact folder "${folder.displayName}" (ID: ${propsValue.folderId}) has been permanently deleted`,
        deletedFolderId: propsValue.folderId,
        deletedFolderName: folder.displayName,
      };
    } catch (error) {
      throw new Error(`Failed to delete contact folder: ${error}`);
    }
  },
});
