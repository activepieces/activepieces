import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const removeNoteFromCollectionAction = createAction({
  auth: memAuth,
  name: 'remove_note_from_collection',
  classification: 'WRITE',
  displayName: 'Remove Note from Collection',
  description: 'Remove a note from a collection. Both the note and the collection are kept.',
  audience: 'both',
  aiMetadata: {
    description: 'Removes the link between a Mem note and a collection; neither the note nor the collection is deleted. Use Move Note to move it to another collection in one step.',
    idempotent: false,
  },
  props: {
    collection_id: memProps.collectionDropdown({ displayName: 'Collection', description: 'The collection to remove the note from.', required: true }),
    note_id: memProps.noteId({ description: 'The ID of the note to remove.' }),
  },
  outputSchema: memSchemas.requestId,
  async run(context) {
    const { collection_id, note_id } = context.propsValue;
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: memClient.encodePath`/collections/${collection_id}/notes/${note_id}`,
    });
  },
});
