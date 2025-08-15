import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoft365PeopleAuth } from '../auth';

export const deleteAContact = createAction({
  auth: microsoft365PeopleAuth,
  name: 'delete-a-contact',
  displayName: 'Delete Contact',
  description: 'Permanently remove a contact from Microsoft 365 People',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The unique identifier of the contact to delete',
      required: true,
    }),
    contactFolderId: Property.ShortText({
      displayName: 'Contact Folder ID',
      description: 'Optional: ID of the contact folder if the contact is in a specific folder. Leave empty if contact is in root contacts folder.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID or Principal Name',
      description: 'Optional: User ID or principal name if deleting contact for another user. Leave empty to delete contact for current user.',
      required: false,
    }),
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Check this box to confirm you want to permanently delete this contact. This action cannot be undone.',
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
      let endpoint = `/me/contacts/${propsValue.contactId}`;
      
      if (propsValue.userId) {
        if (propsValue.contactFolderId) {
          endpoint = `/users/${propsValue.userId}/contactFolders/${propsValue.contactFolderId}/contacts/${propsValue.contactId}`;
        } else {
          endpoint = `/users/${propsValue.userId}/contacts/${propsValue.contactId}`;
        }
      } else if (propsValue.contactFolderId) {
        endpoint = `/me/contactFolders/${propsValue.contactFolderId}/contacts/${propsValue.contactId}`;
      }

      // Delete the contact using DELETE method
      await client.api(endpoint).delete();

      return {
        success: true,
        message: 'Contact deleted successfully',
        deletedContactId: propsValue.contactId,
        endpoint: endpoint,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact';
      return {
        success: false,
        error: errorMessage,
        details: error,
        contactId: propsValue.contactId,
      };
    }
  },
});
