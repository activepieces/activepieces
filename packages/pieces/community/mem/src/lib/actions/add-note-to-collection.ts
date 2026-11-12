import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const addNoteToCollectionAction = createAction({
  auth: memAuth,
  name: 'add_note_to_collection',
  classification: 'WRITE',
  displayName: 'Add Note to Collection',
  description: 'Add an existing note to an existing collection.',
  audience: 'both',
  aiMetadata: {
    description: 'Links an existing Mem note to an existing collection without changing either. Set semantics: adding a note that is already in the collection leaves the same membership.',
    idempotent: true,
  },
  props: {
    collection_id: memProps.collectionDropdown({ displayName: 'Collection', description: 'The collection to add the note to.', required: true }),
    note_id: memProps.noteId({ description: 'The ID of the note to add.' }),
  },
  outputSchema: memSchemas.requestId,
  async run(context) {
    const { collection_id, note_id } = context.propsValue;
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: memClient.encodePath`/collections/${collection_id}/notes/${note_id}`,
    });
  },
});
