import {
  createAction,
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
      const { Client } = require('evernote');
      const client = new Client({ token: context.auth, sandbox: false });
      const noteStore = client.getNoteStore();
      
      const tags = await noteStore.listTags();
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
