import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callsyncAuth } from '../auth';
import { callsyncApiCall, flatten, withoutBlanks } from '../common/client';
import { contactDropdown } from '../common/props';

export const addNote = createAction({
  auth: callsyncAuth,
  name: 'add_note',
  classification: 'WRITE',
  displayName: 'Add Note to Contact',
  description: 'Adds an entry, such as a note or site visit, to a contact\'s timeline in CallSync.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add an activity entry (note, call, email, meeting, follow-up or site visit) with a title and optional details to one CallSync contact\'s timeline. Each call adds a new entry, so retries duplicate.',
    idempotent: false,
  },
  props: {
    contact: contactDropdown({ required: true }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      defaultValue: 'NOTE',
      options: {
        options: [
          { label: 'Note', value: 'NOTE' },
          { label: 'Call', value: 'CALL' },
          { label: 'Email', value: 'EMAIL' },
          { label: 'Follow Up', value: 'FOLLOW_UP' },
          { label: 'Meeting', value: 'MEETING' },
          { label: 'Site Visit', value: 'SITE_VISIT' },
        ],
      },
    }),
    title: Property.ShortText({ displayName: 'Title', required: true }),
    description: Property.LongText({ displayName: 'Details', required: false }),
  },
  async run(context) {
    const { contact, ...fields } = context.propsValue;
    const response = await callsyncApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: 'crm/activities',
      body: withoutBlanks({ ...fields, person_id: contact }),
    });
    return flatten(response.data);
  },
});
