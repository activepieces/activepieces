import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const moveNoteAction = createAction({
  auth: memAuth,
  name: 'move_note',
  classification: 'WRITE',
  displayName: 'Move Note',
  description: 'Move a note from one collection to another.',
  audience: 'both',
  aiMetadata: {
    description: 'Moves a Mem note from a source collection to a target collection: adds it to the target, then removes it from the source. Note and collection content are unchanged.',
    idempotent: false,
  },
  props: {
    source_collection_id: memProps.collectionDropdown({ displayName: 'Source Collection', description: 'The collection that currently contains the note.', required: true }),
    target_collection_id: memProps.collectionDropdown({ displayName: 'Target Collection', description: 'The collection to move the note to.', required: true }),
    note_id: memProps.noteId({ description: 'The ID of the note to move.' }),
  },
  outputSchema: memSchemas.requestId,
  async run(context) {
    const { source_collection_id, target_collection_id, note_id } = context.propsValue;
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: memClient.encodePath`/collections/${source_collection_id}/notes/${note_id}/move`,
      body: { target_collection_id },
    });
  },
});
