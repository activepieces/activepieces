import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const getNoteAction = createAction({
  auth: memAuth,
  name: 'get_note',
  classification: 'READ',
  displayName: 'Get Note',
  description: 'Get the full content and details of a note by ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Reads one Mem note by ID and returns its full Markdown content, title, current version, collection IDs, timestamps, attachment metadata and trashed_at (set when the note is in trash). Use before Update Note to get the current version, or after List/Search Notes to read a note in full. Read-only.',
    idempotent: true,
  },
  props: {
    note_id: memProps.noteId({ description: 'The ID of the note to read.' }),
  },
  outputSchema: memSchemas.readNote,
  async run(context) {
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: memClient.encodePath`/notes/${context.propsValue.note_id}`,
    });
  },
});
