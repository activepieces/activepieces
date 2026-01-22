import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import { createHmac } from 'crypto';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { props } from '../common/props';


export const xeroUpdatedSalesInvoice = createTrigger({
  auth: xeroAuth,
  name: 'xero_updated_sales_invoice',
  displayName: 'Updated Sales Invoice',
  description: 'Fires when an existing sales invoice (Accounts Receivable) is updated.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
To use this trigger, manually configure a Xero webhook for your app:

1. Go to Xero Developer > My Apps > [Your App] > Webhooks.
2. Select the Invoice category.
3. Set the Delivery URL to:
\n\n\`\`\`text
{{webhookUrl}}
\`\`\`
4. Click Save, then click Validate "Intent to receive".
5. Copy the Webhook Key from the Webhooks page and paste it into the Webhook Key field below.
6. Optionally set Organization ID (Tenant ID) to only accept events from a specific org.

Notes:
- Keep this trigger enabled so the URL remains active.
- We verify Xero's x-xero-signature header using your Webhook Key.
      `,
    }),
    tenant_id: props.tenant_id,
    webhook_key: Property.ShortText({
      displayName: 'Webhook Key',
      description: 'From Xero Developer portal > Your App > Webhooks. Used to verify x-xero-signature.',
      required: true,
    }),
    fetch_full_invoice: Property.Checkbox({
      displayName: 'Fetch Full Invoice',
      description: 'Fetch the full invoice and ensure Type is ACCREC (recommended).',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {
    InvoiceID: '243216c5-369e-4056-ac67-05388f86dc81',
    Type: 'ACCREC',
    InvoiceNumber: 'INV-0001',
    Status: 'AUTHORISED',
  },
  async onEnable(): Promise<void> {
        // The user has already enabled the trigger, so we don't need to do anything
  },
  async onDisable(): Promise<void> {
        // The user has already disabled the trigger, so we don't need to do anything
  },
  async run(context: any) {
    const { webhook_key, tenant_id, fetch_full_invoice } = context.propsValue as any;

    const signatureHeader = context.payload.headers['x-xero-signature'] as string | undefined;
    const rawBody = context.payload.rawBody as string | undefined;
    if (!signatureHeader || !rawBody) {
      return [];
    }

    const computed = createHmac('sha256', webhook_key).update(rawBody).digest('base64');
    if (computed !== signatureHeader) {
      return [];
    }

    const body = context.payload.body as any;
    const events: any[] = body?.events ?? [];
    if (!Array.isArray(events) || events.length === 0) {
      return [];
    }

    // Filter to INVOICE UPDATE events, optional tenant match
    const filtered = events.filter((e) => {
      const isInvoice = e.eventCategory === 'INVOICE';
      const isUpdate = e.eventType === 'UPDATE';
      const tenantOk = tenant_id ? e.tenantId === tenant_id : true;
      return isInvoice && isUpdate && tenantOk;
    });
    if (filtered.length === 0) {
      return [];
    }

    if (!fetch_full_invoice) {
      return filtered;
    }

    const results: any[] = [];
    for (const ev of filtered) {
      try {
        const req: HttpRequest = {
          method: HttpMethod.GET,
          url: ev.resourceUrl,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (context.auth as any).access_token,
          },
          headers: {
            'Xero-Tenant-Id': ev.tenantId,
            Accept: 'application/json',
          },
        };
        const resp = await httpClient.sendRequest<any>(req);
        if (resp.status === 200) {
          const inv = resp.body?.Invoices?.[0] ?? resp.body;
          if (inv?.Type === 'ACCREC') {
            results.push(inv);
          }
        }
      } catch {
        // ignore
      }
    }

    return results;
  },
});


