import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoft365PeopleAuth } from '../auth';

export const deleteAContactFolder = createAction({
  auth: microsoft365PeopleAuth,
  name: 'delete-a-contact-folder',
  displayName: 'Delete Contact Folder',
  description: 'Remove a specified contact folder from Microsoft 365 People',
  props: {
    contactFolderId: Property.ShortText({
      displayName: 'Contact Folder ID',
      description: 'The unique identifier of the contact folder to delete',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID or Principal Name',
      description: 'Optional: User ID or principal name if deleting folder from another user. Leave empty to delete folder from current user.',
      required: false,
    }),
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Check this box to confirm you want to permanently delete this contact folder. This action cannot be undone.',
      required: true,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      // Check if user confirmed the deletion
      if (!propsValue.confirmDeletion) {
        return {
          success: false,
          error: 'Deletion not confirmed. Please check the confirmation box to proceed.',
        };
      }

      const authValue = auth as { access_token: string };
      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve(authValue.access_token),
        },
      });

      // Determine the API endpoint
      let endpoint = `/me/contactFolders/${propsValue.contactFolderId}`;
      
      if (propsValue.userId) {
        endpoint = `/users/${propsValue.userId}/contactFolders/${propsValue.contactFolderId}`;
      }

      // Delete the contact folder using DELETE method
      await client.api(endpoint).delete();

      return {
        success: true,
        message: 'Contact folder deleted successfully',
        deletedFolderId: propsValue.contactFolderId,
        endpoint: endpoint,
        responseCode: '204 No Content',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact folder';
      return {
        success: false,
        error: errorMessage,
        details: error,
        contactFolderId: propsValue.contactFolderId,
        userId: propsValue.userId,
      };
    }
  },
});
