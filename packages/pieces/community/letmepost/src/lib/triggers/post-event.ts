import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { letmepostAuth } from '../common/auth';
import { letmepostApiCall } from '../common';

const ENDPOINT_STORE_KEY = 'letmepost_webhook_endpoint_id';
const SECRET_STORE_KEY = 'letmepost_webhook_signing_secret';

function isValidSignature(
  secret: string,
  rawBody: string,
  signature: string
): boolean {
  const presented = signature.startsWith('sha256=')
    ? signature.slice('sha256='.length)
    : signature;
  const expected = createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');
  if (presented.length !== expected.length) {
    return false;
  }
  try {
    return timingSafeEqual(
      Buffer.from(presented, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

export const postEvent = createTrigger({
  auth: letmepostAuth,
  name: 'post_event',
  displayName: 'Post Event',
  description:
    'Triggers instantly when a post changes state (published, failed, rejected, and more)',
  aiMetadata: {
    description:
      'Fires the moment a post changes state, delivered over a registered webhook rather than polling. Emits the event envelope: id, type (e.g. post.published, post.failed), createdAt, and the event-specific data. Subscribe to specific lifecycle events or leave the selection empty to receive all of them.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Which events to listen for. Leave empty to receive all events.',
      required: true,
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
        ],
      },
    }),
  },
  sampleData: {
    id: '3bb21953-33c4-47f9-9401-7323e84ee6e0',
    type: 'post.published',
    createdAt: '2026-06-19T10:29:47.790Z',
    organizationId: '019edf51-a4fd-7e45-95f2-d104b470d962',
    data: {
      postId: '00000000-0000-0000-0000-000000000000',
      platform: 'bluesky',
      status: 'published',
      text: 'Test webhook from letmepost.dev',
      publishedAt: '2026-06-19T09:58:52.423Z',
      platformUri: 'at://did:plc:test/app.bsky.feed.post/test',
    },
  },
  async onEnable(context) {
    const response = await letmepostApiCall<{
      id: string;
      signingSecret: string;
    }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/webhook-endpoints',
      body: {
        url: context.webhookUrl,
        events: context.propsValue.events ?? [],
        description: 'Activepieces',
      },
    });

    try {
      await context.store.put(ENDPOINT_STORE_KEY, response.body.id);
      await context.store.put(SECRET_STORE_KEY, response.body.signingSecret);
    } catch (error) {
      await letmepostApiCall<Record<string, unknown>>({
        auth: context.auth,
        method: HttpMethod.DELETE,
        path: `/v1/webhook-endpoints/${response.body.id}`,
      });
      throw error;
    }
  },
  async onDisable(context) {
    const endpointId = await context.store.get<string>(ENDPOINT_STORE_KEY);
    if (endpointId) {
      await letmepostApiCall<Record<string, unknown>>({
        auth: context.auth,
        method: HttpMethod.DELETE,
        path: `/v1/webhook-endpoints/${endpointId}`,
      });
    }
  },
  async run(context) {
    const body = context.payload.body as any;
    const secret = await context.store.get<string>(SECRET_STORE_KEY);
    const headers = context.payload.headers ?? {};
    const signature =
      headers['x-letmepost-signature'] ?? headers['X-Letmepost-Signature'];
    const rawBody = context.payload.rawBody;

    if (
      !secret ||
      typeof rawBody !== 'string' ||
      typeof signature !== 'string' ||
      !isValidSignature(secret, rawBody, signature)
    ) {
      return [];
    }
    const events = context.propsValue.events;
    if (events && events.length > 0) {
      const eventType = body?.type;
      if (!eventType || !events.includes(eventType)) {
        return [];
      }
    }
    return [context.payload.body];
  },
});
