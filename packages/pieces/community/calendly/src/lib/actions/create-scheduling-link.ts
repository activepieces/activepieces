import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyRecord } from '../common';
import { schedulingLinkOutputSchema } from '../output-schemas';

export const createSchedulingLinkAction = createAction({
  auth: calendlyAuth,
  name: 'create_scheduling_link',
  classification: 'WRITE',
  displayName: 'Create Single-Use Scheduling Link',
  description: 'Creates a booking link for an event type that works for one booking.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a single-use Calendly booking link for an active event type: the booking_url expires after one meeting is booked. Use it to send one person a private link; use the event type scheduling_url for a reusable link. Not idempotent: each call creates a new link.',
    idempotent: false,
  },
  outputSchema: schedulingLinkOutputSchema,
  props: {
    eventType: calendlyCommon.eventType,
  },
  async run({ auth, propsValue }) {
    const response = await calendlyCommon.calendlyRequest<{ resource: CalendlyRecord }>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/scheduling_links',
      body: {
        max_event_count: 1,
        owner: calendlyCommon.toUri({ resource: 'event_types', value: propsValue.eventType }),
        owner_type: 'EventType',
      },
    });
    return response.resource;
  },
});
