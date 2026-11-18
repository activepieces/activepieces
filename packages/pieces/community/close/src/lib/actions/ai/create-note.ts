import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const createNote = createAction({
  auth: closeAuth,
  name: 'create_note',
  classification: 'WRITE',
  displayName: 'Create Note',
  description: 'Add a note to a lead in Close.',
  audience: 'ai',
  aiMetadata: {
    description: 'Adds a plain-text note activity to one Close lead (leadId, lead_...). Optional contactId (cont_...) ties it to a contact on that lead; optional activityAt (ISO 8601) backdates it. Creates a new note on every call. Returns the note activity.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.activity,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', required: true }),
    note: Property.LongText({ displayName: 'Note', required: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
    activityAt: Property.DateTime({ displayName: 'Activity At', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = {
      lead_id: closeClient.closeId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' }),
      note: closeClient.requiredText({ value: propsValue.note, label: 'Note' }),
      contact_id: closeClient.optionalCloseId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' }),
      activity_at: closeClient.isoDateTime({ value: propsValue.activityAt, label: 'Activity At' }),
    };
    const result = await closeClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/activity/note/',
      body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
    });
    return closeMappers.activity(result);
  },
});

export { createNote };
