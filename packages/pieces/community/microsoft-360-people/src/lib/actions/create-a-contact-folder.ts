import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoft365PeopleAuth } from '../auth';

interface ContactFolder {
  displayName: string;
  parentFolderId?: string;
}

export const createAContactFolder = createAction({
  auth: microsoft365PeopleAuth,
  name: 'create-a-contact-folder',
  displayName: 'Create Contact Folder',
  description: 'Create a new contact folder to organize contacts in Microsoft 365 People',
  props: {
    displayName: Property.ShortText({
      displayName: 'Folder Name',
      description: 'The display name for the new contact folder',
      required: true,
    }),
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'Optional: ID of the parent folder to create this folder under. Leave empty to create under the user\'s default contact folder.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID or Principal Name',
      description: 'Optional: User ID or principal name if creating folder for another user. Leave empty to create folder for current user.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const authValue = auth as { access_token: string };
      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve(authValue.access_token),
        },
      });

      // Build the contact folder object
      const contactFolder: ContactFolder = {
        displayName: propsValue.displayName,
      };

      // Add parent folder ID if provided
      if (propsValue.parentFolderId) {
        contactFolder.parentFolderId = propsValue.parentFolderId;
      }

      // Determine the API endpoint
      let endpoint: string;
      
      if (propsValue.userId) {
        if (propsValue.parentFolderId) {
          // Create under specific parent folder for specific user
          endpoint = `/users/${propsValue.userId}/contactFolders/${propsValue.parentFolderId}/childFolders`;
        } else {
          // Create under user's default contact folder
          endpoint = `/users/${propsValue.userId}/contactFolders`;
        }
      } else {
        if (propsValue.parentFolderId) {
          // Create under specific parent folder for current user
          endpoint = `/me/contactFolders/${propsValue.parentFolderId}/childFolders`;
        } else {
          // Create under current user's default contact folder
          endpoint = '/me/contactFolders';
        }
      }

      // Create the contact folder
      const createdFolder = await client.api(endpoint).post(contactFolder);

      return {
        success: true,
        folder: createdFolder,
        message: 'Contact folder created successfully',
        folderId: createdFolder.id,
        displayName: createdFolder.displayName,
        parentFolderId: createdFolder.parentFolderId,
        endpoint: endpoint,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create contact folder';
      return {
        success: false,
        error: errorMessage,
        details: error,
        displayName: propsValue.displayName,
        parentFolderId: propsValue.parentFolderId,
      };
    }
  },
});
