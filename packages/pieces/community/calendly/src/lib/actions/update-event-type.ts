import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { eventTypeOutputSchema } from '../output-schemas';

export const updateEventTypeAction = createAction({
  auth: calendlyAuth,
  name: 'update_event_type',
  classification: 'WRITE',
  displayName: 'Update Event Type',
  description: 'Updates a one-on-one event type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update a one-on-one (solo) Calendly event type: name, duration, description, color, active status or locations. Only the fields you set are changed, except Locations, which replaces the whole location list when set. Group, collective and round-robin event types cannot be updated through the API.',
    idempotent: true,
  },
  outputSchema: eventTypeOutputSchema,
  props: {
    eventType: calendlyCommon.eventType,
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    ...calendlyCommon.eventTypeFields,
  },
  async run({ auth, propsValue }) {
    const body = {
      ...(calendlyCommon.isProvided(propsValue.name) ? { name: propsValue.name } : {}),
      ...calendlyCommon.eventTypeBody(propsValue),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/event_types/${calendlyCommon.toUuid({ value: propsValue.eventType })}`,
      body,
    });
    return response.resource;
  },
});
