import { microsoftOneNoteAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { MicrosoftOneNoteClient } from '../common';

export const createSectionAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_section',
  displayName: 'Create Section',
  description: 'Creates a new section in notebook.',
  props: {
    notebookId: Property.ShortText({
      displayName: 'Notebook ID',
      description: 'The ID of the notebook where the section will be created',
      required: true,
    }),
    displayName: Property.ShortText({
      displayName: 'Section Name',
      description: 'The name of the section to create',
      required: true,
    }),
  },
  async run(context) {
    const { notebookId, displayName } = context.propsValue;
    
    const client = new MicrosoftOneNoteClient(context.auth.access_token);
    return await client.createSection(notebookId, { displayName });
  },
}); 