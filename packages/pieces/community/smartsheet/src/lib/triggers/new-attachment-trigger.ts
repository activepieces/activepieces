import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { smartsheetAuth } from '../../index';
import {
  smartsheetCommon,
  SmartsheetWebhook,
  subscribeWebhook,
  enableWebhook,
  unsubscribeWebhook,
  listWebhooks,
  SmartsheetAttachment,
} from '../common';
import crypto from 'crypto';

interface WebhookInformation {
  webhookId: string;
  sharedSecret: string;
  webhookName: string;
}

async function findOrCreateWebhook(
  accessToken: string,
  webhookUrl: string,
  sheetId: string,
  triggerIdentifier: string
): Promise<SmartsheetWebhook> {
  const webhookName = `AP-${triggerIdentifier.slice(-8)}-Sheet${sheetId}`;
  const existingWebhooks = await listWebhooks(accessToken);
  const existingWebhook = existingWebhooks.find(
    (wh) => wh.callbackUrl === webhookUrl && wh.scopeObjectId.toString() === sheetId
  );
  if (existingWebhook) {
    if (existingWebhook.name !== webhookName) {
        console.log(`Found existing webhook ${existingWebhook.id} with current name: "${existingWebhook.name}". Expected based on convention: "${webhookName}". Using found webhook.`);
    }
    if (!existingWebhook.enabled || existingWebhook.status !== 'ENABLED') {
      console.log(`Re-enabling existing webhook: ${existingWebhook.id} (name: ${existingWebhook.name})`);
      return await enableWebhook(accessToken, existingWebhook.id.toString());
    }
    console.log(`Using existing enabled webhook: ${existingWebhook.id} (name: ${existingWebhook.name})`);
    return existingWebhook;
  }
  console.log(`Creating new webhook named "${webhookName}" for sheet ${sheetId}, callback ${webhookUrl}`);
  const newWebhook = await subscribeWebhook(accessToken, webhookUrl, sheetId, webhookName);
  console.log(`Enabling new webhook: ${newWebhook.id}`);
  return await enableWebhook(accessToken, newWebhook.id.toString());
}

async function getAttachmentFullDetails(accessToken: string, sheetId: string, attachmentId: string): Promise<SmartsheetAttachment | null> {
    try {
        const req: HttpRequest = {
            method: HttpMethod.GET,
            url: `${smartsheetCommon.baseUrl}/sheets/${sheetId}/attachments/${attachmentId}`,
            headers: { 'Authorization': `Bearer ${accessToken}` }
        };
        const response = await httpClient.sendRequest<SmartsheetAttachment>(req);
        return response.body;
    } catch (e: any) {
        if (e.response?.status === 404) {
            console.log(`Attachment ${attachmentId} on sheet ${sheetId} not found.`);
            return null;
        }
        console.error(`Error fetching attachment ${attachmentId} from sheet ${sheetId}:`, e);
        throw e;
    }
}

export const newAttachmentTrigger = createTrigger({
  auth: smartsheetAuth,
  name: 'new_attachment_webhook',
  displayName: 'New Attachment Added (Webhook)',
  description: 'Triggers when a new attachment is added to a row or sheet.',
  props: {
    sheet_id: smartsheetCommon.sheet_id,
    fetch_full_details: Property.Checkbox({
        displayName: 'Fetch Full Attachment Data',
        description: 'Retrieve the complete metadata for the new attachment.',
        required: false,
        defaultValue: true,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    sheetId: "12345",
    eventType: "created",
    objectType: "attachment",
    id: 78901, // Attachment ID
    parentId: 67890, // e.g., Row ID if attached to a row
    parentType: "ROW",
    timestamp: "2023-10-28T12:10:00Z",
    userId: 54321,
    attachmentData: { /* ... full attachment data ... */ }
  },

  async onEnable(context) {
    const { sheet_id } = context.propsValue;
    if (!sheet_id) throw new Error('Sheet ID is required.');
    const triggerIdentifier = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);
    const webhook = await findOrCreateWebhook(context.auth as string, context.webhookUrl, sheet_id as string, triggerIdentifier);
    const storeKey = `_smartsheet_wh_${triggerIdentifier}_${sheet_id}`;
    await context.store.put<WebhookInformation>(storeKey, {
      webhookId: webhook.id.toString(),
      sharedSecret: webhook.sharedSecret,
      webhookName: webhook.name,
    });
    console.log(`New Attachment Webhook ${webhook.id} enabled for sheet ${sheet_id}.`);
  },

  async onDisable(context) {
    const { sheet_id } = context.propsValue;
    const triggerIdentifier = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);
    const storeKey = `_smartsheet_wh_${triggerIdentifier}_${sheet_id}`;
    const webhookInfo = await context.store.get<WebhookInformation>(storeKey);
    if (webhookInfo && webhookInfo.webhookId) {
      try {
        await unsubscribeWebhook(context.auth as string, webhookInfo.webhookId);
        console.log(`New Attachment Webhook ${webhookInfo.webhookId} (named: ${webhookInfo.webhookName}) unsubscribed.`);
      } catch (error: any) {
        if (error.response?.status !== 404) console.error(`Error unsubscribing webhook: ${error.message}`);
      }
      await context.store.delete(storeKey);
    }
  },

  async run(context): Promise<unknown[]> {
    const rawBody = context.payload.rawBody;
    const payload = context.payload.body as any;
    const headers = context.payload.headers as Record<string, string | undefined>;
    const { sheet_id, fetch_full_details } = context.propsValue;
    const triggerIdentifier = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);
    const storeKey = `_smartsheet_wh_${triggerIdentifier}_${sheet_id}`;
    const webhookInfo = await context.store.get<WebhookInformation>(storeKey);

    if (!webhookInfo) { console.error(`Webhook info not in store for ${storeKey}.`); return []; }
    if (headers && headers['smartsheet-hook-challenge']) return [];

    const receivedHmac = headers['smartsheet-hmac-sha256'];
    if (webhookInfo.sharedSecret && receivedHmac) {
        let bodyToVerify: string;
        if (typeof rawBody === 'string') bodyToVerify = rawBody;
        else if (rawBody && Buffer.isBuffer(rawBody)) bodyToVerify = rawBody.toString();
        else if (rawBody) bodyToVerify = JSON.stringify(rawBody);
        else bodyToVerify = JSON.stringify(context.payload.body);
        try {
            const hmac = crypto.createHmac('sha256', webhookInfo.sharedSecret);
            hmac.update(bodyToVerify);
            if (hmac.digest('hex').toLowerCase() !== receivedHmac.toLowerCase()) {
                console.warn(`HMAC validation FAILED. Ignoring.`); return [];
            }
            console.log('HMAC signature validated.');
        } catch (e: any) { console.error('HMAC validation error:', e.message); return []; }
    } else if (webhookInfo.sharedSecret) {
        console.warn('HMAC header missing. Ignoring for security.'); return [];
    }

    if (payload.newWebhookStatus || !payload.events || !Array.isArray(payload.events) || payload.events.length === 0) return [];

    const newAttachmentEvents = [];
    for (const event of payload.events) {
        if (event.objectType === 'attachment' && event.eventType === 'created') {
            const eventOutput: any = { ...event, sheetId: payload.scopeObjectId?.toString() };
            if (fetch_full_details && event.id) {
                const objectSheetId = payload.scopeObjectId?.toString();
                if (objectSheetId) {
                    try {
                        eventOutput.attachmentData = await getAttachmentFullDetails(context.auth as string, objectSheetId, event.id.toString());
                    } catch (error: any) {
                        eventOutput.fetchError = error.message;
                    }
                } else {
                     eventOutput.fetchError = 'scopeObjectId missing';
                }
            }
            newAttachmentEvents.push(eventOutput);
        }
    }
    return newAttachmentEvents;
  },
});
