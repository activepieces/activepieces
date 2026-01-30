import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calComApiCall } from '../common';

export const getAvailableSlots = createAction({
  auth: calcomAuth,
  name: 'get_available_slots',
  displayName: 'Get Available Slots',
  description: 'Get available time slots for an event type',
  props: {
    eventTypeId: Property.Number({
      displayName: 'Event Type ID',
      description: 'The ID of the event type to check availability for',
      required: true,
    }),
    startTime: Property.DateTime({
      displayName: 'Start Time',
      description: 'Start of the time range to check (UTC)',
      required: true,
    }),
    endTime: Property.DateTime({
      displayName: 'End Time',
      description: 'End of the time range to check (UTC)',
      required: true,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'Timezone for the slots (e.g., Europe/Madrid, America/New_York)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { eventTypeId, startTime, endTime, timeZone } = propsValue;

    const queryParams: Record<string, string> = {
      eventTypeId: eventTypeId.toString(),
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString(),
    };

    if (timeZone) {
      queryParams['timeZone'] = timeZone;
    }

    const response = await calComApiCall<{
      status: string;
      data: unknown;
    }>(auth.secret_text, HttpMethod.GET, '/slots', undefined, queryParams);

    return response;
  },
});
