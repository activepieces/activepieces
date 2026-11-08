import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { deleteOutputSchema } from '../output-schemas';

export const deleteNote = createAction({
  auth: freshsalesAuth,
  name: 'delete_note',
  displayName: 'Delete Note',
  description: 'Delete a note by its ID',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Freshsales note by numeric ID. A second call for the same ID fails with a not-found error.',
    idempotent: true,
  },
  outputSchema: deleteOutputSchema,
  props: {
    note_id: Property.ShortText({
      displayName: 'Note ID',
      description: 'ID of the note to delete',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({
      value: context.propsValue.note_id,
      field: 'Note ID',
    });
    await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/api/notes/${id}`,
    });
    return { id, deleted: true };
  },
});
