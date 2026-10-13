import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon, systemeIoInput } from '../common/client';
import { systemeIoProps } from '../common/props';
import { systemeIoAuthTagOptions } from '../common/dropdowns';
import { addTagToContactActionOutputSchema } from '../output-schemas';

export const addTagToContact = createAction({
  auth: systemeIoAuth,
  name: 'addTagToContact',
  classification: 'WRITE',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag to an existing contact - select an existing tag or create a new one',
  audience: 'human',
  aiMetadata: { description: 'Assigns a tag to an existing Systeme.io contact, identified by contact id. Operates in two modes: reference an existing tag by id, or create a brand-new tag by name and then assign it. Use to label or segment a known contact; assigning an existing tag is effectively idempotent, but the create-new-tag mode creates a fresh tag on each call, so this is not idempotent overall.', idempotent: false },
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
      auth: systemeIoAuth,
      displayName: 'Existing Tag',
      description: 'Select an existing tag',
      required: false,
      refreshers: ['tagSource'],
      refreshOnSearch: true,
      options: async ({ auth, tagSource }, ctx) => {
        if (!auth || tagSource !== 'existing') {
          return {
            disabled: true,
            placeholder: tagSource === 'new' ? 'Not needed when creating new tag' : 'Please connect your account first',
            options: [],
          };
        }

        return systemeIoAuthTagOptions({ apiKey: auth.secret_text, searchValue: ctx?.searchValue });
      },
    }),
    newTagName: Property.ShortText({
      displayName: 'New Tag Name',
      description: 'Enter the name for the new tag (only used when "Create New Tag" is selected)',
      required: false,
    }),
  },
  outputSchema: addTagToContactActionOutputSchema,
  async run(context) {
    const { contactId, tagSource, existingTagId, newTagName } = context.propsValue;
    const contact = systemeIoInput.requireId({ value: contactId, name: 'Contact ID' });
    
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
          auth: context.auth.secret_text,
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
      url: `/contacts/${contact}/tags`,
      body: {
        tagId: tagId,
      },
      auth: context.auth.secret_text,
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
