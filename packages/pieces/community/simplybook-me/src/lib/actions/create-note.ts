import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient, NoteDto, NoteDtoSchema } from '../common';

export const createNote = createAction({
  auth: simplybookAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Create a new note in SimplyBook.me',
  props: {
    text: Property.LongText({
      displayName: 'Note Text',
      description: 'The content of the note',
      required: true,
    }),
  },
  async run(context) {
    const { text } = context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    const payload: NoteDto = { text };
    const validatedPayload = NoteDtoSchema.parse(payload);

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const note = await client.createNote(validatedPayload);
      return {
        success: true,
        note,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});