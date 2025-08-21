import {
  createAction,
  OAuth2PropertyValue,
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
      const notebookData = {
        name: name,
        stack: stack,
      };

      const response = await fetch('https://www.evernote.com/edam/notebook', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(context.auth as OAuth2PropertyValue).access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notebookData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create notebook: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const createdNotebook = await response.json();
      return createdNotebook;
    } catch (error) {
      console.error('Error creating notebook:', error);
      throw new Error(`Failed to create notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
