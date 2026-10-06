import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { eventTypeAvailabilityOutputSchema } from '../output-schemas';

export const getEventTypeAvailabilityAction = createAction({
  auth: calendlyAuth,
  name: 'get_event_type_availability',
  classification: 'READ',
  displayName: 'Get Event Type Availability',
  description: 'Gets the availability schedule of an event type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the weekly availability schedule of one Calendly event type: timezone and rules (per weekday or per date, each with from/to intervals). Call this before Update Event Type Availability, because an update replaces every rule. Read-only.',
    idempotent: true,
  },
  outputSchema: eventTypeAvailabilityOutputSchema,
  props: {
    eventType: calendlyCommon.eventType,
  },
  async run({ auth, propsValue }) {
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/event_type_availability_schedules',
      queryParams: {
        event_type: calendlyCommon.toUri({ resource: 'event_types', value: propsValue.eventType }),
      },
    });
    return { items: response.collection, count: response.collection.length };
  },
});
