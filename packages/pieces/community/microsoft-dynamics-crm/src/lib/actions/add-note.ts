import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMCommon, makeClient } from '../common';
import { odata } from '../common/odata';
import { noteOutputSchema } from '../common/output-schemas';

export const addNoteAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'add_note',
  classification: 'WRITE',
  displayName: 'Add Note',
  description: 'Adds a note, optionally with a file attachment, to a record such as a contact, account, lead or opportunity.',
  audience: 'human',
  aiMetadata: {
    description: 'Adds a note (annotation) to a Dynamics 365 record. Each call adds a new note.',
    idempotent: false,
  },
  props: {
    entityType: DynamicsCRMCommon.entityType('The table of the record the note belongs to. The table must have notes enabled.'),
    recordId: DynamicsCRMCommon.recordId,
    subject: Property.ShortText({ displayName: 'Title', required: false }),
    text: Property.LongText({ displayName: 'Text', required: false }),
    file: Property.File({ displayName: 'Attachment', required: false }),
  },
  outputSchema: noteOutputSchema,
  async run(context) {
    const { entityType, recordId, subject, text, file } = context.propsValue;
    const attachment = odata.readFile(file);
    if (!subject && !text && !attachment) {
      throw new Error('Set a title, text or attachment for the note.');
    }
    return await makeClient(context.auth).addNote({
      regardingEntitySet: entityType,
      regardingId: recordId,
      subject,
      text,
      file: attachment,
    });
  },
});
