import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const logCall = createAction({
  auth: closeAuth,
  name: 'log_call',
  classification: 'WRITE',
  displayName: 'Log Call',
  description: 'Record a call made outside Close on a lead.',
  audience: 'ai',
  aiMetadata: {
    description: 'Logs a phone call that already happened outside Close as a completed call activity on one lead (leadId, lead_...). It does not place a call. Optional: contactId (cont_...), direction (outbound or inbound), durationSeconds (whole seconds), phone (E.164, e.g. +16505551234), note, activityAt (ISO 8601). Creates a new call activity on every call. Returns the call activity.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.activity,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', required: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      required: false,
      options: { options: [{ label: 'Outbound', value: 'outbound' }, { label: 'Inbound', value: 'inbound' }] },
    }),
    durationSeconds: Property.Number({ displayName: 'Duration (seconds)', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    note: Property.LongText({ displayName: 'Note', required: false }),
    activityAt: Property.DateTime({ displayName: 'Activity At', required: false }),
  },
  async run({ auth, propsValue }) {
    const direction = closeClient.optionalText(propsValue.direction);
    if (direction !== undefined && direction !== 'outbound' && direction !== 'inbound') throw new Error('Direction must be outbound or inbound.');
    const body = {
      lead_id: closeClient.closeId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' }),
      contact_id: closeClient.optionalCloseId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' }),
      status: 'completed',
      direction,
      duration: closeClient.parseInteger({ value: propsValue.durationSeconds, label: 'Duration (seconds)', min: 0, max: 86400 }),
      phone: closeClient.optionalText(propsValue.phone),
      note: closeClient.optionalText(propsValue.note),
      activity_at: closeClient.isoDateTime({ value: propsValue.activityAt, label: 'Activity At' }),
    };
    const result = await closeClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/activity/call/',
      body: Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
    });
    return closeMappers.activity(result);
  },
});

export { logCall };
