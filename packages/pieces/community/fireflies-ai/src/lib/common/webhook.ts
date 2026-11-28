import { createHmac, timingSafeEqual } from 'crypto';
import { Property, Store } from '@activepieces/pieces-framework';
import { firefliesClient, FirefliesRecord } from './client';
import { firefliesQueries } from './queries';

function parseBody(body: unknown): FirefliesRecord | undefined {
  if (firefliesClient.isRecord(body)) {
    return body;
  }
  if (typeof body === 'string' && body.trim() !== '') {
    try {
      const parsed: unknown = JSON.parse(body);
      return firefliesClient.isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  if (Buffer.isBuffer(body)) {
    return parseBody(body.toString('utf8'));
  }
  return undefined;
}

function stringField(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function parseEvent(body: unknown): FirefliesWebhookEvent | undefined {
  const record = parseBody(body);
  if (!record) {
    return undefined;
  }
  const v2Event = stringField(record['event']);
  const v2MeetingId = stringField(record['meeting_id']);
  if (v2Event && v2MeetingId) {
    return {
      version: 'v2',
      event: v2Event,
      meetingId: v2MeetingId,
      reprocessedAt: stringField(record['reprocessed_at']),
      clientReferenceId: stringField(record['client_reference_id']),
    };
  }
  const v1EventType = stringField(record['eventType']);
  const v1MeetingId = stringField(record['meetingId']);
  if (v1EventType && v1MeetingId && V1_TRANSCRIBED_EVENTS.includes(v1EventType.toLowerCase())) {
    return {
      version: 'v1',
      event: TRANSCRIBED_EVENT,
      meetingId: v1MeetingId,
      reprocessedAt: undefined,
      clientReferenceId: stringField(record['clientReferenceId']),
    };
  }
  return undefined;
}

function readHeader({ headers, name }: { headers: Record<string, unknown> | undefined; name: string }): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (key.toLowerCase() === target) {
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
      }
    }
  }
  return undefined;
}

function rawBodyToBuffer(rawBody: unknown): Buffer | undefined {
  if (typeof rawBody === 'string') {
    return rawBody.length > 0 ? Buffer.from(rawBody, 'utf8') : undefined;
  }
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.length > 0 ? rawBody : undefined;
  }
  return undefined;
}

function verifySignature({ secret, signature, rawBody }: { secret: string; signature: string | undefined; rawBody: unknown }): boolean {
  if (!signature) {
    return false;
  }
  const bodyBuffer = rawBodyToBuffer(rawBody);
  if (!bodyBuffer) {
    return false;
  }
  const hex = signature.trim().replace(/^sha256=/i, '');
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    return false;
  }
  const received = Buffer.from(hex, 'hex');
  const expected = createHmac('sha256', secret).update(bodyBuffer).digest();
  if (received.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(received, expected);
}

function dedupeKey(event: FirefliesWebhookEvent): string {
  return `${event.event}:${event.meetingId}:${event.reprocessedAt ?? ''}`;
}

function pruneSeen({ seen, now }: { seen: SeenDelivery[]; now: number }): SeenDelivery[] {
  return seen.filter((entry) => now - entry.at < DEDUPE_WINDOW_MS).slice(-MAX_SEEN);
}

async function readSeen({ store }: { store: Store }): Promise<SeenDelivery[]> {
  const stored = await store.get<unknown>(SEEN_STORE_KEY);
  if (!Array.isArray(stored)) {
    return [];
  }
  return stored.filter(firefliesClient.isRecord).flatMap((entry) => (typeof entry['key'] === 'string' && typeof entry['at'] === 'number' ? [{ key: entry['key'], at: entry['at'] }] : []));
}

async function handleDelivery({ apiKey, payload, store, signingSecret, targetEvent, now = Date.now() }: HandleDeliveryParams): Promise<FirefliesRecord[]> {
  const secret = typeof signingSecret === 'string' ? signingSecret.trim() : '';
  if (secret !== '') {
    const signature = readHeader({ headers: payload.headers, name: SIGNATURE_HEADER });
    if (!verifySignature({ secret, signature, rawBody: payload.rawBody })) {
      return [];
    }
  }
  const event = parseEvent(payload.body);
  if (!event || event.event !== targetEvent) {
    return [];
  }
  const key = dedupeKey(event);
  const seen = pruneSeen({ seen: await readSeen({ store }), now });
  if (seen.some((entry) => entry.key === key)) {
    return [];
  }
  const data = await firefliesClient.graphql({
    apiKey,
    query: firefliesQueries.getTranscript,
    variables: { transcriptId: event.meetingId },
    operation: `fetch meeting ${event.meetingId} for the ${event.event} webhook`,
  });
  const meeting = firefliesClient.requireEntity({
    data,
    key: 'transcript',
    notFound: `Fireflies sent ${event.event} for meeting "${event.meetingId}", but the API returned no meeting for that ID. The API key's user may not have access to it.`,
  });
  await store.put(SEEN_STORE_KEY, pruneSeen({ seen: [...seen, { key, at: now }], now }));
  return [meeting];
}

async function latestMeetings({ apiKey }: { apiKey: unknown }): Promise<FirefliesRecord[]> {
  const data = await firefliesClient.graphql({
    apiKey,
    query: firefliesQueries.latestTranscripts,
    variables: { limit: 5, skip: 0 },
    operation: 'list the latest meetings',
  });
  return firefliesClient.recordList(data['transcripts']);
}

function signingSecretProp() {
  return Property.ShortText({
    displayName: 'Signing Secret',
    description: 'Optional. The secret you set on the Fireflies Webhooks V2 page. When set, deliveries without a matching X-Hub-Signature are ignored.',
    required: false,
  });
}

function setupInstructions({ eventName }: { eventName: string }): string {
  return `
## Fireflies.ai Webhook Setup

Fireflies has no API for creating webhooks, so add this one by hand:

1. In Fireflies, open **Settings** > **Developer settings** > **Webhooks V2**.
2. Add a webhook with this URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
3. Tick the **${eventName}** event.
4. Optional but recommended: set a signing secret in Fireflies and paste the same value into **Signing Secret** below.
5. Save, then publish this flow.

Webhooks V2 only cover meetings owned by the Fireflies user who adds the webhook. Team-wide webhooks need an Enterprise plan and a Super Admin.

Webhooks that were set up in the old Developer settings webhook field (V1) keep working with this trigger.
`;
}

export const firefliesWebhook = {
  parseBody,
  parseEvent,
  readHeader,
  verifySignature,
  dedupeKey,
  handleDelivery,
  latestMeetings,
  signingSecretProp,
  setupInstructions,
};

export const MEETING_SAMPLE_DATA = {
  id: '01JABCDEF0123456789XYZ',
  dateString: '2026-03-15T14:00:00.000Z',
  privacy: 'teammates',
  speakers: [
    { id: '0', name: 'Alex Rivera' },
    { id: '1', name: 'Sam Lee' },
  ],
  title: 'Weekly sync',
  host_email: 'alex@example.com',
  organizer_email: 'alex@example.com',
  calendar_id: 'abc123calendarevent',
  user: {
    user_id: '01HUSER0000000000000000',
    email: 'alex@example.com',
    name: 'Alex Rivera',
    num_transcripts: 42,
    recent_meeting: '01JABCDEF0123456789XYZ',
    minutes_consumed: 1234.5,
    is_admin: true,
    integrations: ['google_calendar'],
  },
  fireflies_users: ['alex@example.com'],
  participants: ['alex@example.com', 'sam@example.com'],
  date: 1773583200000,
  transcript_url: 'https://app.fireflies.ai/view/01JABCDEF0123456789XYZ',
  audio_url: null,
  video_url: null,
  duration: 31.5,
  meeting_attendees: [
    { displayName: 'Sam Lee', email: 'sam@example.com', phoneNumber: null, name: 'Sam Lee', location: null },
  ],
  summary: {
    keywords: ['roadmap', 'hiring'],
    action_items: '**Alex Rivera**\nShare the Q2 roadmap draft (12:30)',
    outline: 'Roadmap review (00:00 - 15:00)',
    shorthand_bullet: '- Q2 roadmap agreed',
    overview: 'The team reviewed the Q2 roadmap and hiring plan.',
    bullet_gist: '- Roadmap agreed\n- Two roles to open',
    gist: 'Q2 roadmap and hiring review.',
    short_summary: 'Alex and Sam agreed the Q2 roadmap and opened two roles.',
    short_overview: 'Q2 roadmap and hiring.',
    meeting_type: 'Team meeting',
    topics_discussed: ['Q2 roadmap', 'Hiring'],
    transcript_chapters: ['Roadmap', 'Hiring'],
  },
  cal_id: 'alex@example.com',
  calendar_type: 'google',
  meeting_info: { fred_joined: true, silent_meeting: false, summary_status: 'processed' },
  meeting_link: 'https://meet.google.com/abc-defg-hij',
};

export const TRANSCRIBED_EVENT = 'meeting.transcribed';

export const SUMMARIZED_EVENT = 'meeting.summarized';

const V1_TRANSCRIBED_EVENTS = ['transcription completed', 'transcription complete'];

const SIGNATURE_HEADER = 'x-hub-signature';

const SEEN_STORE_KEY = 'fireflies_seen_deliveries';

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

const MAX_SEEN = 500;

export type FirefliesWebhookEvent = {
  version: 'v1' | 'v2';
  event: string;
  meetingId: string;
  reprocessedAt: string | undefined;
  clientReferenceId: string | undefined;
};

export type HandleDeliveryParams = {
  apiKey: unknown;
  payload: { body: unknown; rawBody?: unknown; headers?: Record<string, unknown> };
  store: Store;
  signingSecret: unknown;
  targetEvent: string;
  now?: number;
};

type SeenDelivery = { key: string; at: number };
