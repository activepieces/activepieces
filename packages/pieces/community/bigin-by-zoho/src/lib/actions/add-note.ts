import { createAction } from '@activepieces/pieces-framework';
import { biginAuth } from '../auth';
import { biginAiProps } from '../common/props';
import { getBiginConnection } from '../common/request';
import { biginRecords } from '../common/records';
import { biginOutputSchemas } from '../common/output-schemas';

export const addNote = createAction({
  auth: biginAuth,
  name: 'addNote',
  classification: 'WRITE',
  displayName: 'Add Note',
  description: 'Add a note to a Bigin record.',
  audience: 'both',
  outputSchema: biginOutputSchemas.addNoteResult,
  aiMetadata: {
    description:
      'Adds a note to an existing Bigin record (contact, company, deal, product, task, event or call) by module and record id. Not idempotent: each call adds another note. Returns the new note id.',
    idempotent: false,
  },
  props: {
    module: biginAiProps.module('The module of the record to add the note to.'),
    recordId: biginAiProps.id({ displayName: 'Record ID', description: 'Id of the record to add the note to.', required: true }),
    title: biginAiProps.text({ displayName: 'Note Title', description: 'Optional title of the note.', required: false }),
    content: biginAiProps.longText({ displayName: 'Note Content', description: 'The note text.', required: true }),
  },
  async run(context) {
    const { module, recordId, title, content } = context.propsValue;
    if (content.trim() === '') throw new Error('Note Content must not be empty.');
    return biginRecords.addNote({
      connection: getBiginConnection(context.auth),
      module,
      id: recordId.trim(),
      title: title ?? undefined,
      content,
    });
  },
});
