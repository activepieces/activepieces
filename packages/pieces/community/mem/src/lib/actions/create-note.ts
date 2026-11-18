import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';

export const createNoteAction = createAction({
  auth: memAuth,
  name: 'create_note',
  classification: 'WRITE',
  displayName: 'Create Note',
  description: 'Create a Markdown note in Mem, optionally adding it to existing collections.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a Markdown note in Mem; the first line of content becomes the title. Optionally links it to existing collections given by ID (UUID) or exact title (case-insensitive); titles that match no collection are ignored and no collection is created. Use List Collections or Search Collections to find collection IDs. Not idempotent: each call creates a new note, and a reused Note ID fails with 409.',
    idempotent: false,
  },
  props: {
    content: Property.LongText({
      displayName: 'Content',
      required: true,
      description: 'Markdown content (up to 200,000 characters). The first line becomes the note title.',
    }),
    id: Property.ShortText({
      displayName: 'Note ID',
      required: false,
      description: 'Optional UUID for the new note. Mem returns a 409 conflict if a note with this ID already exists.',
    }),
    add_to_collections: Property.Array({
      displayName: 'Add to Collections',
      required: false,
      description: 'Existing collection IDs or exact collection titles. Titles that match no collection are ignored; collections are not created.',
    }),
    created_at: Property.DateTime({
      displayName: 'Created At',
      required: false,
      description: 'Optional creation timestamp for the note. Defaults to now.',
    }),
  },
  outputSchema: memSchemas.note,
  async run(context) {
    const { content, id, add_to_collections, created_at } = context.propsValue;
    const { collection_ids, collection_titles } = memClient.splitCollections(add_to_collections);
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/notes',
      body: {
        content,
        ...(id ? { id } : {}),
        ...(created_at ? { created_at } : {}),
        ...(collection_ids.length > 0 ? { collection_ids } : {}),
        ...(collection_titles.length > 0 ? { collection_titles } : {}),
      },
    });
  },
});
