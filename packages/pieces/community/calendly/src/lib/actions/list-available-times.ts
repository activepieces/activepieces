import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { availableTimesOutputSchema } from '../output-schemas';

export const listAvailableTimesAction = createAction({
  auth: calendlyAuth,
  name: 'list_available_times',
  classification: 'SEARCH',
  displayName: 'List Available Times',
  description: 'Lists the open booking slots of an event type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the open start times of one Calendly event type between Start Time and End Time (at most 31 days apart, End Time in the future; a past Start Time is moved to now). Each slot has start_time, invitees_remaining and a scheduling_url that books that slot. Use it to answer "when is X free" or before sending someone a time. Not paginated. Read-only.',
    idempotent: true,
  },
  outputSchema: availableTimesOutputSchema,
  props: {
    eventType: calendlyCommon.eventType,
    startTime: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    endTime: Property.DateTime({
      displayName: 'End Time',
      description: 'At most 31 days after Start Time.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const window = calendlyCommon.validateTimeWindow({
      startTime: propsValue.startTime,
      endTime: propsValue.endTime,
      maxDays: 31,
    });
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/event_type_available_times',
      queryParams: {
        event_type: calendlyCommon.toUri({ resource: 'event_types', value: propsValue.eventType }),
        ...window,
      },
    });
    return { items: response.collection, count: response.collection.length };
  },
});
