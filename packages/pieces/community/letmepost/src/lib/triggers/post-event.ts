import {
  createTrigger,
  DEDUPE_KEY_PROPERTY,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { letmepostAuth } from '../common/auth';
import { LetmepostApiError, letmepostClient } from '../common/client';
import { postEventOutputSchema } from '../common/output-schemas';

function isValidSignature({ secret, rawBody, signature }: { secret: string; rawBody: string; signature: string }): boolean {
  const presented = signature.startsWith('sha256=')
    ? signature.slice('sha256='.length)
    : signature;
  const expected = createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');
  if (presented.length !== expected.length || !/^[0-9a-fA-F]+$/.test(presented)) {
    return false;
  }
  return timingSafeEqual(Buffer.from(presented, 'hex'), Buffer.from(expected, 'hex'));
}

function headerOf({ headers, name }: { headers: unknown; name: string }): string | undefined {
  if (!letmepostClient.isRecord(headers)) return undefined;
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = match?.[1];
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' ? value : undefined;
}

function parseBody(body: unknown): Record<string, unknown> | undefined {
  if (letmepostClient.isRecord(body)) return body;
  if (typeof body !== 'string') return undefined;
  try {
    const parsed: unknown = JSON.parse(body);
    return letmepostClient.isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function seenSlotKey(eventId: string): string {
  const slot = createHash('sha256').update(eventId, 'utf8').digest().readUInt32BE(0) % SEEN_EVENT_SLOTS;
  return `${SEEN_EVENT_KEY_PREFIX}${slot}`;
}

async function alreadySeen({ store, eventId }: { store: EventStore; eventId: string }): Promise<boolean> {
  const key = seenSlotKey(eventId);
  if ((await store.get<string>(key)) === eventId) {
    return true;
  }
  await store.put(key, eventId);
  return false;
}

const ENDPOINT_STORE_KEY = 'letmepost_webhook_endpoint_id';
const SECRET_STORE_KEY = 'letmepost_webhook_signing_secret';
const SEEN_EVENT_KEY_PREFIX = 'letmepost_webhook_seen_event_';
const SEEN_EVENT_SLOTS = 500;

export const postEvent = createTrigger({
  auth: letmepostAuth,
  name: 'post_event',
  classification: 'READ',
  displayName: 'Post Event',
  description:
    'Triggers instantly when a post changes state (published, failed, rejected, and more), or on account, quota and billing events',
  aiMetadata: {
    description:
      'Fires the moment letmepost sends a webhook event, once per event id even when letmepost retries the delivery. Emits the event envelope: id, type (e.g. post.published, post.failed), createdAt, organizationId and the event-specific data. Subscribe to specific events or leave the selection empty to receive all of them, including token, quota, subscription and billing events.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Which events to listen for. Leave empty to receive all events, including subscription, quota and billing events.',
      required: false,
      options: {
        options: [
          { label: 'Post queued', value: 'post.queued' },
          { label: 'Post validated', value: 'post.validated' },
          { label: 'Post published', value: 'post.published' },
          { label: 'Post rejected', value: 'post.rejected' },
          { label: 'Post failed', value: 'post.failed' },
          { label: 'Post canceled', value: 'post.canceled' },
          { label: 'Post rescheduled', value: 'post.rescheduled' },
          { label: 'Token expiring', value: 'token.expiring' },
          { label: 'Token revoked', value: 'token.revoked' },
          { label: 'Version deprecated', value: 'version.deprecated' },
          { label: 'Subscription activated', value: 'subscription.activated' },
          { label: 'Subscription cancelled', value: 'subscription.cancelled' },
          { label: 'Subscription tier changed', value: 'subscription.tier_changed' },
          { label: 'Quota warning', value: 'quota.warning' },
          { label: 'Quota exceeded', value: 'quota.exceeded' },
          { label: 'Billing payment failed', value: 'billing.payment_failed' },
          { label: 'Billing delinquent', value: 'billing.delinquent' },
          { label: 'Billing recovered', value: 'billing.recovered' },
        ],
      },
    }),
  },
  sampleData: {
    id: 'f4d4bdaa-73ba-44a2-b43e-7d94ac361656',
    type: 'post.published',
    createdAt: '2026-11-05T03:53:46.968Z',
    organizationId: '01a1a99e-7b48-735a-ac2a-2b941f6f20dd',
    data: {
      id: '01a1a9d7-60c8-7ea2-b31a-664284782ea6',
      platform: 'bluesky',
      accountId: '01a1a9b1-b550-7713-afba-7a1ade80a71e',
      profileId: '01a1a9ae-5ffe-7a21-b253-0bfa111b40c7',
      uri: 'at://did:plc:tlyswolfq55qzht6qzglh3dd/app.bsky.feed.post/3m4xkq7bnvc2a',
      cid: 'bafyreihq5v3n7kq2tq5wlmz3kxq6c4ygq4m2n7dhv2w3tq6xw5p3jz4yfu',
      publishedAt: '2026-11-05T03:53:46.958Z',
      warnings: [],
    },
  },
  outputSchema: postEventOutputSchema,
  async onEnable(context) {
    const response = await letmepostClient.request<{
      id?: unknown;
      signingSecret?: unknown;
    }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/webhook-endpoints',
      body: {
        url: context.webhookUrl,
        events: context.propsValue.events ?? [],
        description: 'Activepieces',
      },
      redactBody: true,
      operation: 'register the webhook endpoint',
    });
    const endpointId = letmepostClient.optionalText(response?.id);
    const signingSecret = letmepostClient.optionalText(response?.signingSecret);
    if (endpointId === undefined) {
      throw new Error('letmepost registered the webhook but returned no endpoint id. Remove the Activepieces endpoint in the letmepost dashboard and try again.');
    }

    try {
      if (signingSecret === undefined) {
        throw new Error('letmepost returned no webhook signing secret, so deliveries could not be verified.');
      }
      await context.store.put(ENDPOINT_STORE_KEY, endpointId);
      await context.store.put(SECRET_STORE_KEY, signingSecret);
    } catch (error) {
      const cleanupError = await letmepostClient
        .request<unknown>({
          auth: context.auth,
          method: HttpMethod.DELETE,
          path: `/v1/webhook-endpoints/${letmepostClient.segment({ value: endpointId, label: 'Webhook endpoint ID' })}`,
          operation: 'remove the webhook endpoint',
        })
        .then(() => undefined, (cleanup: unknown) => cleanup);
      if (cleanupError !== undefined) {
        console.error(`letmepost: could not remove webhook endpoint ${endpointId} after a failed enable; remove it in the letmepost dashboard.`, cleanupError);
        if (error instanceof Error) {
          error.message = `${error.message} The webhook endpoint ${endpointId} could not be removed automatically; delete it in the letmepost dashboard.`;
        }
      }
      throw error;
    }
  },
  async onDisable(context) {
    const endpointId = await context.store.get<string>(ENDPOINT_STORE_KEY);
    if (endpointId) {
      try {
        await letmepostClient.request<unknown>({
          auth: context.auth,
          method: HttpMethod.DELETE,
          path: `/v1/webhook-endpoints/${letmepostClient.segment({ value: endpointId, label: 'Webhook endpoint ID' })}`,
          operation: 'remove the webhook endpoint',
        });
      } catch (error) {
        if (!(error instanceof LetmepostApiError && error.status === 404)) {
          throw error;
        }
      }
      await context.store.delete(ENDPOINT_STORE_KEY);
      await context.store.delete(SECRET_STORE_KEY);
    }
  },
  async run(context) {
    const secret = await context.store.get<string>(SECRET_STORE_KEY);
    const headers = context.payload.headers ?? {};
    const signature = headerOf({ headers, name: 'x-letmepost-signature' });
    const rawBody = context.payload.rawBody;

    if (
      !secret ||
      typeof rawBody !== 'string' ||
      signature === undefined ||
      !isValidSignature({ secret, rawBody, signature })
    ) {
      return [];
    }
    const event = parseBody(context.payload.body) ?? parseBody(rawBody);
    if (event === undefined) {
      return [];
    }
    const eventType = typeof event['type'] === 'string' ? event['type'] : undefined;
    const events = context.propsValue.events;
    if (events && events.length > 0) {
      if (eventType === undefined || !events.includes(eventType)) {
        return [];
      }
    }
    const eventId = headerOf({ headers, name: 'x-letmepost-event-id' }) ?? letmepostClient.optionalText(event['id']);
    if (eventId === undefined) {
      return [event];
    }
    if (await alreadySeen({ store: context.store, eventId })) {
      return [];
    }
    return [{ ...event, [DEDUPE_KEY_PROPERTY]: eventId }];
  },
});

type EventStore = {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<T>;
};
