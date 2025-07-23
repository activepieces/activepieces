import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeAuth, systemeCommon, SystemeTag } from '../common';

interface AddTagRequest extends Record<string, unknown> {
  name: string;
}

export const addTagToContact = createAction({
  auth: systemeAuth,
  name: 'add_tag_to_contact',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag to an existing contact (e.g., "VIP", "Webinar Attendee")',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to add the tag to',
      required: true,
    }),
    tagName: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Name of the tag to assign to the contact',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, tagName } = context.propsValue;

    if (!systemeCommon.validateId(contactId)) {
      throw new Error('Valid contact ID is required and cannot be empty.');
    }
    
    const sanitizedTagName = systemeCommon.sanitizeString(tagName);
    if (!sanitizedTagName) {
      throw new Error('Tag name is required and cannot be empty.');
    }

    if (sanitizedTagName.length > 100) {
      throw new Error('Tag name cannot exceed 100 characters.');
    }

    try {
      const tagData: AddTagRequest = {
        name: sanitizedTagName,
      };

      const response = await systemeCommon.makeRequestWithAuth<SystemeTag>(
        context.auth,
        HttpMethod.POST,
        `/contacts/${contactId.trim()}/tags`,
        tagData
      );

      return {
        success: true,
        tag: response,
        message: `Tag "${sanitizedTagName}" successfully added to contact "${contactId}"`,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error(`Contact with ID "${contactId}" not found.`);
        }
        if (error.message.includes('409')) {
          return {
            success: false,
            tag: null,
            message: `Tag "${sanitizedTagName}" already exists on contact "${contactId}"`,
            alreadyExists: true,
          };
        }
      }
      throw error;
    }
  },
}); 