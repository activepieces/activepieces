import { createAction, Property } from '@activepieces/pieces-framework';
import { productboardAuth } from '../auth';

export const createNote = createAction({
  auth: productboardAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Create a new note in Productboard',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      required: true,
    }),
  },
  async run(context) {
    const response = await fetch('https://api.productboard.com/v1/notes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'note',
          attributes: {
            title: context.propsValue.title,
            content: context.propsValue.content,
          },
        },
      }),
    });

    return await response.json();
  },
});
