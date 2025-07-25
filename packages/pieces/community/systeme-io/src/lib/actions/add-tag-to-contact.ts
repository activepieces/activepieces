import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { systemeIoProps } from '../common/props';

export const addTagToContact = createAction({
  auth: systemeIoAuth,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag to an existing contact - select an existing tag or create a new one',
  props: {
    contactId: systemeIoProps.contactIdDropdown,
    tagSource: Property.StaticDropdown({
      displayName: 'Tag Source',
      description: 'Choose whether to use an existing tag or create a new one',
      required: true,
      defaultValue: 'existing',
      options: {
        disabled: false,
        options: [
          { label: 'Use Existing Tag', value: 'existing' },
          { label: 'Create New Tag', value: 'new' },
        ],
      },
    }),
    existingTagId: Property.Dropdown({
      displayName: 'Existing Tag',
      description: 'Select an existing tag',
      required: false,
      refreshers: ['tagSource'],
      options: async ({ auth, tagSource }) => {
        if (!auth || tagSource !== 'existing') {
          return {
            disabled: true,
            placeholder: tagSource === 'new' ? 'Not needed when creating new tag' : 'Please connect your account first',
            options: [],
          };
        }

        try {
          const response = await systemeIoCommon.getTags({
            auth: auth as string,
          });

          let tags: any[] = [];
          if (Array.isArray(response)) {
            tags = response;
          } else if (response && typeof response === 'object' && response !== null) {
            const responseAny = response as any;
            if (responseAny.items && Array.isArray(responseAny.items)) {
              tags = responseAny.items;
            }
          }

          if (tags.length > 0) {
            return {
              disabled: false,
              options: tags.map((tag: any) => ({
                label: tag.name,
                value: tag.id,
              })),
            };
          }

          return {
            disabled: true,
            placeholder: 'No tags found',
            options: [],
          };
        } catch (error) {
          console.error('Error fetching tags:', error);
          return {
            disabled: true,
            placeholder: 'Error loading tags',
            options: [],
          };
        }
      },
    }),
    newTagName: Property.ShortText({
      displayName: 'New Tag Name',
      description: 'Enter the name for the new tag (only used when "Create New Tag" is selected)',
      required: false,
    }),
  },
  async run(context) {
    const { contactId, tagSource, existingTagId, newTagName } = context.propsValue;
    
    let tagId: string | number;
    let tagCreated = false;

    if (tagSource === 'new') {
      if (!newTagName || newTagName.trim() === '') {
        throw new Error('New Tag Name is required when "Create New Tag" is selected');
      }

      try {
        const newTag = await systemeIoCommon.apiCall<{ id: number }>({
          method: HttpMethod.POST,
          url: '/tags',
          body: {
            name: newTagName.trim(),
          },
          auth: context.auth,
        });
        
        tagId = newTag.id;
        tagCreated = true;
      } catch (error: any) {
        throw new Error(`Failed to create tag: ${error.message}`);
      }
    } else {
      if (!existingTagId) {
        throw new Error('Please select an existing tag when "Use Existing Tag" is selected');
      }
      tagId = existingTagId;
    }

    const response = await systemeIoCommon.apiCall({
      method: HttpMethod.POST,
      url: `/contacts/${contactId}/tags`,
      body: {
        tagId: tagId,
      },
      auth: context.auth,
    });

    return {
      success: true,
      contactId,
      tagId,
      tagCreated,
      tagName: tagSource === 'new' ? newTagName : undefined,
      message: tagCreated 
        ? `New tag "${newTagName}" created and assigned to contact`
        : 'Existing tag successfully assigned to contact',
      response,
    };
  },
});
