import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365Auth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/client';

export const deleteAContact = createAction({
  auth: microsoft365Auth,
  name: 'deleteAContact',
  displayName: 'Delete a Contact',
  description: 'Permanently remove a contact from Microsoft 365 People',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to delete',
      required: true,
    }),
    confirmDelete: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Check to confirm that you want to permanently delete this contact',
      required: true,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    // Safety check for confirmation
    if (!propsValue.confirmDelete) {
      throw new Error('Please confirm the deletion by checking the "Confirm Deletion" checkbox. This action cannot be undone.');
    }

    try {
      // First, get the contact to retrieve its display name for the response
      const contact = await microsoft365PeopleCommon.getContact(auth, propsValue.contactId);
      
      // Delete the contact
      await microsoft365PeopleCommon.deleteContact(auth, propsValue.contactId);

      return {
        success: true,
        message: `Contact "${contact.displayName}" (ID: ${propsValue.contactId}) has been permanently deleted`,
        deletedContactId: propsValue.contactId,
        deletedContactName: contact.displayName,
      };
    } catch (error) {
      // Handle specific error cases
      // if (error.message?.includes('404') || error.message?.includes('not found')) {
      //   throw new Error(`Contact with ID "${propsValue.contactId}" was not found. It may have already been deleted.`);
      // }
      
      throw new Error(`Failed to delete contact: ${error}`);
    }
  },
});