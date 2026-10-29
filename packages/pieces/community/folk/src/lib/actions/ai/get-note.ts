import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const getNote = createAction({
  auth: folkAuth,
  name: 'get_note',
  displayName: 'Get Note',
  description: 'Get one Folk note by ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: folkOutputSchemas.note,
  aiMetadata: {
    description: 'Returns one Folk note by ID: content, visibility, the record it belongs to, author and parent note. Read-only.',
    idempotent: true,
  },
  props: {
    noteId: folkAi.idProp({ displayName: 'Note ID', description: 'ID of the note.' }),
  },
  async run(context) {
    return folkClient.getData<Record<string, unknown>>({
      auth: context.auth,
      path: `/v1/notes/${folkClient.idSegment({ value: context.propsValue.noteId, label: 'Note ID' })}`,
    });
  },
});
