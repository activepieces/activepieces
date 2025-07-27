import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { systemeIoProps } from '../common/props';

export const removeTagFromContact = createAction({
  auth: systemeIoAuth,
  name: 'removeTagFromContact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove a tag that is currently assigned to an existing contact',
  props: {
    contactId: systemeIoProps.contactIdDropdown,
    tagId: Property.Dropdown({
      displayName: 'Tag to Remove',
      description: 'Select a tag currently assigned to this contact',
      required: true,
      refreshers: ['contactId'],
      options: async ({ auth, contactId }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }

        if (!contactId) {
          return {
            disabled: true,
            placeholder: 'Please select a contact first',
            options: [],
          };
        }

        try {
          const contact = await systemeIoCommon.getContact({
            contactId: contactId as string,
            auth: auth as string,
          });

          let contactTags: any[] = [];
          if (contact && typeof contact === 'object' && (contact as any).tags) {
            contactTags = (contact as any).tags;
          }

          if (contactTags.length > 0) {
            return {
              disabled: false,
              options: contactTags.map((tag: any) => ({
                label: tag.name,
                value: tag.id,
              })),
            };
          }

          return {
            disabled: true,
            placeholder: 'This contact has no tags to remove',
            options: [],
          };
        } catch (error) {
          console.error('Error fetching contact tags:', error);
          return {
            disabled: true,
            placeholder: 'Error loading contact tags',
            options: [],
          };
        }
      },
    }),
  },
  async run(context) {
    const { contactId, tagId } = context.propsValue;
    
    let tagName = 'Unknown Tag';
    try {
      const contact = await systemeIoCommon.getContact({
        contactId: contactId as string,
        auth: context.auth,
      });

      if (contact && typeof contact === 'object' && (contact as any).tags) {
        const contactTags = (contact as any).tags;
        const foundTag = contactTags.find((tag: any) => tag.id == tagId);
        if (foundTag) {
          tagName = foundTag.name;
        }
      }
    } catch (error) {
      console.warn('Could not fetch contact details for tag name:', error);
    }

    const response = await systemeIoCommon.apiCall({
      method: HttpMethod.DELETE,
      url: `/contacts/${contactId}/tags/${tagId}`,
      auth: context.auth,
    });

    return {
      success: true,
      contactId,
      tagId,
      tagName,
      message: `Tag "${tagName}" successfully removed from contact`,
      response,
    };
  },
});
