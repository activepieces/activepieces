import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const updateNote = createAction({
  auth: closeAuth,
  name: 'update_note',
  classification: 'WRITE',
  displayName: 'Update Note',
  description: 'Replace the text of a note in Close.',
  audience: 'ai',
  aiMetadata: {
    description: 'Replaces the text of one existing Close note activity by noteId (acti_..., from Create Note or List Activities with type Note). Only notes can be edited with this tool. Returns the updated note activity.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.activity,
  props: {
    noteId: Property.ShortText({ displayName: 'Note ID', required: true }),
    note: Property.LongText({ displayName: 'Note', required: true }),
  },
  async run({ auth, propsValue }) {
    const noteId = closeClient.closeId({ value: propsValue.noteId, label: 'Note ID', prefix: 'acti' });
    const note = closeClient.requiredText({ value: propsValue.note, label: 'Note' });
    const result = await closeClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/activity/note/${closeClient.pathId(noteId)}/`,
      body: { note },
    });
    return closeMappers.activity(result);
  },
});

export { updateNote };
