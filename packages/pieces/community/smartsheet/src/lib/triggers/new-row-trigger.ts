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
  SmartsheetRow,
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
        console.log(`Found existing webhook ${existingWebhook.id} with different name: ${existingWebhook.name}. Expected: ${webhookName}`);
    }
    if (!existingWebhook.enabled || existingWebhook.status !== 'ENABLED') {
      console.log(`Re-enabling existing webhook: ${existingWebhook.id} (current name: ${existingWebhook.name})`);
      return await enableWebhook(accessToken, existingWebhook.id.toString());
    }
    console.log(`Using existing enabled webhook: ${existingWebhook.id} (current name: ${existingWebhook.name})`);
    return existingWebhook;
  }

  console.log(`Creating new webhook named ${webhookName} for sheet ${sheetId}, callback ${webhookUrl}`);
  const newWebhook = await subscribeWebhook(accessToken, webhookUrl, sheetId, webhookName);

  console.log(`Enabling new webhook: ${newWebhook.id}`);
  return await enableWebhook(accessToken, newWebhook.id.toString());
}

async function getSheetRowDetails(accessToken: string, sheetId: string, rowId: string): Promise<SmartsheetRow | null> {
    try {
        const req: HttpRequest = {
            method: HttpMethod.GET,
            url: `${smartsheetCommon.baseUrl}/sheets/${sheetId}/rows/${rowId}`,
            headers: { 'Authorization': `Bearer ${accessToken}` }
        };
        const response = await httpClient.sendRequest<SmartsheetRow>(req);
        return response.body;
    } catch (e: any) {
        if (e.response?.status === 404) {
            console.log(`Row ${rowId} on sheet ${sheetId} not found during detail fetch.`);
            return null;
        }
        console.error(`Error fetching row ${rowId} from sheet ${sheetId}:`, e);
        throw e;
    }
}

export const newRowAddedTrigger = createTrigger({
  auth: smartsheetAuth,
  name: 'new_row_added_webhook',
  displayName: 'New Row Added (Webhook)',
  description: 'Triggers when a new row is added to a Smartsheet.',
  props: {
    sheet_id: smartsheetCommon.sheet_id,
    fetch_full_details: Property.Checkbox({
        displayName: 'Fetch Full Row Data',
        description: 'Retrieve the complete data for the new row.',
        required: false,
        defaultValue: true,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    sheetId: "12345",
    eventType: "created",
    objectType: "row",
    id: 67890, // Row ID
    timestamp: "2023-10-28T12:00:00Z",
    userId: 54321,
    rowData: {
        id: 67890,
        sheetId: 12345,
        rowNumber: 15,
        createdAt: "2023-10-28T12:00:00Z",
        modifiedAt: "2023-10-28T12:00:00Z",
        cells: [
            { columnId: 111, value: "New Task A", displayValue: "New Task A" },
            { columnId: 222, value: "Pending", displayValue: "Pending" }
        ]
    }
  },

  async onEnable(context) {
    const { sheet_id } = context.propsValue;
    if (!sheet_id) throw new Error('Sheet ID is required to enable the webhook.');

    const triggerIdentifier = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);
    const webhook = await findOrCreateWebhook(
        context.auth as string,
        context.webhookUrl,
        sheet_id as string,
        triggerIdentifier
    );

    const storeKey = `_smartsheet_wh_${triggerIdentifier}_${sheet_id}`;
    await context.store.put<WebhookInformation>(storeKey, {
      webhookId: webhook.id.toString(),
      sharedSecret: webhook.sharedSecret,
      webhookName: webhook.name,
    });
    console.log(`Webhook ${webhook.id} enabled and info stored for sheet ${sheet_id}, trigger ${triggerIdentifier}.`);
  },

  async onDisable(context) {
    const { sheet_id } = context.propsValue;
    const triggerIdentifier = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);
    const storeKey = `_smartsheet_wh_${triggerIdentifier}_${sheet_id}`;
    const webhookInfo = await context.store.get<WebhookInformation>(storeKey);

    if (webhookInfo && webhookInfo.webhookId) {
      try {
        await unsubscribeWebhook(context.auth as string, webhookInfo.webhookId);
        console.log(`Webhook ${webhookInfo.webhookId} (named: ${webhookInfo.webhookName}) for sheet ${sheet_id} unsubscribed.`);
      } catch (error: any) {
        if (error.response?.status !== 404) {
            console.error(`Error unsubscribing webhook ${webhookInfo.webhookId}: ${error.message}`);
        }
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

    if (!webhookInfo) {
        console.error(`Webhook info not in store for key ${storeKey}. Cannot validate/process event.`);
        return [];
    }

    if (headers && headers['smartsheet-hook-challenge']) {
      console.log(`Received Smartsheet webhook challenge: ${headers['smartsheet-hook-challenge']}. Acknowledging.`);
      return [];
    }

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
            const calculatedHmac = hmac.digest('hex');
            if (calculatedHmac.toLowerCase() !== receivedHmac.toLowerCase()) {
                console.warn(`HMAC validation FAILED. Webhook call ignored.`);
                return [];
            }
            console.log('HMAC signature validated successfully.');
        } catch (e: any) {
            console.error('Error during HMAC validation:', e.message);
            return [];
        }
    } else if (webhookInfo.sharedSecret) {
        console.warn('HMAC header missing. Webhook call ignored for security.');
        return [];
    }

    if (payload.newWebhookStatus) {
        console.log(`Status change callback received: ${payload.newWebhookStatus}. Ignored.`);
        return [];
    }
    if (!payload.events || !Array.isArray(payload.events) || payload.events.length === 0) {
      console.log('No valid events array in payload.');
      return [];
    }

    const newRowEvents = [];
    for (const event of payload.events) {
        if (event.objectType === 'row' && event.eventType === 'created') {
            const eventOutput: any = { ...event, sheetId: payload.scopeObjectId?.toString() };
            if (fetch_full_details && event.id) {
                const objectSheetId = payload.scopeObjectId?.toString();
                if (objectSheetId) {
                    try {
                        eventOutput.rowData = await getSheetRowDetails(context.auth as string, objectSheetId, event.id.toString());
                    } catch (error: any) {
                        console.warn(`Failed to fetch full details for new row ID ${event.id}: ${error.message}`);
                        eventOutput.fetchError = error.message;
                    }
                } else {
                    eventOutput.fetchError = 'scopeObjectId missing, cannot fetch row details.';
                }
            }
            newRowEvents.push(eventOutput);
        }
    }
    return newRowEvents;
  },
});
