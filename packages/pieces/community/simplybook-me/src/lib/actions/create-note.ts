import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const createNoteAction = createAction({
  auth: simplyBookAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Create a generic note in the system',
  props: {
    title: Property.ShortText({
      displayName: 'Note Title',
      description: 'Title of the note',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Note Content',
      description: 'Content of the note',
      required: true,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Category for the note',
      required: false,
    }),
    isImportant: Property.Checkbox({
      displayName: 'Important',
      description: 'Mark this note as important',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { title, content, category, isImportant } = context.propsValue;
    
    const params = {
      title: title,
      content: content,
      ...(category && { category }),
      is_important: isImportant || false,
    };

    return await makeApiRequest(context.auth, 'addNote', params);
  },
});
