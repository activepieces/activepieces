import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { availableSlotsActionOutputSchema } from '../output-schemas';

export const calcomGetAvailableSlots = createAction({
  auth: calcomAuth,
  name: 'calcom_get_available_slots',
  classification: 'SEARCH',
  displayName: 'Get Available Slots',
  description: 'Find bookable time slots for a Cal.com event type within a time range.',
  audience: 'ai',
  outputSchema: availableSlotsActionOutputSchema,
  aiMetadata: {
    description:
      'Returns available start times for an event type between Start and End, accounting for existing bookings and availability. Use before Create Booking to pick a valid start time.',
    idempotent: true,
  },
  props: {
    event_type_id: Property.Number({
      displayName: 'Event Type ID',
      description: 'Get this from List Event Types.',
      required: true,
    }),
    start: Property.ShortText({
      displayName: 'Start',
      description: 'ISO 8601 timestamp for the beginning of the search range.',
      required: true,
    }),
    end: Property.ShortText({
      displayName: 'End',
      description: 'ISO 8601 timestamp for the end of the search range.',
      required: true,
    }),
    time_zone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone the returned slots are expressed in.',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (Minutes)',
      description: 'Only for event types offering multiple possible durations.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { event_type_id, start, end, time_zone, duration } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/slots',
      version: calcomCommon.versions.slots,
      query: {
        eventTypeId: event_type_id,
        start,
        end,
        timeZone: time_zone,
        duration,
      },
    });
  },
});
