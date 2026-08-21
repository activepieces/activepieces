import { createHmac, timingSafeEqual } from 'crypto';
import {
  createTrigger,
  MarkdownVariant,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from '../common/auth';
import {
  CALL_COMPLETED_EVENT,
  famulorRequest,
  flattenCall,
  flattenWebhookCall,
  unwrapList,
} from '../common/client';

function headerValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | undefined {
  if (!headers) {
    return undefined;
  }
  const expected = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== expected) {
      continue;
    }
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0];
    }
  }
  return undefined;
}

function rawBodyBuffer(rawBody: unknown): Buffer | undefined {
  if (typeof rawBody === 'string') {
    return Buffer.from(rawBody, 'utf8');
  }
  if (Buffer.isBuffer(rawBody)) {
    return rawBody;
  }
  return undefined;
}

function signaturesMatch(expectedHex: string, provided: string): boolean {
  const normalized = provided.trim();
  const candidateHex = normalized.toLowerCase().startsWith('sha256=')
    ? normalized.slice('sha256='.length)
    : normalized;
  const expected = Buffer.from(expectedHex, 'hex');
  const candidate = Buffer.from(candidateHex, 'hex');
  if (expected.length === 0 || expected.length !== candidate.length) {
    return false;
  }
  return timingSafeEqual(expected, candidate);
}

function verifyFamulorSignature(rawBody: Buffer, secret: string, header: string | undefined): void {
  if (!header) {
    throw new Error('Missing X-Famulor-Signature header. Rejecting unsigned webhook.');
  }
  const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!signaturesMatch(expectedHex, header)) {
    throw new Error('Invalid X-Famulor-Signature. HMAC verification failed.');
  }
}

export const phoneCallEnded = createTrigger({
  auth: famulorAuth,
  name: 'phoneCallEnded',
  displayName: 'Phone Call Completed',
  description:
    'Triggers when a workspace webhook delivers call.completed. The payload HMAC is verified with your webhook secret.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires when Famulor delivers a workspace call.completed webhook. The payload HMAC (X-Famulor-Signature over the raw body) is verified; unsigned assistant webhook_url callbacks are rejected.',
  },
  props: {
    setup: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value: `### Workspace webhook (call.completed)

1. Copy this URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
2. In Famulor go to **Settings → Webhooks**
3. Add a workspace webhook for the \`call.completed\` event and paste the URL
4. Paste the **workspace webhook secret** below

Signatures use header \`X-Famulor-Signature\` with value \`sha256=<hex>\` over the **raw body only**. Unsigned assistant \`webhook_url\` callbacks are not accepted.`,
    }),
    webhook_secret: Property.ShortText({
      displayName: 'Webhook secret',
      description:
        'Workspace webhook secret from Settings → Webhooks. Used to verify X-Famulor-Signature.',
      required: true,
    }),
  },
  sampleData: {
    event: CALL_COMPLETED_EVENT,
    id: '9cdfe044-a931-4679-a81f-87d352218f4a',
    assistant_id: 'e95d5309-d1b6-456e-b6bf-3ce99d3bf1b5',
    campaign_id: null,
    phone_number_id: null,
    lead_id: null,
    direction: 'outbound',
    from_number: '+4930123456',
    to_number: '+4915123456789',
    status: 'completed',
    started_at: '2026-08-21T14:18:27.764844+00:00',
    answered_at: '2026-08-21T14:18:29.580603+00:00',
    ended_at: '2026-08-21T14:22:37.378161+00:00',
    duration_sec: 247,
    summary: 'The assistant completed the outbound call.',
    sentiment: 'positive',
    success: null,
    recording_url: null,
    transcript: 'assistant: Hello\nuser: Hi',
    created_at: '2026-08-21T14:18:24.26906+00:00',
    updated_at: '2026-08-21T15:06:11.154281+00:00',
    queued: null,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const secret = context.propsValue.webhook_secret?.trim();
    if (!secret) {
      throw new Error('Webhook secret is required to verify X-Famulor-Signature.');
    }
    await context.store.put('webhook_secret', secret);
  },
  async onDisable(context) {
    await context.store.delete('webhook_secret');
  },
  async run(context) {
    const secret =
      context.propsValue.webhook_secret?.trim() ||
      (await context.store.get<string>('webhook_secret')) ||
      '';
    if (!secret) {
      throw new Error('Webhook secret is missing. Re-enable this trigger after saving the secret.');
    }

    const rawBody = rawBodyBuffer(context.payload.rawBody);
    if (!rawBody) {
      throw new Error('Webhook raw body is missing. Cannot verify X-Famulor-Signature.');
    }

    const signature = headerValue(context.payload.headers, 'x-famulor-signature');
    verifyFamulorSignature(rawBody, secret, signature);

    const payload = (context.payload.body ?? {}) as Record<string, unknown>;
    const event =
      typeof payload['event'] === 'string'
        ? payload['event']
        : typeof payload['type'] === 'string'
          ? payload['type']
          : undefined;
    if (event && event !== CALL_COMPLETED_EVENT) {
      return [];
    }

    return [flattenWebhookCall(payload)];
  },
  async test(context) {
    const body = await famulorRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/calls',
      queryParams: { status: 'completed', limit: '5' },
    });
    return unwrapList(body, ['calls', 'data', 'rows']).map((call) => ({
      event: CALL_COMPLETED_EVENT,
      ...flattenCall(call),
    }));
  },
});
