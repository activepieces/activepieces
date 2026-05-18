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

export const xeroNewContact = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is added to Xero (via Xero webhooks). Configure the webhook in Xero Developer portal to point to this URL.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
To use this trigger, manually configure a Xero webhook for your app:

1. Go to Xero Developer > My Apps > [Your App] > Webhooks.
2. Select the Contact category.
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
    fetch_full_contact: Property.Checkbox({
      displayName: 'Fetch Full Contact',
      description: 'If enabled, fetches the full contact from Xero using the Resource URL.',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {
    ContactID: '717f2bfc-c6d4-41fd-b238-3f2f0c0cf777',
    Name: 'Sample Contact',
    EmailAddress: 'sample@example.com',
  },
  async onEnable(context: any) {
    // Nothing to register programmatically. User must configure webhook in Xero Developer portal.
  },
  async onDisable(context: any) {
    // Nothing to clean up programmatically.
  },
  async run(context: any) {
    const { webhook_key, tenant_id, fetch_full_contact } = context.propsValue as any;

    const signatureHeader = context.payload.headers['x-xero-signature'] as string | undefined;
    const rawBody = context.payload.rawBody as string | undefined;

    if (!signatureHeader || !rawBody) {
      return [];
    }

    // Verify HMAC-SHA256 signature (base64)
    const computed = createHmac('sha256', webhook_key).update(rawBody).digest('base64');
    if (computed !== signatureHeader) {
      return [];
    }

    const body = context.payload.body as any;
    const events: any[] = body?.events ?? [];
    if (!Array.isArray(events) || events.length === 0) {
      // Intent to receive or empty payload
      return [];
    }

    // Filter to CONTACT CREATE events, optionally by tenant
    const filtered = events.filter((e) => {
      const isContact = e.eventCategory === 'CONTACT';
      const isCreate = e.eventType === 'CREATE';
      const tenantOk = tenant_id ? e.tenantId === tenant_id : true;
      return isContact && isCreate && tenantOk;
    });

    if (filtered.length === 0) {
      return [];
    }

    if (!fetch_full_contact) {
      return filtered;
    }

    // Fetch full contact for each event (best-effort)
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
          const contact = resp.body?.Contacts?.[0] ?? resp.body;
          results.push(contact);
        } else {
          results.push(ev);
        }
      } catch {
        results.push(ev);
      }
    }

    return results;
  },
});


