import { createAction, OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';

const { recordOf, str, num, arrayOf } = posthogClient;

function recording(raw: unknown) {
  const r = recordOf(raw);
  const person = recordOf(r['person']);
  return {
    id: str(r['id']),
    distinctId: str(r['distinct_id']),
    personId: str(person['uuid']) ?? str(person['id']),
    personEmail: str(recordOf(person['properties'])['email']),
    startTime: str(r['start_time']),
    endTime: str(r['end_time']),
    durationSeconds: num(r['recording_duration']),
    activeSeconds: num(r['active_seconds']),
    clickCount: num(r['click_count']),
    startUrl: str(r['start_url']),
    viewed: r['viewed'] === true,
  };
}

const recordingsSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Recordings',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Recording ID', description: 'Session ID; open /project/{projectId}/replay/{id} in PostHog to watch.' },
        { key: 'distinctId', label: 'Distinct ID' },
        { key: 'personId', label: 'Person ID' },
        { key: 'personEmail', label: 'Person Email', format: 'email' },
        { key: 'startTime', label: 'Start', format: 'datetime' },
        { key: 'endTime', label: 'End', format: 'datetime' },
        { key: 'durationSeconds', label: 'Duration (s)', format: 'number' },
        { key: 'activeSeconds', label: 'Active (s)', format: 'number' },
        { key: 'clickCount', label: 'Clicks', format: 'number' },
        { key: 'startUrl', label: 'Start URL', format: 'url' },
        { key: 'viewed', label: 'Viewed', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Returned', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextOffset', label: 'Next Offset', format: 'number', description: 'Pass as offset to get the next page; null when there is none.' },
  ] satisfies OutputSchemaField[],
};

export const listSessionRecordings = createAction({
  auth: posthogAuth,
  name: 'list_session_recordings',
  classification: 'SEARCH',
  displayName: 'List Session Recordings',
  description: 'List session replay recordings, optionally for one person.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists PostHog session replay recordings, newest first, optionally only for one person (personId = person UUID from Get Person) and after dateFrom (ISO 8601 or relative like -7d; PostHog default is the last 3 days). Returns minimal metadata per recording: id, distinctId, person, start/end time, duration and active seconds, click count, start URL, viewed. No replay content. hasMore/nextOffset for paging (limit 1-50). Read-only.',
    idempotent: true,
  },
  outputSchema: recordingsSchema,
  props: {
    personId: Property.ShortText({ displayName: 'Person ID', description: 'Person UUID', required: false }),
    dateFrom: Property.ShortText({ displayName: 'From', description: 'ISO 8601 or relative, e.g. -7d', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1-50, default 20', required: false, defaultValue: 20 }),
    offset: Property.Number({ displayName: 'Offset', description: 'Use nextOffset from the previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = posthogClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 50, fallback: 20 });
    const offset = posthogClient.parseInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: 100_000, fallback: 0 });
    const personId = posthogClient.uuid({ value: propsValue.personId, label: 'Person ID' });
    const rawFrom = posthogClient.optionalText(propsValue.dateFrom);
    const dateFrom = rawFrom === undefined || /^-\d+[hdwmy]$/.test(rawFrom) ? rawFrom : posthogClient.isoTimestamp({ value: rawFrom, label: 'From' });
    const body = recordOf(
      await posthogClient.request({
        auth: auth.props,
        method: HttpMethod.GET,
        path: posthogClient.projectPath({ auth: auth.props, segments: ['session_recordings'] }),
        query: { limit, offset, person_uuid: personId, date_from: dateFrom },
      }),
    );
    const items = arrayOf(body['results']).slice(0, limit).map(recording);
    const hasMore = body['has_next'] === true;
    return { items, count: items.length, hasMore, nextOffset: hasMore ? offset + items.length : null };
  },
});
