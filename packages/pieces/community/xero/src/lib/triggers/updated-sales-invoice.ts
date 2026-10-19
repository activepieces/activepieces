import { Property, TriggerStrategy, WebhookHandshakeStrategy, createTrigger } from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { xeroSamples } from '../common/samples';
import { xeroWebhook } from '../common/trigger-state';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroUpdatedSalesInvoice = createTrigger({
  auth: xeroAuth,
  name: 'xero_updated_sales_invoice',
  classification: 'READ',
  displayName: 'Updated Sales Invoice',
  description: 'Fires when an existing sales invoice (Accounts Receivable) is updated.',
  aiMetadata: {
    description:
      'Fires once per edit of a sales invoice (Type ACCREC) in the connected Xero organisation, delivered by a Xero webhook (INVOICE category, UPDATE events) that you set up on your own Xero app; bills (ACCPAY) are skipped when Fetch Full Invoice is on, and duplicates are dropped. Each item is the full updated invoice, or the raw webhook event when Fetch Full Invoice is off.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookInstructions: Property.MarkDown({ value: xeroWebhook.instructions({ category: 'Invoice' }) }),
    tenant_id: props.tenant_id,
    webhook_key: Property.ShortText({
      displayName: 'Webhook Key',
      description: 'From Xero Developer portal > Your App > Webhooks. Used to verify x-xero-signature.',
      required: true,
    }),
    fetch_full_invoice: Property.Checkbox({
      displayName: 'Fetch Full Invoice',
      description: 'Fetch the full invoice and ensure Type is ACCREC (recommended). If disabled, the output is the raw webhook event and bills are not filtered out.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: xeroOutputSchemas.invoice,
  sampleData: xeroSamples.invoice,
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
      resource: { category: 'INVOICE', path: 'Invoices', eventTypes: ['UPDATE'] },
      fetchFull: context.propsValue.fetch_full_invoice !== false,
      accept: (record) => record['Type'] === 'ACCREC',
    });
  },
});
