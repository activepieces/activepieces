import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas, ReadNoteResponse } from '../common';
import { memProps } from '../common/props';

export const updateNoteAction = createAction({
  auth: memAuth,
  name: 'update_note',
  classification: 'WRITE',
  displayName: 'Update Note',
  description: 'Replace the full content of a note. The first line becomes the new title.',
  audience: 'both',
  aiMetadata: {
    description: 'Replaces the entire Markdown body of a Mem note (not a partial patch); the first line becomes the title. Mem requires the note\'s current version: pass it from Get Note to guard against overwriting concurrent edits, or leave it empty to fetch the current version first. A stale version is rejected. Trashed notes cannot be updated. Repeating the same content leaves the note unchanged apart from its version and updated_at.',
    idempotent: false,
  },
  props: {
    note_id: memProps.noteId({ description: 'The ID of the note to update.' }),
    content: Property.LongText({ displayName: 'Content', description: 'The complete new Markdown body. It replaces the existing content.', required: true }),
    version: Property.Number({ displayName: 'Version', description: 'Current note version from Get Note. Leave empty to fetch it automatically.', required: false }),
    updated_at: Property.DateTime({ displayName: 'Updated At', description: 'Optional last-updated timestamp. Defaults to now.', required: false }),
  },
  outputSchema: memSchemas.note,
  async run(context) {
    const { note_id, content, version, updated_at } = context.propsValue;
    const apiKey = context.auth.secret_text;
    const path = memClient.encodePath`/notes/${note_id}`;
    const currentVersion =
      typeof version === 'number'
        ? version
        : (await memClient.request<ReadNoteResponse>({ apiKey, method: HttpMethod.GET, path })).version;
    return memClient.request<unknown>({
      apiKey,
      method: HttpMethod.PATCH,
      path,
      body: { content, version: currentVersion, ...(updated_at ? { updated_at } : {}) },
    });
  },
});
