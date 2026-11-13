import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const getEventAttendanceAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_get_event_attendance',
  classification: 'READ',
  displayName: 'Get Event Attendance',
  description: 'Gets who attended the last 10 occurrences of an event.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns attendance for the last 10 occurrences of an event (one for a one-off event): start/end time and attendees with name, email and whether they are a member. For an event that has not happened yet it returns happened=false with no occurrences instead of failing. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    eventId: heartbeatProps.id({ displayName: 'Event ID', description: 'Use List Events to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.eventAttendance,
  async run({ auth, propsValue }) {
    const eventId = heartbeatApi.uuid({ value: propsValue.eventId, label: 'Event ID' });
    try {
      const instances = heartbeatApi.recordList(
        await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: `/events/${eventId}/attendance`, operation: 'get event attendance' }),
      ).map((instance) => ({
        ...instance,
        attendees: Array.isArray(instance['attendees'])
          ? heartbeatApi.recordList(instance['attendees'])
          : heartbeatApi.isRecord(instance['attendees'])
            ? [instance['attendees']]
            : [],
      }));
      return { eventId, happened: true, instances };
    } catch (error) {
      if (heartbeatApi.statusOf(error) === 422 && /not happened/i.test(heartbeatApi.errorMessageOf(error))) {
        return { eventId, happened: false, instances: [] };
      }
      throw error;
    }
  },
});
