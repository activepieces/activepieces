import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { eventTypeOutputSchema } from '../output-schemas';

export const getEventTypeAction = createAction({
  auth: calendlyAuth,
  name: 'get_event_type',
  classification: 'READ',
  displayName: 'Get Event Type',
  description: 'Gets one event type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one Calendly event type by URI or UUID: name, duration and duration options, kind, active flag, locations, custom questions, profile and scheduling URL. Read-only.',
    idempotent: true,
  },
  outputSchema: eventTypeOutputSchema,
  props: {
    eventType: calendlyCommon.eventType,
  },
  async run({ auth, propsValue }) {
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/event_types/${calendlyCommon.toUuid({ value: propsValue.eventType })}`,
    });
    return response.resource;
  },
});
