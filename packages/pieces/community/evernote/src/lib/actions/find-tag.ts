import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';

export const findTag = createAction({
  auth: evernoteAuth,
  name: 'findTag',
  displayName: 'Find Tag',
  description: 'Search for tags in Evernote',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to search for',
      required: true,
    }),
  },

  async run(context) {
    const { name } = context.propsValue;

    try {
      const response = await fetch('https://www.evernote.com/edam/tag', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(context.auth as OAuth2PropertyValue).access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch tags: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const tags = await response.json();
      const matchingTags = tags.filter((tag: any) => 
        tag.name && tag.name.toLowerCase().includes(name.toLowerCase())
      );
      
      return matchingTags;
    } catch (error) {
      console.error('Error searching tags:', error);
      throw new Error(`Failed to search tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
