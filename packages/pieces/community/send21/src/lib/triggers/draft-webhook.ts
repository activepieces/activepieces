import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { send21Auth } from '../auth';
import { authKey, send21Request } from '../common/client';
import { DEFAULT_WEBHOOK_EVENTS, WEBHOOK_EVENTS } from '../common/constants';
import { isHandled, rememberDelivery } from '../common/deliveries';
import { headerValue, verifySignatureV2 } from '../common/signature';

const STORE_KEY = 'send21_webhook';
const DELIVERIES_KEY = 'send21_handled_deliveries';

type StoredWebhook = { id: string; secret: string; url: string };

export const draftWebhook = createTrigger({
  auth: send21Auth,
  name: 'draft_webhook',
  classification: 'READ',
  displayName: 'Payment Event (Webhook)',
  description:
    'Receive signed send21 webhook deliveries. Verifies X-Send21-Signature-V2 (timestamp + delivery id + raw body, 5-minute window), ignores a delivery with a missing or wrong signature, and runs once per X-Send21-Delivery id.',
  aiMetadata: {
    description:
      'Fires once per verified send21 webhook delivery for the selected events, for example draft.confirmed when a payment confirms on-chain. One run is one event for one draft or pay link; check orderId, fiatCurrency and fiatAmount before marking an order paid.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      required: true,
      defaultValue: DEFAULT_WEBHOOK_EVENTS,
      options: { options: WEBHOOK_EVENTS },
    }),
  },
  sampleData: {
    event: 'draft.confirmed',
    deliveryId: '00000000-0000-0000-0000-000000000000',
    data: {
      draftId: '3f6c2a9e-5d1b-4c8e-9a7f-2b4d6e8f0a1c',
      status: 'Confirmed',
      orderId: 'ORDER-1042',
      txId: '5KqZ9bQ...',
    },
  },
  async onEnable(context) {
    const url = context.webhookUrl;
    if (!url || !url.startsWith('https://')) {
      throw new Error(
        'send21 only accepts public HTTPS webhook URLs. Use a public Activepieces host, then publish the flow again.'
      );
    }
    const events = (context.propsValue.events as string[]) ?? DEFAULT_WEBHOOK_EVENTS;
    if (!events.length) throw new Error('Select at least one event.');

    const created = await send21Request<{ id: string; secret?: string }>({
      apiKey: authKey(context.auth),
      method: HttpMethod.POST,
      path: '/webhooks',
      body: { url, events },
    });
    if (!created.id || !created.secret) {
      throw new Error(
        'POST /webhooks did not return an id and signing secret. The secret is shown only once; delete unused endpoints in send21 and publish again.'
      );
    }
    await context.store.put<StoredWebhook>(STORE_KEY, {
      id: created.id,
      secret: created.secret,
      url,
    });
  },
  async onDisable(context) {
    const stored = await context.store.get<StoredWebhook>(STORE_KEY);
    if (!stored?.id) return;
    try {
      await send21Request({
        apiKey: authKey(context.auth),
        method: HttpMethod.DELETE,
        path: `/webhooks/${stored.id}`,
      });
    } catch {
      // Already gone, or the key cannot manage endpoints.
    }
    await context.store.delete(STORE_KEY);
    await context.store.delete(DELIVERIES_KEY);
  },
  async run(context) {
    const stored = await context.store.get<StoredWebhook>(STORE_KEY);
    if (!stored?.secret) {
      throw new Error('No stored signing secret. Disable and re-enable this trigger to register the webhook again.');
    }
    const headers = (context.payload.headers ?? {}) as Record<string, unknown>;
    const signature = headerValue(headers, 'x-send21-signature-v2');
    const deliveryId = headerValue(headers, 'x-send21-delivery');
    const event = headerValue(headers, 'x-send21-event');
    const payload = context.payload as { rawBody?: Buffer | string; body?: unknown };
    const rawBody =
      payload.rawBody ??
      (typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body ?? {}));

    if (!deliveryId || !verifySignatureV2(rawBody, signature, deliveryId, stored.secret)) {
      return [];
    }
    // send21 retries deliveries and does not dedupe them, so run once per delivery id.
    const handled = await context.store.get<string[]>(DELIVERIES_KEY);
    if (isHandled(handled, deliveryId)) {
      return [];
    }
    await context.store.put<string[]>(DELIVERIES_KEY, rememberDelivery(handled, deliveryId));

    const body = (typeof payload.body === 'object' && payload.body !== null ? payload.body : {}) as {
      event?: string;
      data?: unknown;
    };
    return [
      {
        event: event ?? body.event,
        deliveryId,
        data: body.data ?? body,
        payload: body,
      },
    ];
  },
});
