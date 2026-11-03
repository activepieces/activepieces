import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listEventsAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_events',
  classification: 'SEARCH',
  displayName: 'List Events',
  description: 'Lists community events, optionally for one group or a time range.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists community events (ID, name, description, start/end time, recurring flag, invited users and groups), optionally only those for a group ID or starting within a time range. Use to find upcoming events or an event ID. Recurring events show their original start time. totalMatching counts all matches even when the list is cut at the limit. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    groupId: heartbeatProps.id({ displayName: 'Group ID', description: 'Only events assigned to this group. Use List Groups to find the ID.', required: false }),
    startsAfter: Property.DateTime({ displayName: 'Starts After', description: 'Only events whose start time is at or after this time.', required: false }),
    startsBefore: Property.DateTime({ displayName: 'Starts Before', description: 'Only events whose start time is before this time.', required: false }),
    limit: heartbeatProps.limit({ max: 1000, defaultValue: 100 }),
  },
  outputSchema: heartbeatOutputSchemas.eventList,
  async run({ auth, propsValue }) {
    const max = heartbeatApi.limit({ value: propsValue.limit, max: 1000, defaultValue: 100 });
    const after = heartbeatApi.isoDate({ value: propsValue.startsAfter, label: 'Starts After' });
    const before = heartbeatApi.isoDate({ value: propsValue.startsBefore, label: 'Starts Before' });
    if (after !== undefined && before !== undefined && Date.parse(after) >= Date.parse(before)) {
      throw new Error('Starts After must be earlier than Starts Before.');
    }
    const events = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({
        token: auth.secret_text,
        method: HttpMethod.GET,
        path: '/events',
        operation: 'list events',
        query: { groupID: heartbeatApi.optionalUuid({ value: propsValue.groupId, label: 'Group ID' }) },
      }),
    );
    const matching = events.filter((event) => {
      const start = typeof event['startTime'] === 'string' ? Date.parse(event['startTime']) : Number.NaN;
      if (after !== undefined && !(start >= Date.parse(after))) {
        return false;
      }
      if (before !== undefined && !(start < Date.parse(before))) {
        return false;
      }
      return true;
    });
    const page = matching.slice(0, max);
    return { events: page, count: page.length, totalMatching: matching.length, truncated: matching.length > page.length };
  },
});
