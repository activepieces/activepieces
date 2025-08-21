import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';

export const createTag = createAction({
  auth: evernoteAuth,
  name: 'createTag',
  displayName: 'Create Tag',
  description: 'Create a new tag in Evernote',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to create',
      required: true,
    }),
    parentGuid: Property.ShortText({
      displayName: 'Parent Tag GUID',
      description: 'The GUID of the parent tag (optional)',
      required: false,
    }),
  },

  async run(context) {
    const { name, parentGuid } = context.propsValue;

    try {
      const tagData: any = {
        name: name,
      };
      
      if (parentGuid) {
        tagData.parentGuid = parentGuid;
      }

      const response = await fetch('https://www.evernote.com/edam/tag', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(context.auth as OAuth2PropertyValue).access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create tag: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const createdTag = await response.json();
      return createdTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw new Error(`Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
