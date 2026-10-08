import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calendlyAuth } from '../auth';
import { calendlyCommon, CalendlyCollection, CalendlyRecord } from '../common';
import { userBusyTimesOutputSchema } from '../output-schemas';

export const listUserBusyTimesAction = createAction({
  auth: calendlyAuth,
  name: 'list_user_busy_times',
  classification: 'SEARCH',
  displayName: 'List User Busy Times',
  description: "Lists a user's busy time blocks.",
  audience: 'ai',
  aiMetadata: {
    description:
      "List a Calendly user's busy intervals between Start Time and End Time (at most 7 days apart, End Time in the future; a past Start Time is moved to now), in ascending order. Includes Calendly bookings and events from connected calendars that have conflict checking on. Each item has type (calendly or external), start_time and end_time. Defaults to the connected user. Not paginated. Read-only.",
    idempotent: true,
  },
  outputSchema: userBusyTimesOutputSchema,
  props: {
    user: calendlyCommon.user,
    startTime: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    endTime: Property.DateTime({
      displayName: 'End Time',
      description: 'At most 7 days after Start Time.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const window = calendlyCommon.validateTimeWindow({
      startTime: propsValue.startTime,
      endTime: propsValue.endTime,
      maxDays: 7,
    });
    const user = await calendlyCommon.resolveUserUri({ token: auth.secret_text, user: propsValue.user });
    const response = await calendlyCommon.calendlyRequest<CalendlyCollection<CalendlyRecord>>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: '/user_busy_times',
      queryParams: { user, ...window },
    });
    return { items: response.collection, count: response.collection.length };
  },
});
