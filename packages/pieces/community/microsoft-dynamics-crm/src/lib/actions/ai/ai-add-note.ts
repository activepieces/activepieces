import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { noteOutputSchema } from '../../common/output-schemas';

export const aiAddNoteAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_add_note',
  classification: 'WRITE',
  displayName: 'Add Note',
  description: 'Adds a text note to a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a text note (annotation) to a Dynamics 365 record such as a contact, account, lead or opportunity. Not idempotent: each call adds another note.',
    idempotent: false,
  },
  props: {
    regardingEntitySet: Property.ShortText({
      displayName: 'Regarding Entity Set',
      description: 'Entity set of the record, for example accounts.',
      required: true,
    }),
    regardingRecordId: Property.ShortText({
      displayName: 'Regarding Record ID',
      description: 'GUID of the record.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Title',
      description: 'Optional note title.',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The note body.',
      required: true,
    }),
  },
  outputSchema: noteOutputSchema,
  async run(context) {
    const { regardingEntitySet, regardingRecordId, subject, text } = context.propsValue;
    return await makeClient(context.auth).addNote({
      regardingEntitySet,
      regardingId: regardingRecordId,
      subject,
      text,
    });
  },
});
