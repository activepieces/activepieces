import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoft365PeopleAuth } from '../auth';

export const deleteAContact = createAction({
  auth: microsoft365PeopleAuth,
  name: 'delete-a-contact',
  displayName: 'Delete Contact',
  description: 'Delete a contact from Microsoft 365 People. Choose between soft delete (moves to deleted items) or permanent delete (moves to purges folder in dumpster).',
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
    permanentDelete: Property.Checkbox({
      displayName: 'Permanent Delete',
      description: 'Check this box to permanently delete the contact (moves to purges folder in dumpster). Uncheck for soft delete (moves to deleted items).',
      required: false,
      defaultValue: false,
    }),
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Check this box to confirm you want to delete this contact. This action cannot be undone.',
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

      if (propsValue.permanentDelete) {
        // For permanent delete, we need to use the permanentDelete endpoint
        // Note: permanentDelete is only available for specific user endpoints, not /me endpoints
        if (!propsValue.userId) {
          return {
            success: false,
            error: 'Permanent delete requires a specific user ID. Please provide a User ID or Principal Name for permanent deletion.',
          };
        }

        // Build the permanent delete endpoint
        let permanentDeleteEndpoint = `/users/${propsValue.userId}/contacts/${propsValue.contactId}/permanentDelete`;
        
        if (propsValue.contactFolderId) {
          permanentDeleteEndpoint = `/users/${propsValue.userId}/contactFolders/${propsValue.contactFolderId}/contacts/${propsValue.contactId}/permanentDelete`;
        }

        // Perform permanent delete using POST method
        await client.api(permanentDeleteEndpoint).post({});

        return {
          success: true,
          message: 'Contact permanently deleted successfully',
          deletedContactId: propsValue.contactId,
          deletionType: 'permanent',
          endpoint: permanentDeleteEndpoint,
          note: 'Contact has been moved to the purges folder in the dumpster and cannot be recovered by email clients.',
        };
      } else {
        // For soft delete, use the regular DELETE method
        await client.api(endpoint).delete();

        return {
          success: true,
          message: 'Contact deleted successfully (moved to deleted items)',
          deletedContactId: propsValue.contactId,
          deletionType: 'soft',
          endpoint: endpoint,
          note: 'Contact has been moved to deleted items and can be recovered from the deleted items folder.',
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact';
      return {
        success: false,
        error: errorMessage,
        details: error,
        contactId: propsValue.contactId,
        deletionType: propsValue.permanentDelete ? 'permanent' : 'soft',
        userId: propsValue.userId,
        contactFolderId: propsValue.contactFolderId,
      };
    }
  },
});
