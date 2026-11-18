import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { noteOutputSchema } from '../output-schemas';

export const updateNote = createAction({
  auth: freshsalesAuth,
  name: 'update_note',
  displayName: 'Update Note',
  description: 'Change the text of an existing note',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the text of an existing Freshsales note by numeric note ID (the ID returned by Add Note). Idempotent: repeating the call with the same text gives the same result.',
    idempotent: true,
  },
  outputSchema: noteOutputSchema,
  props: {
    note_id: Property.ShortText({
      displayName: 'Note ID',
      description: 'ID of the note to update',
      placeholder: '16000123456',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Note',
      description: 'New text of the note',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({ value: context.propsValue.note_id, field: 'Note ID' });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/api/notes/${id}`,
      body: { note: { description: context.propsValue.description } },
    });
    return freshsalesRecords.shapeTargetable(
      freshsalesClient.unwrap({ body: response, key: 'note' })
    );
  },
});
