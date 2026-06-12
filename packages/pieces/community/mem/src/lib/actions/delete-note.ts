import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { memAuth } from '../auth';

export const deleteNoteAction = createAction({
  auth: memAuth,
  name: 'delete_note',
  displayName: 'Delete Note',
  description: 'Delete a note in Mem by its ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a single note in Mem identified by its note ID. Use to remove a note you can address by ID. Destructive and not idempotent: the first call removes the note and a repeat with the same ID will fail because the note no longer exists.',
    idempotent: false,
  },
  props: {
    note_id: Property.ShortText({
      displayName: 'Note ID',
      required: true,
      description: 'The ID of the note to delete.',
    }),
  },
  async run(context) {
    const { note_id } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const result = await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/notes/${note_id}`
    );

    return result;
  },
});
