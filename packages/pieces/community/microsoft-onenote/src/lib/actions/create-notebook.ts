import { microsoftOneNoteAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { MicrosoftOneNoteClient } from '../common';

export const createNotebookAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_notebook',
  displayName: 'Create Notebook',
  description: 'Creates a notebook',
  props: {
    displayName: Property.ShortText({
      displayName: 'Notebook Name',
      description: 'The name of the notebook to create',
      required: true,
    }),
  },
  async run(context) {
    const { displayName } = context.propsValue;
    
    const client = new MicrosoftOneNoteClient(context.auth.access_token);
    return await client.createNotebook({ displayName });
  },
}); 