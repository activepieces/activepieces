import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const findRelatedNotesAction = createAction({
  auth: memAuth,
  name: 'find_related_notes',
  classification: 'SEARCH',
  displayName: 'Find Related Notes',
  description: 'Find notes semantically related to a given note.',
  audience: 'both',
  aiMetadata: {
    description: 'Finds Mem notes semantically related to the current content of a source note (by note ID), ranked by score. Works on newly created or updated notes. Returns up to 20 results with title, snippet, preview, score and collections. Read-only.',
    idempotent: true,
  },
  props: {
    note_id: memProps.noteId({ description: 'The ID of the source note.' }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum related notes to return, 1 to 20. Defaults to 10.', required: false }),
  },
  outputSchema: memSchemas.relatedNotes,
  async run(context) {
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: memClient.encodePath`/notes/${context.propsValue.note_id}/related-notes`,
      query: memClient.toQuery({ limit: context.propsValue.limit }),
    });
  },
});
