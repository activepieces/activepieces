import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';
import { contactIdProperty } from '../common/utils';

export const deleteContactAction = createAction({
  auth: respondIoAuth,
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Permanently delete a contact from Respond.io',
  props: {
    contactId: contactIdProperty,
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Check this box to confirm that you want to permanently delete this contact. This action cannot be undone.',
      required: true
    })
  },
  async run(context) {
    const { contactId, confirmDeletion } = context.propsValue;
    const client = new RespondIoClient(context.auth);

    try {
      // Validate confirmation
      if (!confirmDeletion) {
        throw new Error('You must confirm the deletion by checking the confirmation box');
      }

      // Validate contact ID
      if (!contactId || contactId.trim() === '') {
        throw new Error('Contact ID is required');
      }

      // First, try to get the contact to verify it exists
      let contactInfo;
      try {
        contactInfo = await client.getContact(contactId);
      } catch (error: any) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          throw new Error(`Contact with ID '${contactId}' not found`);
        }
        throw error;
      }

      // Delete the contact
      await client.deleteContact(contactId);

      return {
        success: true,
        message: 'Contact deleted successfully',
        deletedContact: {
          id: contactId,
          name: contactInfo.fullName || contactInfo.firstName || 'Unknown',
          email: contactInfo.email,
          phone: contactInfo.phone
        }
      };

    } catch (error: any) {
      throw new Error(`Failed to delete contact: ${error.message}`);
    }
  }
});
