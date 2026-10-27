import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { freshsalesProps } from '../common/props';
import { noteOutputSchema } from '../output-schemas';

export const addNote = createAction({
  auth: freshsalesAuth,
  name: 'add_note',
  displayName: 'Add Note',
  description: 'Add a note to a contact, account or deal',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a text note to a Freshsales contact, account or deal (Related To + Related Record ID). Returns the note with its ID. Not idempotent: each call adds another note.',
    idempotent: false,
  },
  outputSchema: noteOutputSchema,
  props: {
    description: Property.LongText({
      displayName: 'Note',
      description: 'Text of the note',
      required: true,
    }),
    targetable_type: freshsalesProps.targetableType({ required: true }),
    targetable_id: freshsalesProps.targetableId({ required: true }),
  },
  async run(context) {
    const note = {
      description: context.propsValue.description,
      targetable_type: context.propsValue.targetable_type,
      targetable_id: freshsalesClient.requireId({
        value: context.propsValue.targetable_id,
        field: 'Related Record ID',
      }),
    };
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/notes',
      body: { note },
    });
    return freshsalesRecords.shapeTargetable(
      freshsalesClient.unwrap({ body: response, key: 'note' })
    );
  },
});
