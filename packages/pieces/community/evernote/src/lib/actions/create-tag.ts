import {
  createAction,
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
      const { Client } = require('evernote');
      const client = new Client({ token: context.auth, sandbox: false });
      const noteStore = client.getNoteStore();
      
      const tag = new noteStore.constructor.Tag();
      tag.name = name;
      if (parentGuid) {
        tag.parentGuid = parentGuid;
      }

      const createdTag = await noteStore.createTag(tag);
      return createdTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw new Error(`Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
