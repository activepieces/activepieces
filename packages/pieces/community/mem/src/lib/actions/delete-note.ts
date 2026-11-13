import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const deleteNoteAction = createAction({
  auth: memAuth,
  name: 'delete_note',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Note',
  description: 'Permanently delete a note. It cannot be restored; use Trash Note for a recoverable removal.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a single Mem note by ID; a hard-deleted note cannot be restored. Prefer Trash Note when the removal might need to be undone. Destructive and not idempotent: a repeat call with the same ID fails because the note no longer exists.',
    idempotent: false,
  },
  props: {
    note_id: memProps.noteId({ description: 'The ID of the note to delete permanently.' }),
  },
  outputSchema: memSchemas.requestId,
  async run(context) {
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: memClient.encodePath`/notes/${context.propsValue.note_id}`,
    });
  },
});
