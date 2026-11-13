import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatEvents } from '../common/events';

export const getEventAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_get_event',
  classification: 'READ',
  displayName: 'Get Event',
  description: 'Gets one event, optionally with the dates of all its occurrences.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns one event by ID with name, description, start/end time, recurring flag, creator, invited users and groups; with Include Occurrences it also lists every occurrence of a recurring event. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    eventId: heartbeatProps.id({ displayName: 'Event ID', description: 'Use List Events to find the ID.', required: true }),
    includeInstances: Property.Checkbox({ displayName: 'Include Occurrences', description: 'Also list the start and end time of each occurrence (for recurring events).', required: false, defaultValue: false }),
  },
  outputSchema: heartbeatOutputSchemas.eventWithInstances,
  async run({ auth, propsValue }) {
    const eventId = heartbeatApi.uuid({ value: propsValue.eventId, label: 'Event ID' });
    const event = await heartbeatEvents.getEvent({ token: auth.secret_text, eventId });
    if (propsValue.includeInstances !== true) {
      return event;
    }
    const instances = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: `/events/${eventId}/instances`, operation: 'list event occurrences' }),
    );
    return { ...event, instances };
  },
});
