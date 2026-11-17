import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const restoreNoteAction = createAction({
  auth: memAuth,
  name: 'restore_note',
  classification: 'WRITE',
  displayName: 'Restore Note',
  description: 'Bring a note back from the trash.',
  audience: 'both',
  aiMetadata: {
    description: 'Restores a Mem note from the trash by ID; Get Note then shows trashed_at as null and the note can be updated again. Use after Trash Note to undo the removal. Does not work for notes removed with Delete Note, which are permanent. Idempotent: restoring a note that is not in the trash succeeds and leaves it restored.',
    idempotent: true,
  },
  props: {
    note_id: memProps.noteId({ description: 'The ID of the trashed note to restore.' }),
  },
  outputSchema: memSchemas.requestId,
  async run(context) {
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: memClient.encodePath`/notes/${context.propsValue.note_id}/restore`,
    });
  },
});
