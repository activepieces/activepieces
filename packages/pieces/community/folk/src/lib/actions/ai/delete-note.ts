import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const deleteNote = createAction({
  auth: folkAuth,
  name: 'delete_note',
  displayName: 'Delete Note',
  description: 'Delete a Folk note.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: folkOutputSchemas.deletedNote,
  aiMetadata: {
    description: 'Permanently deletes one Folk note by ID. Cannot be undone. A second call for the same ID fails with not found.',
    idempotent: false,
  },
  props: {
    noteId: folkAi.idProp({ displayName: 'Note ID', description: 'ID of the note to delete.' }),
  },
  async run(context) {
    const id = folkClient.idSegment({ value: context.propsValue.noteId, label: 'Note ID' });
    return folkAi.deleteRecord({ auth: context.auth, path: `/v1/notes/${id}`, id });
  },
});
