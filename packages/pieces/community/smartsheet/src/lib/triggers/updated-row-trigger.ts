import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../../index';
import {
	smartsheetCommon,
	findOrCreateWebhook,
	WebhookInformation,
	getSheetRowDetails,
	verifyWebhookSignature,
	unsubscribeWebhook,
} from '../common';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

const TRIGGER_KEY = 'smartsheet_updated_row_trigger';

export const updatedRowTrigger = createTrigger({
	auth: smartsheetAuth,
	name: 'updated_row',
	displayName: 'Row Updated',
	description: 'Triggers when an existing row is updated.',
	props: {
		sheet_id: smartsheetCommon.sheet_id(),
	},
	type: TriggerStrategy.WEBHOOK,
	sampleData: {
		sheetId: '12345',
		eventType: 'updated',
		objectType: 'row',
		id: 67890,
		columnId: 333,
		timestamp: '2023-10-28T12:05:00Z',
		userId: 54321,
		rowData: {
			/* ... full row data ... */
		},
	},
	handshakeConfiguration: {
		strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
		paramName: 'challenge',
	},
	async onHandshake(context) {
		return {
			status: 200,
			body: {
				smartsheetHookResponse: (context.payload.body as any)['challenge'],
			},
		};
	},
	async onEnable(context) {
		const { sheet_id } = context.propsValue;
		if (!sheet_id) throw new Error('Sheet ID is required.');

		const triggerIdentifier = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);
		const webhook = await findOrCreateWebhook(
			context.auth as string,
			context.webhookUrl,
			sheet_id as string,
			triggerIdentifier,
		);

		await context.store.put<WebhookInformation>(TRIGGER_KEY, {
			webhookId: webhook.id.toString(),
			sharedSecret: webhook.sharedSecret,
			webhookName: webhook.name,
		});
	},

	async onDisable(context) {
		const webhookInfo = await context.store.get<WebhookInformation>(TRIGGER_KEY);

		if (webhookInfo && webhookInfo.webhookId) {
			try {
				await unsubscribeWebhook(context.auth as string, webhookInfo.webhookId);
			} catch (error: any) {
				if (error.response?.status !== 404) {
					console.error(`Error unsubscribing webhook ${webhookInfo.webhookId}: ${error.message}`);
				}
			}
			await context.store.delete(TRIGGER_KEY);
		}
	},

	async run(context): Promise<unknown[]> {
		const payload = context.payload.body as any;
		const headers = context.payload.headers as Record<string, string | undefined>;
		const webhookInfo = await context.store.get<WebhookInformation>(TRIGGER_KEY);

		if (!webhookInfo) {
			return [];
		}

		if (headers && headers['smartsheet-hook-challenge']) {
			return [];
		}

		const webhookSecret = webhookInfo?.sharedSecret;
		const webhookSignatureHeader = context.payload.headers['smartsheet-hmac-sha256'];
		const rawBody = context.payload.rawBody;

		if (!verifyWebhookSignature(webhookSecret, webhookSignatureHeader, rawBody)) {
			return [];
		}

		if (payload.newWebhookStatus) {
			return [];
		}
		if (!payload.events || !Array.isArray(payload.events) || payload.events.length === 0) {
			return [];
		}

		const updatedRowEvents = [];
		for (const event of payload.events) {
			if (event.objectType === 'row' && event.eventType === 'updated') {
				const eventOutput: any = { ...event, sheetId: payload.scopeObjectId?.toString() };
				const objectSheetId = payload.scopeObjectId?.toString();
				if (objectSheetId) {
					try {
						eventOutput.rowData = await getSheetRowDetails(
							context.auth as string,
							objectSheetId,
							event.id.toString(),
						);
					} catch (error: any) {
						eventOutput.fetchError = error.message;
					}
				} else {
					eventOutput.fetchError = 'scopeObjectId missing';
				}

				updatedRowEvents.push(eventOutput);
			}
		}
		return updatedRowEvents;
	},
});
