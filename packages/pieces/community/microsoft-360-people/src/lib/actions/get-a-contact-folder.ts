import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoft365PeopleAuth } from '../common';

interface ContactFolderResponse {
  displayName: string;
  id: string;
  parentFolderId?: string;
}

export const getAContactFolder = createAction({
  auth: microsoft365PeopleAuth,
  name: 'get-a-contact-folder',
  displayName: 'Get Contact Folder',
  description: 'Retrieve metadata (name, ID, parent folder ID) of a specified contact folder',
  props: {
    contactFolderId: Property.ShortText({
      displayName: 'Contact Folder ID',
      description: 'The unique identifier of the contact folder to retrieve',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID or Principal Name',
      description: 'Optional: User ID or principal name if retrieving folder from another user. Leave empty to get folder from current user.',
      required: false,
    }),
    includeChildFolders: Property.Checkbox({
      displayName: 'Include Child Folders',
      description: 'Optional: Include child folders in the response for additional folder hierarchy information',
      required: false,
      defaultValue: false,
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

      // Determine the API endpoint
      let endpoint = `/me/contactFolders/${propsValue.contactFolderId}`;
      
      if (propsValue.userId) {
        endpoint = `/users/${propsValue.userId}/contactFolders/${propsValue.contactFolderId}`;
      }

      // Add query parameters if needed
      if (propsValue.includeChildFolders) {
        endpoint += '?$expand=childFolders';
      }

      // Get the contact folder
      const contactFolder = await client.api(endpoint).get() as ContactFolderResponse;

      return {
        success: true,
        folder: contactFolder,
        message: 'Contact folder retrieved successfully',
        folderId: contactFolder.id,
        displayName: contactFolder.displayName,
        parentFolderId: contactFolder.parentFolderId,
        endpoint: endpoint,
        hasParentFolder: !!contactFolder.parentFolderId,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve contact folder';
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
