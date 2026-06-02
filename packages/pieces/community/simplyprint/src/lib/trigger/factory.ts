import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintSignature } from '../common/signature';

interface StoredWebhook {
  id: number;
  secret: string;
}

interface FactoryOptions<Payload> {
  // Internal snake_case id — never rename after publish (existing user flows
  // are pinned to the trigger by name).
  name: string;
  displayName: string;
  description: string;
  // WebhookEvent string the trigger subscribes to (e.g. 'job.done').
  event: string;
  sampleData: Payload;
}

// Each invocation produces a createTrigger descriptor that:
//  1. onEnable — generates a per-flow secret, calls POST /webhooks/Create
//     with context.webhookUrl, persists {id, secret} in context.store.
//  2. run — verifies the X-SP-Secret header constant-time. Drops on mismatch.
//  3. onDisable — calls POST /webhooks/Delete with the stored id (best-effort).
export function createWebhookEventTrigger<Payload extends object>(
  opts: FactoryOptions<Payload>,
) {
  return createTrigger({
    auth: simplyprintAuth,
    name: opts.name,
    displayName: opts.displayName,
    description: opts.description,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: opts.sampleData,

    async onEnable(context) {
      const secret = simplyprintSignature.generateWebhookSecret();
      const res = await simplyprintClient.simplyprintCall<{ webhook: { id: number } }>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: 'webhooks/Create',
        body: {
          name: `Activepieces: ${opts.displayName}`,
          description: `Per-flow webhook from Activepieces (${opts.name}). Auto-managed — do not edit.`,
          url: context.webhookUrl,
          events: [opts.event],
          secret,
          enabled: true,
        },
      });

      const webhookId = res.webhook?.id;
      if (!webhookId) {
        throw new Error('SimplyPrint did not return a webhook id — event registration failed.');
      }

      await context.store.put<StoredWebhook>('sp_webhook', { id: webhookId, secret });
    },

    async onDisable(context) {
      const stored = await context.store.get<StoredWebhook>('sp_webhook');
      if (!stored?.id) return;

      try {
        await simplyprintClient.simplyprintCall({
          auth: context.auth,
          method: HttpMethod.POST,
          path: 'webhooks/Delete',
          body: { id: stored.id },
        });
      } catch {
        // Webhook may already be gone (revoked app, deleted by user).
      }

      await context.store.delete('sp_webhook');
    },

    async run(context) {
      const stored = await context.store.get<StoredWebhook>('sp_webhook');
      const headers = context.payload.headers as Record<string, string | undefined>;
      const header = simplyprintSignature.extractSecretHeader(headers);

      if (!simplyprintSignature.verifySimplyprintSignature(header, stored?.secret)) {
        // Silent drop — event is forged, stale, or the secret was rotated.
        return [];
      }

      return [context.payload.body];
    },

    // Fetch realistic samples directly from the SimplyPrint backend via
    // GET /webhooks/GetSamplePayload?event=<event>&limit=5. Each entry is
    // byte-identical to a real delivery (only webhook_id is forced to 0).
    // Falls back to the static sample if the call fails so the builder
    // always has something to render.
    async test(context) {
      try {
        const res = await simplyprintClient.simplyprintCall<{ samples?: unknown[] }>({
          auth: context.auth,
          method: HttpMethod.GET,
          path: 'webhooks/GetSamplePayload',
          queryParams: { event: opts.event, limit: '5' },
        });
        const samples = res.samples ?? [];
        if (samples.length > 0) return samples;
      } catch {
        // Endpoint not deployed / scope denied / network — fall through.
      }
      return [opts.sampleData];
    },
  });
}
