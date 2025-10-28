import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { memAuth } from '../../index';

export const deleteNoteAction = createAction({
  auth: memAuth,
  name: 'delete_note',
  displayName: 'Delete Note',
  description: 'Delete a note in Mem by its ID.',
  props: {
    note_id: Property.ShortText({
      displayName: 'Note ID',
      required: true,
      description: 'The ID of the note to delete.',
    }),
  },
  async run(context) {
    const { note_id } = context.propsValue;
    const apiKey = context.auth as string;

    const result = await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/notes/${note_id}`
    );

    return result;
  },
});
