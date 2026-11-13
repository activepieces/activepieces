import { randomUUID } from 'crypto';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';

const MAX_EVENTS = 1000;

const batchOutputSchema = {
  fields: [
    { key: 'count', label: 'Events Sent', format: 'number' },
    {
      key: 'events',
      label: 'Events',
      labelKey: 'event',
      listItems: [
        { key: 'uuid', label: 'Event UUID', description: 'Send again with this UUID to retry without creating a duplicate.' },
        { key: 'event', label: 'Event' },
        { key: 'distinctId', label: 'Distinct ID' },
        { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
      ],
    },
    { key: 'status', label: 'Ingestion Status' },
  ],
} satisfies OutputSchema;

function parseEvents(value: unknown): unknown[] {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error('Events must be a JSON array of event objects.');
    }
  }
  if (posthogClient.isRecord(parsed) && Array.isArray(parsed['events'])) parsed = parsed['events'];
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Events must be a non-empty array of event objects.');
  if (parsed.length > MAX_EVENTS) throw new Error(`Events can hold at most ${MAX_EVENTS} items per call.`);
  return parsed;
}

function toEvent({ raw, index }: { raw: unknown; index: number }) {
  const label = `Event #${index + 1}`;
  if (!posthogClient.isRecord(raw)) throw new Error(`${label} must be an object with event and distinctId.`);
  const event = posthogClient.requiredText({ value: raw['event'], label: `${label} event` });
  const distinctId = posthogClient.requiredText({ value: raw['distinctId'] ?? raw['distinct_id'], label: `${label} distinctId` });
  const properties = posthogClient.plainObject({ value: raw['properties'], label: `${label} properties` }) ?? {};
  const timestamp = posthogClient.isoTimestamp({ value: raw['timestamp'], label: `${label} timestamp` }) ?? new Date().toISOString();
  const uuid = posthogClient.uuid({ value: raw['uuid'], label: `${label} uuid` }) ?? randomUUID();
  return { event, distinctId, properties, timestamp, uuid };
}

export const captureEventsBatch = createAction({
  auth: posthogAuth,
  name: 'capture_events_batch',
  classification: 'WRITE',
  displayName: 'Capture Events (Batch)',
  description: 'Send several events to PostHog in one request.',
  audience: 'ai',
  aiMetadata: {
    description: 'Captures up to 1000 PostHog events in one request. events is an array of objects {event, distinctId, properties?, timestamp? (ISO 8601, default now), uuid?}. Each event without a uuid gets a new one; the returned uuids can be passed back on retry so PostHog deduplicates them instead of recording duplicates. Ingestion is asynchronous (events appear within seconds). The whole batch is validated before sending; one bad item fails the call with its position.',
    idempotent: false,
  },
  outputSchema: batchOutputSchema,
  props: {
    events: Property.Json({
      displayName: 'Events',
      description: 'Array of {"event": "signed_up", "distinctId": "user-1", "properties": {...}, "timestamp": "...", "uuid": "..."}.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const events = parseEvents(propsValue.events).map((raw, index) => toEvent({ raw, index }));
    const token = await posthogClient.projectToken(auth.props);
    const body = await posthogClient.ingest({
      auth: auth.props,
      path: '/batch/',
      body: {
        api_key: token,
        batch: events.map((e) => ({ event: e.event, distinct_id: e.distinctId, properties: e.properties, timestamp: e.timestamp, uuid: e.uuid })),
      },
    });
    const status = posthogClient.recordOf(body)['status'];
    return {
      count: events.length,
      events: events.map((e) => ({ uuid: e.uuid, event: e.event, distinctId: e.distinctId, timestamp: e.timestamp })),
      status: typeof status === 'string' || typeof status === 'number' ? status : null,
    };
  },
});
