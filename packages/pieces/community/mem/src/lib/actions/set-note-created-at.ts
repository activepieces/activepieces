import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const setNoteCreatedAtAction = createAction({
  auth: memAuth,
  name: 'set_note_created_at',
  classification: 'WRITE',
  displayName: 'Set Note Created At',
  description: 'Backdate the visible creation time of a note without changing its content.',
  audience: 'both',
  aiMetadata: {
    description: 'Sets the visible creation timestamp of a Mem note without changing its content. The time must not be in the future and can only move the date earlier than when the note was really created. Trashed notes must be restored first. Idempotent: repeating with the same timestamp leaves the same state.',
    idempotent: true,
  },
  props: {
    note_id: memProps.noteId({ description: 'The ID of the note to backdate.' }),
    created_at: Property.DateTime({ displayName: 'Created At', description: 'New creation time. Must be in the past and earlier than the original creation time.', required: true }),
  },
  outputSchema: memSchemas.note,
  async run(context) {
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: memClient.encodePath`/notes/${context.propsValue.note_id}/created-at`,
      body: { created_at: context.propsValue.created_at },
    });
  },
});
