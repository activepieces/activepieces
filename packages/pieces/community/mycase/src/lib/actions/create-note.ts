import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createNoteAction = createAction({
  auth: mycaseAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Creates a new note',
  props: {
    content: Property.LongText({ displayName: 'Content', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createNote({ content: context.propsValue.content });
  },
});

