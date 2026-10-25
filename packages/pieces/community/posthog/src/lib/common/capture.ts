import { randomUUID } from 'crypto';
import { posthogClient, PostHogAuthValue } from './client';

export async function captureEvent({ auth, event, distinctId, properties, timestamp, uuid }: CaptureParams) {
  const token = await posthogClient.projectToken(auth);
  const eventUuid = uuid ?? randomUUID();
  const eventTimestamp = timestamp ?? new Date().toISOString();
  const body = await posthogClient.ingest({
    auth,
    path: '/i/v0/e/',
    body: { api_key: token, event, distinct_id: distinctId, properties: properties ?? {}, timestamp: eventTimestamp, uuid: eventUuid },
  });
  const status = posthogClient.recordOf(body)['status'];
  return {
    uuid: eventUuid,
    event,
    distinctId,
    timestamp: eventTimestamp,
    status: typeof status === 'string' || typeof status === 'number' ? status : null,
  };
}

type CaptureParams = {
  auth: PostHogAuthValue;
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
  uuid?: string;
};
