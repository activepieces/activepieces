import crypto from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  DEDUPE_KEY_PROPERTY,
  TriggerHookContext,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { AdaptlyPostApiError, adaptlyPostClient } from './client';
import { AdaptlyPostWebhookPayload } from './types';

const STORE_KEY = 'adaptlypost_webhook';

type WebhookState = { id: string; secret: string };

type WebhookContext = TriggerHookContext<
  typeof adaptlyPostAuth,
  Record<string, never>,
  TriggerStrategy.WEBHOOK
>;

function verifySignature({
  secret,
  timestamp,
  signature,
  rawBody,
}: {
  secret: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: unknown;
}): boolean {
  if (!secret || !timestamp || !signature?.startsWith('sha256=')) return false;
  const body =
    typeof rawBody === 'string'
      ? rawBody
      : Buffer.isBuffer(rawBody)
      ? rawBody.toString('utf8')
      : undefined;
  if (body === undefined) return false;
  const received = Buffer.from(signature.slice('sha256='.length), 'hex');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`, 'utf8')
    .digest();
  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}

function hooks<Output>({
  events,
  toOutput,
}: {
  events: string[];
  toOutput: (payload: AdaptlyPostWebhookPayload) => Output | undefined;
}) {
  return {
    async onEnable(context: WebhookContext) {
      const created = await adaptlyPostClient.request<{
        id: string;
        secret: string;
      }>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/webhooks',
        body: { url: context.webhookUrl, events },
      });
      await context.store.put<WebhookState>(STORE_KEY, {
        id: created.id,
        secret: created.secret,
      });
    },
    async onDisable(context: WebhookContext) {
      const state = await context.store.get<WebhookState>(STORE_KEY);
      if (!state) return;
      try {
        await adaptlyPostClient.request({
          apiKey: context.auth.secret_text,
          method: HttpMethod.DELETE,
          path: `/webhooks/${encodeURIComponent(state.id)}`,
        });
      } catch (error) {
        if (!(error instanceof AdaptlyPostApiError && error.status === 404))
          throw error;
      }
      await context.store.delete(STORE_KEY);
    },
    async run(context: WebhookContext) {
      const state = await context.store.get<WebhookState>(STORE_KEY);
      const headers = context.payload.headers ?? {};
      const verified = verifySignature({
        secret: state?.secret,
        timestamp: headers['x-adaptly-timestamp'],
        signature: headers['x-adaptly-signature'],
        rawBody: context.payload.rawBody,
      });
      if (!verified) return [];
      const payload = context.payload.body as AdaptlyPostWebhookPayload;
      if (!events.includes(payload.event)) return [];
      const output = toOutput(payload);
      if (output === undefined) return [];
      return [
        { ...output, [DEDUPE_KEY_PROPERTY]: `adaptlypost:${payload.id}` },
      ];
    },
  };
}

function eventFields(payload: AdaptlyPostWebhookPayload) {
  return {
    event: payload.event,
    event_id: payload.id,
    occurred_at: payload.createdAt,
  };
}

export const adaptlyPostWebhook = {
  hooks,
  eventFields,
  verifySignature,
  STORE_KEY,
};
