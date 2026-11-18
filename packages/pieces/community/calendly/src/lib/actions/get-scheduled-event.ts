import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { scheduledEventOutputSchema } from '../output-schemas';

export const getScheduledEventAction = createAction({
  auth: calendlyAuth,
  name: 'get_scheduled_event',
  classification: 'READ',
  displayName: 'Get Event',
  description: 'Gets a booked event by its URI or ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get one booked Calendly meeting by URI or UUID: name, status, start and end time, event type, location (join URL for video calls), hosts, invitee counts and cancellation details when canceled. Invitees are not included; use List Event Invitees. Read-only.',
    idempotent: true,
  },
  outputSchema: scheduledEventOutputSchema,
  props: {
    scheduledEvent: calendlyCommon.bookedEvent,
  },
  async run({ auth, propsValue }) {
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/scheduled_events/${calendlyCommon.toUuid({ value: propsValue.scheduledEvent })}`,
    });
    return response.resource;
  },
});
