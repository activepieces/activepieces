import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { salesloftAuth } from '../auth';
import { cleanPayload, salesloftRequest } from '../common/client';

export const createNoteAction = createAction({
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Create a note associated with a person or account in Salesloft.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a note attached to a Salesloft person or account, depending on the chosen associated record type. Use to log context against a contact or company. Requires note content plus the record type and the numeric ID of the target record. Not idempotent — each call appends a new note.',
    idempotent: false,
  },
  auth: salesloftAuth,
  props: {
    content: Property.LongText({
      displayName: 'Content',
      description: 'The body content of the note.',
      required: true,
    }),
    associated_type: Property.StaticDropdown({
      displayName: 'Associated Record Type',
      description: 'Whether this note is linked to a person or an account.',
      required: true,
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Account', value: 'account' },
        ],
      },
    }),
    associated_id: Property.Number({
      displayName: 'Associated Record ID',
      description: 'The numeric ID of the person or account to attach this note to.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body = cleanPayload({
      content: propsValue.content,
      associated_with_type: propsValue.associated_type,
      associated_with_id: propsValue.associated_id,
    });

    return salesloftRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/notes',
      body,
    });
  },
});
