import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeAuth, systemeCommon } from '../common';

export const removeTagFromContact = createAction({
  auth: systemeAuth,
  name: 'remove_tag_from_contact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove a tag from an existing contact using the tag ID',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to remove the tag from',
      required: true,
    }),
    tagId: Property.ShortText({
      displayName: 'Tag ID',
      description: 'The ID of the tag to remove from the contact (use List Contact Tags to get tag IDs)',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, tagId } = context.propsValue;

    if (!systemeCommon.validateId(contactId)) {
      throw new Error('Valid contact ID is required and cannot be empty.');
    }
    
    if (!systemeCommon.validateId(tagId)) {
      throw new Error('Valid tag ID is required and cannot be empty.');
    }

    try {
      await systemeCommon.makeRequestWithAuth<void>(
        context.auth,
        HttpMethod.DELETE,
        `/contacts/${contactId.trim()}/tags/${tagId.trim()}`
      );

      return {
        success: true,
        message: `Tag "${tagId}" successfully removed from contact "${contactId}"`,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          const is404Contact = error.message.toLowerCase().includes('contact');
          if (is404Contact) {
            throw new Error(`Contact with ID "${contactId}" not found.`);
          } else {
            throw new Error(`Tag with ID "${tagId}" not found on contact "${contactId}" or tag does not exist.`);
          }
        }
      }
      throw error;
    }
  },
}); 