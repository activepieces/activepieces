import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const trashNoteAction = createAction({
  auth: memAuth,
  name: 'trash_note',
  classification: 'DESTRUCTIVE',
  displayName: 'Trash Note',
  description: 'Move a note to the trash. It can be brought back with Restore Note.',
  audience: 'both',
  aiMetadata: {
    description: 'Moves a Mem note to the trash (recoverable with Restore Note); Get Note then shows trashed_at. Prefer this over Delete Note when the removal may need to be undone. Trashed notes cannot be updated until restored with Restore Note. Idempotent: trashing a note that is already in the trash succeeds and leaves it trashed.',
    idempotent: true,
  },
  props: {
    note_id: memProps.noteId({ description: 'The ID of the note to move to the trash.' }),
  },
  outputSchema: memSchemas.requestId,
  async run(context) {
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: memClient.encodePath`/notes/${context.propsValue.note_id}/trash`,
    });
  },
});
