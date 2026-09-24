import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { eventTypeOutputSchema } from '../output-schemas';

export const createEventTypeAction = createAction({
  auth: calendlyAuth,
  name: 'create_event_type',
  classification: 'WRITE',
  displayName: 'Create Event Type',
  description: 'Creates a one-on-one event type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new one-on-one (solo) Calendly event type owned by a user (defaults to the connected user). Only one-on-one event types can be created through the API. Returns the new event type with its URI and scheduling URL. Not idempotent: each call creates another event type.',
    idempotent: false,
  },
  outputSchema: eventTypeOutputSchema,
  props: {
    owner: Property.ShortText({
      displayName: 'Owner',
      description: 'User URI or UUID of the host. Leave empty for the connected user.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    ...calendlyCommon.eventTypeFields,
  },
  async run({ auth, propsValue }) {
    const owner = await calendlyCommon.resolveUserUri({ token: auth.secret_text, user: propsValue.owner });
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/event_types',
      body: {
        owner,
        name: propsValue.name,
        ...calendlyCommon.eventTypeBody(propsValue),
      },
    });
    return response.resource;
  },
});
