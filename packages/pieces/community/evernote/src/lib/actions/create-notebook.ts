import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { evernoteAuth } from '../..';

export const createNotebook = createAction({
  auth: evernoteAuth,
  name: 'createNotebook',
  displayName: 'Create Notebook',
  description: 'Create a new notebook in Evernote',
  props: {
    name: Property.ShortText({
      displayName: 'Notebook Name',
      description: 'The name of the notebook to create',
      required: true,
    }),
    stack: Property.ShortText({
      displayName: 'Stack',
      description: 'The stack to place the notebook in (optional)',
      required: false,
    }),
  },

  async run(context) {
    const { name, stack } = context.propsValue;

    try {
      const { Client } = require('evernote');
      const client = new Client({ token: context.auth, sandbox: false });
      const noteStore = client.getNoteStore();
      
      const notebook = new noteStore.constructor.Notebook();
      notebook.name = name;
      if (stack) {
        notebook.stack = stack;
      }

      const createdNotebook = await noteStore.createNotebook(notebook);
      return createdNotebook;
    } catch (error) {
      console.error('Error creating notebook:', error);
      throw new Error(`Failed to create notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
