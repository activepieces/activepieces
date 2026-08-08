import {
  createTrigger,
  DEDUPE_KEY_PROPERTY,
  TriggerStrategy,
  WebhookHandshakeStrategy,
} from '@activepieces/pieces-framework';

import { ringcentralAuth } from './auth';
import { ringcentralCommon, RingCentralWebhookEvent } from './client';

/**
 * All three triggers are the same machine: mint a WebHook subscription on enable, answer the
 * Validation-Token handshake, tear the subscription down on disable, and filter deliveries. Only
 * the event filters, the accept predicate and the sample payload differ, so those are the inputs.
 */
export function createSubscriptionTrigger<
  T extends { id?: string | number },
>({
  name,
  displayName,
  description,
  eventFilters,
  accept,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  eventFilters: string[];
  /** Keeps a delivery only when it is the event this trigger is about; omit to keep everything. */
  accept?: (body: T) => boolean;
  sampleData: Record<string, unknown>;
}) {
  const subscriptionIdKey = `ringcentral_${name}_subscription_id`;

  return createTrigger({
    auth: ringcentralAuth,
    name,
    displayName,
    description,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    handshakeConfiguration: {
      strategy: WebhookHandshakeStrategy.HEADER_PRESENT,
      paramName: 'validation-token',
    },
    async onHandshake(context) {
      const validationToken = context.payload.headers['validation-token'];
      if (!validationToken) {
        return { status: 400, body: { message: 'Missing Validation-Token header.' } };
      }
      // RingCentral proves the endpoint is ours by demanding its token echoed back in a header.
      return {
        status: 200,
        headers: { 'Validation-Token': validationToken },
      };
    },
    async onEnable(context) {
      const subscriptionId = await ringcentralCommon.createSubscription({
        auth: context.auth,
        webhookUrl: context.webhookUrl,
        eventFilters,
      });
      await context.store.put<string>(subscriptionIdKey, subscriptionId);
    },
    async onDisable(context) {
      const subscriptionId = await context.store.get<string>(subscriptionIdKey);
      if (subscriptionId) {
        try {
          await ringcentralCommon.deleteSubscription({ auth: context.auth, subscriptionId });
        } catch {
          // The subscription may already be gone (expired, blacklisted after failed deliveries, or
          // revoked on RingCentral's side); disabling the flow must not fail over cleanup.
        }
      }
      await context.store.delete(subscriptionIdKey);
    },
    async run(context) {
      const event = (context.payload.body ?? {}) as RingCentralWebhookEvent<T>;

      // RingCentral does not sign deliveries; the only secret a genuine one carries is the
      // subscription id minted at onEnable, which never leaves the server. A POST to the webhook
      // URL without that exact id is not from our subscription, so it is dropped, not trusted.
      const expectedSubscriptionId = await context.store.get<string>(subscriptionIdKey);
      if (!expectedSubscriptionId || event.subscriptionId !== expectedSubscriptionId) {
        return [];
      }

      const body = event.body;
      if (!body || (accept && !accept(body))) {
        return [];
      }

      // No id at all means no safe dedupe key: emitting a constant ('') would silently swallow
      // every later id-less event as a duplicate, so such an event goes through un-keyed instead.
      const dedupeKey = body.id ?? event.uuid;
      if (dedupeKey === undefined || dedupeKey === null || dedupeKey === '') {
        return [body];
      }
      return [{ ...body, [DEDUPE_KEY_PROPERTY]: String(dedupeKey) }];
    },
    sampleData,
  });
}
