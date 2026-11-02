import { Property, TriggerStrategy, WebhookHandshakeStrategy, createTrigger } from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { xeroSamples } from '../common/samples';
import { xeroWebhook } from '../common/trigger-state';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroNewOrUpdatedContact = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_or_updated_contact',
  classification: 'READ',
  displayName: 'New or Updated Contact',
  description: 'Fires when a contact is created or updated (via Xero webhooks).',
  aiMetadata: {
    description:
      'Fires once per contact creation or edit in the connected Xero organisation, delivered by a Xero webhook (CONTACT category, CREATE and UPDATE events) that you set up on your own Xero app; deliveries are signature-checked and duplicates are dropped. Each item is the full contact, or the raw webhook event when Fetch Full Contact is off. Use New Contact if only creations are wanted.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookInstructions: Property.MarkDown({ value: xeroWebhook.instructions({ category: 'Contact' }) }),
    tenant_id: props.tenant_id,
    webhook_key: Property.ShortText({
      displayName: 'Webhook Key',
      description: 'From Xero Developer portal > Your App > Webhooks. Used to verify x-xero-signature.',
      required: true,
    }),
    fetch_full_contact: Property.Checkbox({
      displayName: 'Fetch Full Contact',
      description: 'If enabled, fetches the full contact from Xero. If disabled, the output is the raw webhook event (resourceId, eventType, eventDateUtc).',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: xeroOutputSchemas.contact,
  sampleData: xeroSamples.contact,
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.HEADER_PRESENT,
    paramName: xeroWebhook.handshakeConfiguration.paramName,
  },
  async onHandshake(context) {
    return xeroWebhook.handshake({ payload: context.payload, webhookKey: context.propsValue.webhook_key });
  },
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return xeroWebhook.processDelivery({
      payload: context.payload,
      webhookKey: context.propsValue.webhook_key,
      tenantId: context.propsValue.tenant_id,
      accessToken: context.auth.access_token,
      store: context.store,
      resource: { category: 'CONTACT', path: 'Contacts', eventTypes: ['CREATE', 'UPDATE'] },
      fetchFull: context.propsValue.fetch_full_contact !== false,
    });
  },
});
